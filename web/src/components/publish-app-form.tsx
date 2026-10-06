"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { APP_RELEASES_BUCKET, assertApkUpload } from "@/lib/app-release";

export function PublishAppForm({
  latest,
}: {
  latest: { version_name: string; version_code: number } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    setProgress(0);
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("apk") as File | null;
    const versionName = String(data.get("version_name") ?? "").trim();
    const versionCode = Number(data.get("version_code"));
    const notes = String(data.get("notes") ?? "").trim();
    const forceUpdate = data.get("force_update") === "on";

    try {
      if (!file) throw new Error("Elige la APK");
      assertApkUpload(file);

      const prep = await fetch("/api/app/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          version_code: versionCode,
          version_name: versionName,
          notes,
          force_update: forceUpdate,
          file_name: file.name,
          file_size: file.size,
        }),
      });
      const prepJson = (await prep.json()) as { path?: string; token?: string; error?: string };
      if (!prep.ok || !prepJson.path || !prepJson.token) {
        throw new Error(prepJson.error ?? "No se pudo preparar la subida");
      }

      const sb = createBrowserSupabase();
      const { error: upErr } = await sb.storage
        .from(APP_RELEASES_BUCKET)
        .uploadToSignedUrl(prepJson.path, prepJson.token, file);
      if (upErr) throw new Error(upErr.message);
      setProgress(80);

      const commit = await fetch("/api/app/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          path: prepJson.path,
          version_code: versionCode,
          version_name: versionName,
          notes,
          force_update: forceUpdate,
        }),
      });
      const commitJson = (await commit.json()) as { error?: string };
      if (!commit.ok) throw new Error(commitJson.error ?? "No se pudo publicar");

      setProgress(100);
      setOk(`Versión ${versionName} (+${versionCode}) enviada a los celulares de bodega.`);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="row" onSubmit={(e) => void onSubmit(e)}>
      <p className="muted" style={{ width: "100%" }}>
        {latest
          ? `Última publicada: ${latest.version_name} (build ${latest.version_code}). El siguiente build debe ser mayor.`
          : "Todavía no hay una APK publicada. La primera hay que instalarla a mano en el celular; desde la siguiente el encargado actualiza en la app."}
      </p>
      <label>
        Versión
        <input name="version_name" required placeholder="1.0.3" defaultValue="" />
      </label>
      <label>
        Build
        <input
          name="version_code"
          type="number"
          min={1}
          required
          placeholder={latest ? String(latest.version_code + 1) : "4"}
        />
      </label>
      <label>
        Qué cambió
        <input name="notes" placeholder="Corregir patente y avisos de stock" />
      </label>
      <label>
        APK
        <input name="apk" type="file" accept=".apk,application/vnd.android.package-archive" required />
      </label>
      <label>
        Obligatorio
        <input name="force_update" type="checkbox" defaultChecked />
      </label>
      <button className="btn" disabled={busy} type="submit">
        {busy ? "Enviando…" : "Enviar a los celulares"}
      </button>
      {progress != null && busy ? <p className="muted">Subiendo APK… {progress}%</p> : null}
      {error ? <p className="err">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
    </form>
  );
}
