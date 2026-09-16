"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/insforge/client";

type Item = { sku: string; name: string };

export function CreateBoxForm({ items }: { items: Item[] }) {
  const router = useRouter();
  const [lines, setLines] = useState([{ sku: items[0]?.sku ?? "", qty: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const { error: rpcError } = await createClient().database.rpc("create_box", {
      p_code: String(data.get("code")),
      p_barcode: String(data.get("barcode")),
      p_supplier: String(data.get("supplier")),
      p_guide: String(data.get("guide")),
      p_lines: lines.filter((l) => l.sku && l.qty > 0),
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    event.currentTarget.reset();
    setLines([{ sku: items[0]?.sku ?? "", qty: 1 }]);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>Nueva caja</h2>
      <div className="row">
        <label>
          Código
          <input name="code" required placeholder="RG-CAJA-00483" />
        </label>
        <label>
          Código de barras
          <input name="barcode" required placeholder="7804629004838" />
        </label>
        <label>
          Proveedor
          <input name="supplier" required />
        </label>
        <label>
          Guía
          <input name="guide" required />
        </label>
      </div>
      {lines.map((line, index) => (
        <div className="row" key={index}>
          <label>
            SKU
            <select
              value={line.sku}
              onChange={(e) => {
                const next = [...lines];
                next[index] = { ...line, sku: e.target.value };
                setLines(next);
              }}
            >
              {items.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <input
              type="number"
              min={1}
              value={line.qty}
              onChange={(e) => {
                const next = [...lines];
                next[index] = { ...line, qty: Number(e.target.value) };
                setLines(next);
              }}
            />
          </label>
        </div>
      ))}
      <div className="row">
        <button
          className="btn ghost"
          type="button"
          onClick={() => setLines([...lines, { sku: items[0]?.sku ?? "", qty: 1 }])}
        >
          Otra línea
        </button>
        <button className="btn" disabled={busy} type="submit">
          {busy ? "Creando…" : "Crear caja para bodega"}
        </button>
      </div>
      {error ? <p className="err">{error}</p> : null}
    </form>
  );
}
