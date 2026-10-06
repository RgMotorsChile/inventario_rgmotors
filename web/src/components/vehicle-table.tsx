"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CorrectPlateButton } from "@/components/correct-plate-button";
import { VehicleObservation } from "@/components/vehicle-observation";
import { plateNorm, whenDate, whenTime } from "@/lib/format";
import { filterVehicles, uniqueSorted } from "@/lib/vehicle-search";
import type { VehicleDelivery, VehicleRow } from "@/lib/types";
import "./patio.css";

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
    "INFORME DE UNIDAD · RG MOTORS",
    `Patente ${vehicle.plate} · ${vehicle.brand} ${vehicle.model} ${vehicle.year} · ${vehicle.color}`,
    `Estado: ${vehicle.status}`,
    vehicle.supplier ? `Proveedor: ${vehicle.supplier}` : null,
    vehicle.location ? `Ubicación: ${vehicle.location}` : null,
    `Observación: ${vehicle.note?.trim() || "Sin observación"}`,
    `Entregas de bodega: ${rows.length}`,
    "",
  ].filter(Boolean);
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
  showPurchaseLot = false,
}: {
  vehicles: VehicleRow[];
  deliveries?: Record<string, VehicleDelivery[]>;
  showPurchaseLot?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [supplier, setSupplier] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();
  const [rows, setRows] = useState(vehicles);
  const [sheet, setSheet] = useState<VehicleRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRows(vehicles);
  }, [vehicles]);

  const suppliers = useMemo(() => uniqueSorted(rows.map((v) => v.supplier)), [rows]);
  const locations = useMemo(() => uniqueSorted(rows.map((v) => v.location)), [rows]);
  const visible = useMemo(
    () => filterVehicles(rows, query, supplier, location),
    [rows, query, supplier, location],
  );
  const reportRows = sheet ? (deliveries?.[plateNorm(sheet.plate)] ?? []) : [];

  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  async function copyReport() {
    if (!sheet) return;
    await navigator.clipboard.writeText(reportText(sheet, reportRows));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function saveNote(note: string) {
    if (!sheet) return;
    setRows((list) => list.map((v) => (v.id === sheet.id ? { ...v, note } : v)));
    setSheet((cur) => (cur ? { ...cur, note } : cur));
    router.refresh();
  }

  return (
    <>
      <div className="patio-filters">
        <label>
          Patente o modelo
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="THZF, Hilux, Partner…"
            autoComplete="off"
            inputMode="search"
          />
        </label>
        <label>
          Proveedor
          <select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            <option value="">Todos</option>
            {suppliers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ubicación
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Todas</option>
            {locations.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted patio-count">
        {visible.length} de {rows.length} unidades. Toca una ficha o Dejar observación.
      </p>
      <div className="patio-list">
        {visible.map((vehicle) => {
          const note = vehicle.note?.trim() ?? "";
          return (
            <article className="patio-card" key={vehicle.id} onClick={() => setSheet(vehicle)}>
              <div className="patio-card-top">
                <strong>{vehicle.plate}</strong>
                <span className="pill">{vehicle.status}</span>
              </div>
              <p className="patio-card-unit">
                {vehicle.brand} {vehicle.model}
                <span>
                  {vehicle.year} · {vehicle.color}
                </span>
              </p>
              <dl className="patio-facts">
                <div>
                  <dt>Proveedor</dt>
                  <dd>{vehicle.supplier?.trim() || "Sin proveedor"}</dd>
                </div>
                <div>
                  <dt>Ubicación</dt>
                  <dd>{vehicle.location?.trim() || "Sin ubicación"}</dd>
                </div>
                {showPurchaseLot && vehicle.purchase_lot?.trim() ? (
                  <div>
                    <dt>Mes</dt>
                    <dd>{vehicle.purchase_lot}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="patio-card-note">
                <span>Observaciones</span>
                <p className="note-preview">{note || "Sin observación"}</p>
                <button
                  className="btn small observe-chip"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSheet(vehicle);
                  }}
                >
                  {note ? "Editar observación" : "Dejar observación"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {sheet ? (
        <div className="dialog-back patio-dialog-back" onClick={() => setSheet(null)}>
          <div
            className="card dialog dialog-wide patio-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-file-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="patio-sheet-head">
              <div>
                <p className="eyebrow">Informe de unidad</p>
                <h2 id="vehicle-file-title">{sheet.plate}</h2>
              </div>
              <button className="btn ghost patio-sheet-close" type="button" onClick={() => setSheet(null)}>
                Cerrar
              </button>
            </div>
            <p className="lead">
              {sheet.brand} {sheet.model} {sheet.year} · {sheet.color}
            </p>
            <div className="file-grid">
              <p>
                <span className="muted">Estado</span>
                <strong>{sheet.status}</strong>
              </p>
              <p>
                <span className="muted">Proveedor</span>
                <strong>{sheet.supplier?.trim() || "Sin proveedor"}</strong>
              </p>
              <p>
                <span className="muted">Ubicación</span>
                <strong>{sheet.location?.trim() || "Sin ubicación"}</strong>
              </p>
              <p>
                <span className="muted">Origen</span>
                <strong>{sheet.source || "Patio"}</strong>
              </p>
              {showPurchaseLot && sheet.purchase_lot?.trim() ? (
                <p>
                  <span className="muted">Mes de compra</span>
                  <strong>{sheet.purchase_lot}</strong>
                </p>
              ) : null}
            </div>
            <VehicleObservation
              vehicleId={sheet.id}
              initialNote={sheet.note ?? ""}
              onSaved={saveNote}
            />
            {reportRows.length > 0 ? (
              <>
                <h3>Elementos asignados a esta patente</h3>
                <div className="patio-deliveries">
                  {reportRows.map((row) => (
                    <article className="patio-delivery" key={row.id}>
                      <p>
                        {whenDate(row.created_at)} · <strong>{whenTime(row.created_at)}</strong>
                      </p>
                      <p>
                        <strong>{row.item_name}</strong> ×{row.qty}
                      </p>
                      <p className="muted">{row.worker_name}</p>
                      <p>{outcomeLabel(row.outcome)}</p>
                      {row.note ? <p className="muted">{row.note}</p> : null}
                      <p className="muted">Registró {row.user_name}</p>
                      <CorrectPlateButton
                        movementId={row.id}
                        currentPlate={sheet.plate}
                        createdAt={row.created_at}
                        itemLabel={row.item_name}
                      />
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">Esta unidad aún no tiene entregas de bodega.</p>
            )}
            <div className="table-actions patio-sheet-actions">
              <button className="btn ghost" type="button" onClick={() => setSheet(null)}>
                Cerrar
              </button>
              <button className="btn ghost" type="button" onClick={() => void copyReport()}>
                {copied ? "Copiado" : "Copiar ficha"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
