"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiJson } from "@/lib/api-json";

export function SyncVehiclesButton({
  endpoint = "/api/bodega/sync-vehicles",
  idleLabel = "Leer stock ahora",
  busyLabel = "Leyendo stock…",
}: {
  endpoint?: string;
  idleLabel?: string;
  busyLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function syncNow() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(endpoint, { method: "POST", redirect: "manual" });
      const payload = await readApiJson<{
        error?: string;
        read?: number;
        sources?: Record<string, number>;
        result?: { inserted?: number; updated?: number };
      }>(res);
      if (!res.ok || payload.error) {
        setError(payload.error ?? "No se pudo sincronizar");
        return;
      }
      const fromSheets = payload.sources
        ? Object.entries(payload.sources)
            .map(([name, count]) => `${name} ${count}`)
            .join(" · ")
        : "";
      setOk(
        `Leídas ${payload.read ?? 0} patentes${fromSheets ? ` (${fromSheets})` : ""}. Nuevas: ${payload.result?.inserted ?? 0}. Actualizadas: ${payload.result?.updated ?? 0}.`,
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
        {busy ? busyLabel : idleLabel}
      </button>
      {error ? <p className="err">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
    </div>
  );
}
