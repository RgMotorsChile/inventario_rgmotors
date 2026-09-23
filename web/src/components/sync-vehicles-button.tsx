"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncVehiclesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function syncNow() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/bodega/sync-vehicles", { method: "POST" });
      const payload = (await res.json()) as {
        error?: string;
        read?: number;
        result?: { inserted?: number; updated?: number };
      };
      if (!res.ok || payload.error) {
        setError(payload.error ?? "No se pudo sincronizar");
        return;
      }
      setOk(
        `Leídas ${payload.read ?? 0} patentes. Nuevas: ${payload.result?.inserted ?? 0}. Actualizadas: ${payload.result?.updated ?? 0}.`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn ghost" disabled={busy} onClick={syncNow} type="button">
        {busy ? "Leyendo stock…" : "Leer stock ahora"}
      </button>
      {error ? <p className="err">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
    </div>
  );
}
