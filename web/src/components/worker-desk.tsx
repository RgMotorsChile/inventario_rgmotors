"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { callRpc } from "@/lib/call-rpc";
import type { WorkerRow } from "@/lib/types";

type Dialog =
  | { kind: "edit"; worker: WorkerRow }
  | { kind: "remove"; worker: WorkerRow }
  | null;

export function WorkerDesk({ workers }: { workers: WorkerRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, busy]);

  async function saveWorker(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog?.kind !== "edit") return;
    setBusy(true);
    setError(null);
    setOk(null);
    const data = new FormData(event.currentTarget);
    const { error: rpcError } = await callRpc("upsert_worker", {
      p_id: dialog.worker.id,
      p_full_name: String(data.get("full_name") ?? "").trim(),
      p_job_title: String(data.get("job_title") ?? "").trim(),
      p_active: data.get("active") === "on",
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setDialog(null);
    setOk("Datos actualizados.");
    router.refresh();
  }

  async function removeWorker() {
    if (dialog?.kind !== "remove") return;
    setBusy(true);
    setError(null);
    setOk(null);
    const { data, error: rpcError } = await callRpc("delete_worker", { p_id: dialog.worker.id });
    if (rpcError) {
      const { error: fallbackError } = await callRpc("upsert_worker", {
        p_id: dialog.worker.id,
        p_full_name: dialog.worker.full_name,
        p_job_title: dialog.worker.job_title,
        p_active: false,
      });
      setBusy(false);
      if (fallbackError) {
        setError(fallbackError.message);
        return;
      }
      setDialog(null);
      setOk(`${dialog.worker.full_name} quedó de baja y ya no aparece en bodega.`);
      router.refresh();
      return;
    }
    setBusy(false);
    const result = (data ?? {}) as { deleted?: boolean; deactivated?: boolean; name?: string };
    setDialog(null);
    setOk(
      result.deleted
        ? `${result.name ?? "Trabajador"} fue eliminado.`
        : `${result.name ?? "Trabajador"} quedó de baja. El historial se conserva.`,
    );
    router.refresh();
  }

  return (
    <>
      {ok ? <p className="ok">{ok}</p> : null}
      {error && !dialog ? <p className="err">{error}</p> : null}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((w) => (
            <tr key={w.id}>
              <td>
                <strong>{w.full_name}</strong>
              </td>
              <td>{w.job_title}</td>
              <td className={w.active ? "ok" : "bad"}>{w.active ? "Activo" : "Baja"}</td>
              <td>
                <div className="table-actions">
                  <button className="btn ghost small" type="button" onClick={() => setDialog({ kind: "edit", worker: w })}>
                    Editar
                  </button>
                  <button className="btn danger small" type="button" onClick={() => setDialog({ kind: "remove", worker: w })}>
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {dialog ? (
        <div className="dialog-back" onClick={() => (!busy ? setDialog(null) : undefined)}>
          <div
            className="card dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="worker-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {dialog.kind === "edit" ? (
              <form onSubmit={saveWorker}>
                <p className="eyebrow">Persona</p>
                <h2 id="worker-dialog-title">Editar trabajador</h2>
                <label>
                  Nombre
                  <input name="full_name" defaultValue={dialog.worker.full_name} required autoFocus />
                </label>
                <label>
                  Cargo
                  <input name="job_title" defaultValue={dialog.worker.job_title} required />
                </label>
                <label className="check">
                  <input name="active" type="checkbox" defaultChecked={dialog.worker.active} />
                  Activo en bodega
                </label>
                {error ? <p className="err">{error}</p> : null}
                <div className="table-actions">
                  <button className="btn ghost" type="button" disabled={busy} onClick={() => setDialog(null)}>
                    Cancelar
                  </button>
                  <button className="btn" disabled={busy} type="submit">
                    {busy ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="eyebrow">Cuidado</p>
                <h2 id="worker-dialog-title">¿Quitar a {dialog.worker.full_name}?</h2>
                <p className="lead">
                  Si no tiene historial se borra. Si ya entregó o recibió algo, queda de baja y no aparece en la app de
                  bodega.
                </p>
                {error ? <p className="err">{error}</p> : null}
                <div className="table-actions">
                  <button className="btn ghost" type="button" disabled={busy} onClick={() => setDialog(null)}>
                    Cancelar
                  </button>
                  <button className="btn danger" type="button" disabled={busy} onClick={() => void removeWorker()}>
                    {busy ? "Quitando…" : "Sí, quitar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
