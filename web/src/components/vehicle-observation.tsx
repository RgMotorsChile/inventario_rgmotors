"use client";

import { useEffect, useRef, useState } from "react";
import { readApiJson } from "@/lib/api-json";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
  }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function speechCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VehicleObservation({
  vehicleId,
  initialNote,
  onSaved,
}: {
  vehicleId: string;
  initialNote: string;
  onSaved?: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const media = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recognition = useRef<SpeechRec | null>(null);
  const finals = useRef("");
  const baseNote = useRef(initialNote);
  const noteRef = useRef(initialNote);

  function releaseMic() {
    recognition.current?.stop();
    recognition.current = null;
    const rec = media.current;
    media.current = null;
    if (!rec) return;
    rec.stream.getTracks().forEach((track) => track.stop());
    if (rec.state !== "inactive") rec.stop();
  }

  useEffect(() => {
    baseNote.current = initialNote;
    noteRef.current = initialNote;
    setNote(initialNote);
  }, [initialNote, vehicleId]);

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  useEffect(() => () => releaseMic(), []);

  async function startRec() {
    setError(null);
    setOk(null);
    finals.current = "";
    baseNote.current = noteRef.current;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Necesitamos el micrófono. Autoriza el permiso y vuelve a grabar.");
      return;
    }
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setError("Este celular no puede grabar audio aquí. Escribe la observación.");
      return;
    }
    chunks.current = [];
    rec.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    rec.start();
    media.current = rec;

    const Ctor = speechCtor();
    if (Ctor) {
      const speech = new Ctor();
      speech.lang = "es-CL";
      speech.continuous = true;
      speech.interimResults = true;
      speech.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const piece = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal) {
            finals.current = [finals.current, piece].filter(Boolean).join(" ");
          } else {
            interim = piece;
          }
        }
        const spoken = [finals.current, interim].filter(Boolean).join(" ").trim();
        const base = baseNote.current.trim();
        const next = base && spoken ? `${base}\n\n${spoken}` : spoken || base;
        noteRef.current = next;
        setNote(next);
      };
      speech.onerror = () => undefined;
      speech.start();
      recognition.current = speech;
    }
    setRecording(true);
  }

  async function stopRec() {
    const rec = media.current;
    recognition.current?.stop();
    recognition.current = null;
    media.current = null;
    if (!rec) {
      setRecording(false);
      return;
    }
    const blob = await new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }));
      rec.stop();
      rec.stream.getTracks().forEach((track) => track.stop());
    });
    setRecording(false);
    await save(blob);
  }

  async function save(audio?: Blob | null) {
    const text = noteRef.current.trim();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const body = new FormData();
      body.set("vehicleId", vehicleId);
      body.set("note", text);
      if (audio && audio.size > 0) {
        body.set("audio", audio, "observacion.webm");
      }
      const res = await fetch("/api/vehicles/observation", { method: "POST", body, redirect: "manual" });
      const payload = await readApiJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(payload.error ?? "No se pudo guardar");
      setOk(text ? "Observación guardada." : "Observación eliminada.");
      onSaved?.(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("¿Eliminar la observación de esta unidad?")) return;
    setNote("");
    noteRef.current = "";
    baseNote.current = "";
    await save();
  }

  return (
    <div className="observe">
      <label>
        Observación de jefatura
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          placeholder="Graba o escribe las observaciones de la unidad."
        />
      </label>
      <p className="muted">
        {speechCtor()
          ? "Puedes editar el texto, grabar o borrar. Al detener, el audio se transcribe y se guarda."
          : "En este navegador escribe la observación o graba el audio. La transcripción automática funciona en Chrome."}
      </p>
      <div className="observe-actions">
        <button
          className={recording ? "btn recording" : "btn"}
          type="button"
          disabled={busy}
          onClick={() => void (recording ? stopRec() : startRec())}
        >
          {recording ? (speechCtor() ? "Detener y transcribir" : "Detener y guardar") : "Grabar audio"}
        </button>
        <button className="btn ghost" type="button" disabled={busy || recording} onClick={() => void save()}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
        {initialNote.trim() || note.trim() ? (
          <button className="btn ghost" type="button" disabled={busy || recording} onClick={() => void remove()}>
            Eliminar observación
          </button>
        ) : null}
      </div>
      {error ? <p className="err">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
    </div>
  );
}
