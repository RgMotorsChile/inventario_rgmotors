"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/insforge/client";

export function SyncVehiclesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function syncNow() {
    setBusy(true);
    setError(null);
    setOk(null);
    const { data, error: invokeError } = await createClient().functions.invoke("sync-rg-motors-vehicles", {
      method: "POST",
    });
    setBusy(false);
    if (invokeError) {
      setError(invokeError.message);
      return;
    }
    const payload = data as { error?: string; read?: number; result?: { inserted?: number; updated?: number } };
    if (payload?.error) {
      setError(payload.error);
      return;
    }
    setOk(`Leídas ${payload?.read ?? 0} patentes. Nuevas: ${payload?.result?.inserted ?? 0}.`);
    router.refresh();
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
