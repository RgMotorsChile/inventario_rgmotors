"use client";

import { useEffect, useMemo, useState } from "react";
import { plateNorm, whenDate, whenTime } from "@/lib/format";
import type { VehicleDelivery, VehicleRow } from "@/lib/types";

function outcomeLabel(value: string | null) {
  switch (value) {
    case "instalado":
      return "Instalado en la unidad";
    case "usado":
      return "Usado en la unidad";
    case "danado":
      return "Dañado en la unidad";
    case "extraviado":
      return "Marcado extraviado";
    default:
      return "Entregado a la unidad";
  }
}

function reportText(vehicle: VehicleRow, rows: VehicleDelivery[]) {
  const head = [
    "INFORME DE ENTREGAS · RG MOTORS",
    `Patente ${vehicle.plate} · ${vehicle.brand} ${vehicle.model} ${vehicle.year} · ${vehicle.color}`,
    `Estado: ${vehicle.status}`,
    `Entregas: ${rows.length}`,
    "",
  ];
  const body = rows.map((row, index) =>
    [
      `${index + 1}. ${whenDate(row.created_at)} · ${whenTime(row.created_at)}`,
      `   Elemento: ${row.item_name} ×${row.qty}`,
      `   Responsable: ${row.worker_name}`,
      `   Destino: ${outcomeLabel(row.outcome)} (${vehicle.plate})`,
      `   Registró: ${row.user_name}`,
      row.note ? `   Nota: ${row.note}` : null,
      "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [...head, ...body, "Si se pierde una pieza, este informe indica quién la sacó, en qué unidad quedó y cuándo."].join("\n");
}

export function VehicleTable({
  vehicles,
  deliveries,
}: {
  vehicles: VehicleRow[];
  deliveries?: Record<string, VehicleDelivery[]>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<VehicleRow | null>(null);
  const [copied, setCopied] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => `${v.plate} ${v.brand} ${v.model} ${v.status}`.toLowerCase().includes(q));
  }, [vehicles, query]);

  const reportRows = open ? (deliveries?.[plateNorm(open.plate)] ?? []) : [];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function copyReport() {
    if (!open) return;
    await navigator.clipboard.writeText(reportText(open, reportRows));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <div className="row">
        <label>
          Buscar patente o modelo
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="THZF, Hilux, Partner…"
          />
        </label>
      </div>
      <p className="muted">
        {visible.length} de {vehicles.length} unidades
      </p>
      <div className="table-wrap desktop-only">
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Unidad</th>
              <th>Año</th>
              <th>Color</th>
              <th>Estado</th>
              {deliveries ? <th>Entregas</th> : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((v) => {
              const rows = deliveries?.[plateNorm(v.plate)] ?? [];
              return (
                <tr key={v.id}>
                  <td>{v.plate}</td>
                  <td>
                    {v.brand} {v.model}
                  </td>
                  <td>{v.year}</td>
                  <td>{v.color}</td>
                  <td>{v.status}</td>
                  {deliveries ? (
                    <td>
                      {rows.length === 0 ? (
                        "Sin entregas"
                      ) : (
                        <div className="table-actions" style={{ justifyContent: "flex-start" }}>
                          <span className="muted">
                            {rows.length} {rows.length === 1 ? "entrega" : "entregas"}
                          </span>
                          <button className="btn small" type="button" onClick={() => setOpen(v)}>
                            Informe
                          </button>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="item-list mobile-only">
        {visible.map((v) => {
          const rows = deliveries?.[plateNorm(v.plate)] ?? [];
          return (
            <article className="item-card" key={v.id}>
              <div className="item-card-top">
                <strong>{v.plate}</strong>
                <span className="pill">{v.status}</span>
              </div>
              <p className="muted">
                {v.brand} {v.model} · {v.year} · {v.color}
              </p>
              {deliveries ? (
                <div className="item-card-meta">
                  {rows.length === 0 ? (
                    <span>Sin entregas</span>
                  ) : (
                    <>
                      <span>
                        {rows.length} {rows.length === 1 ? "entrega" : "entregas"}
                      </span>
                      <button className="btn small" type="button" onClick={() => setOpen(v)}>
                        Informe
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {open ? (
        <div className="dialog-back" onClick={() => setOpen(null)}>
          <div
            className="card dialog dialog-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-report-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Rastro</p>
            <h2 id="delivery-report-title">Informe de entregas · {open.plate}</h2>
            <p className="lead">
              {open.brand} {open.model} {open.year} · {open.color}. Fecha, hora, elemento y quién lo sacó de bodega.
            </p>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Elemento</th>
                  <th>Responsable</th>
                  <th>Destino</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ textTransform: "capitalize" }}>{whenDate(row.created_at)}</td>
                    <td>
                      <strong>{whenTime(row.created_at)}</strong>
                    </td>
                    <td>
                      <strong>{row.item_name}</strong>
                      <div className="muted">×{row.qty}</div>
                    </td>
                    <td>{row.worker_name}</td>
                    <td>
                      {outcomeLabel(row.outcome)}
                      {row.note ? <div className="muted">{row.note}</div> : null}
                      <div className="muted">Registró {row.user_name}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted" style={{ margin: 0 }}>
              Si se pierde una pieza, este informe indica quién la sacó, en qué unidad quedó y cuándo.
            </p>
            <div className="table-actions">
              <button className="btn ghost" type="button" onClick={() => setOpen(null)}>
                Cerrar
              </button>
              <button className="btn ghost" type="button" onClick={() => void copyReport()}>
                {copied ? "Copiado" : "Copiar informe"}
              </button>
              <button className="btn" type="button" onClick={() => window.print()}>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
