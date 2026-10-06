"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { callRpc } from "@/lib/call-rpc";
import { canCorrectDeliveryPlate } from "@/lib/format";

export function CorrectPlateButton({
  movementId,
  currentPlate,
  createdAt,
  type,
  itemLabel,
}: {
  movementId: string;
  currentPlate: string | null | undefined;
  createdAt: string;
  type?: string | null;
  itemLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plate, setPlate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if ((type && !["uso", "dano"].includes(type)) || !currentPlate || !canCorrectDeliveryPlate(createdAt)) {
    return null;
  }

  async function save() {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await callRpc("correct_delivery_plate", {
      p_movement_id: movementId,
      p_plate: plate.trim(),
      p_note: note.trim() || null,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setOpen(false);
    setPlate("");
    setNote("");
    router.refresh();
  }

  return (
    <>
      <button className="btn small ghost" type="button" onClick={() => setOpen(true)}>
        Corregir
      </button>
      {open ? (
        <div className="dialog-back" style={{ zIndex: 60 }} onClick={() => !busy && setOpen(false)}>
          <div
            className="card dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="correct-plate-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Entrega</p>
            <h2 id="correct-plate-title">Corregir destino</h2>
            <p className="lead">
              {itemLabel ? `${itemLabel} · ` : ""}Hoy está en {currentPlate}. Solo cambia la patente. El stock no se toca.
            </p>
            <label>
              Patente correcta
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="THZF 75"
                autoComplete="off"
              />
            </label>
            <label>
              Nota (opcional)
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Se asignó a la patente equivocada"
              />
            </label>
            {error ? <p className="err">{error}</p> : null}
            <div className="table-actions">
              <button className="btn ghost" type="button" disabled={busy} onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn" type="button" disabled={busy || !plate.trim()} onClick={() => void save()}>
                {busy ? "Guardando…" : "Guardar patente"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
