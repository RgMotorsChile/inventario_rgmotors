"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/insforge/client";
import { clp, itemStatus } from "@/lib/format";
import type { AssignmentRow, ItemRow, MovementRow } from "@/lib/types";

function asItems(rows: ItemRow[] | null | undefined): ItemRow[] {
  return rows ?? [];
}

export function LiveKpis({
  initialItems,
  initialAssignments,
}: {
  initialItems: ItemRow[];
  initialAssignments: AssignmentRow[];
}) {
  const [items, setItems] = useState(asItems(initialItems));
  const [assignments, setAssignments] = useState(initialAssignments ?? []);

  useInventoryRealtime(setItems, setAssignments);

  const value = items.reduce((s, i) => s + Number(i.stock) * Number(i.unit_cost), 0);
  const low = items.filter((i) => i.stock <= i.min_stock);
  const open = assignments.filter((a) => a.status === "abierta");
  const custody = open.reduce((s, a) => {
    const item = items.find((i) => i.sku === a.item_sku);
    return s + Number(a.qty) * Number(item?.unit_cost ?? 0);
  }, 0);

  return (
    <div className="kpis">
      <div className="card kpi">
        <div className="label">Valor bodega</div>
        <div className="value ok">{clp.format(value)}</div>
        <div className="hint">Costo × unidades en piso</div>
      </div>
      <div className="card kpi">
        <div className="label">SKUs / unidades</div>
        <div className="value">
          {items.length} / {items.reduce((s, i) => s + Number(i.stock), 0)}
        </div>
        <div className="hint">Catálogo activo</div>
      </div>
      <div className="card kpi">
        <div className="label">En poder de gente</div>
        <div className="value warn">{clp.format(custody)}</div>
        <div className="hint">Asignaciones abiertas</div>
      </div>
      <div className="card kpi">
        <div className="label">Alertas stock</div>
        <div className="value bad">{low.length}</div>
        <div className="hint">En o bajo el mínimo</div>
      </div>
    </div>
  );
}

export function LiveStockTable({
  initialItems,
  categories,
}: {
  initialItems: ItemRow[];
  categories: string[];
}) {
  const [items, setItems] = useState(asItems(initialItems));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");

  useInventoryRealtime(setItems);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const catOk = category === "Todas" || i.category === category;
      const hay = `${i.name} ${i.sku} ${i.brand} ${i.category} ${i.compatible}`.toLowerCase();
      return catOk && (q === "" || hay.includes(q));
    });
  }, [items, query, category]);

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="toolbar">
        <div>
          <p className="eyebrow">En vivo</p>
          <h2 style={{ margin: 0 }}>Stock de bodega</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Se actualiza cuando bodega suma o descuenta
        </p>
      </div>
      <div className="row">
        <label>
          Buscar
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="barra hilux, maxus…" />
        </label>
        <label>
          Categoría
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Todas</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Elemento</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Mínimo</th>
            <th>Estado</th>
            <th>Ubicación</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((i) => {
            const status = itemStatus(i.stock, i.min_stock);
            return (
              <tr key={i.sku}>
                <td>
                  <strong>{i.name}</strong>
                  <div className="muted">
                    {i.sku} · {i.brand}
                  </div>
                </td>
                <td>{i.category}</td>
                <td>{i.stock}</td>
                <td>{i.min_stock}</td>
                <td className={status.tone}>{status.label}</td>
                <td>{i.location}</td>
                <td>{clp.format(Number(i.stock) * Number(i.unit_cost))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LiveMoves({ initial }: { initial: MovementRow[] }) {
  const [rows, setRows] = useState(initial ?? []);
  useEffect(() => {
    const db = createClient().database;
    const load = async () => {
      const { data } = await db.from("movements").select("*").order("created_at", { ascending: false }).limit(10);
      setRows((data as MovementRow[]) ?? []);
    };
    const timer = window.setInterval(() => {
      void load();
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <p className="eyebrow">Actividad</p>
      <h2>Últimos movimientos</h2>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>SKU</th>
            <th>Destino</th>
            <th>Quién</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td>{m.type}</td>
              <td>
                {m.item_sku} ×{m.qty}
              </td>
              <td>{m.plate ?? m.worker_name ?? m.note ?? "—"}</td>
              <td>{m.user_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useInventoryRealtime(
  setItems: (rows: ItemRow[]) => void,
  setAssignments?: (rows: AssignmentRow[]) => void,
) {
  useEffect(() => {
    const db = createClient().database;
    const reload = async () => {
      const { data } = await db.from("items").select("*").order("name");
      setItems((data as ItemRow[]) ?? []);
      if (setAssignments) {
        const { data: asg } = await db.from("assignments").select("*").eq("status", "abierta");
        setAssignments((asg as AssignmentRow[]) ?? []);
      }
    };
    const timer = window.setInterval(() => {
      void reload();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [setItems, setAssignments]);
}
