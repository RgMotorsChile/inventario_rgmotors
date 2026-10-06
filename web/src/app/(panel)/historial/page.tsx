import Link from "next/link";
import { CorrectPlateButton } from "@/components/correct-plate-button";
import { EvidenceThumbs } from "@/components/evidence-thumbs";
import { PageHead } from "@/components/page-head";
import { requireManagement } from "@/lib/auth";
import { loadReceivePhotos, signEvidencePaths } from "@/lib/evidence";
import { plateNorm, when } from "@/lib/format";
import {
  PLATE_EXIT_TYPES,
  movementTypeLabel,
  movementsForPlate,
  outcomeLabel,
  parsePlateParam,
  platesWithExits,
  type PlateMovement,
} from "@/lib/plate-trace";

export const dynamic = "force-dynamic";

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string | string[] }>;
}) {
  const plate = parsePlateParam((await searchParams).patente);
  const { db } = await requireManagement();
  const [{ data: vehicles }, { data: workers }, { data: movements }, { data: plateRows }, { data: items }] =
    await Promise.all([
      db.from("vehicles").select("id,plate,brand,model,year").order("plate"),
      db.from("workers").select("*").order("full_name"),
      db.from("movements").select("*").order("created_at", { ascending: false }).limit(400),
      // Salidas a vehículos: se leen aparte para que el filtro por patente no dependa del límite de arriba.
      db
        .from("movements")
        .select("id,type,item_sku,qty,plate,worker_name,outcome,note,user_name,created_at")
        .in("type", [...PLATE_EXIT_TYPES])
        .order("created_at", { ascending: false })
        .limit(3000),
      db.from("items").select("sku,name"),
    ]);

  const nameOf = (sku: string) => items?.find((i) => i.sku === sku)?.name ?? sku;
  const exits = (plateRows ?? []) as PlateMovement[];
  const plates = platesWithExits(exits);
  const vehicleOf = (p: string | null) => (vehicles ?? []).find((v) => plateNorm(v.plate) === plateNorm(p));

  const filtered = plate ? movementsForPlate(exits, plate) : [];
  const filteredVehicle = plate ? vehicleOf(plate) : undefined;
  const filteredQty = filtered.reduce((sum, m) => sum + (Number(m.qty) || 0), 0);
  const history = plate ? movementsForPlate(movements ?? [], plate) : (movements ?? []);
  const delivered = (movements ?? []).filter((m) => ["uso", "dano", "asignacion"].includes(m.type));

  const receivePhotos = await loadReceivePhotos(history.map((m) => m.id));
  const signed = await signEvidencePaths(receivePhotos.map((p) => p.storage_path));
  const photosByMovement = new Map<string, string[]>();
  for (const p of receivePhotos) {
    if (!p.movement_id) continue;
    const url = signed.get(p.storage_path);
    if (!url) continue;
    const list = photosByMovement.get(p.movement_id) ?? [];
    list.push(url);
    photosByMovement.set(p.movement_id, list);
  }

  return (
    <>
      <PageHead
        eyebrow="Rastro"
        title="Historial"
        lead="Qué salió de bodega, a qué patente, quién lo instaló y quién lo registró."
      />
      <div className="card">
        <h2>Buscar por patente</h2>
        <form className="row filters" method="get" action="/historial">
          <label>
            Patente
            <input
              name="patente"
              defaultValue={plate}
              list="patentes-con-repuestos"
              placeholder="ABCD 12"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={12}
            />
          </label>
          <datalist id="patentes-con-repuestos">
            {plates.map((p) => (
              <option key={p.key} value={p.plate} />
            ))}
            {(vehicles ?? [])
              .filter((v) => !plates.some((p) => p.key === plateNorm(v.plate)))
              .map((v) => (
                <option key={v.id} value={v.plate} />
              ))}
          </datalist>
          <div className="table-actions filter-actions">
            <button className="btn" type="submit">
              Buscar
            </button>
            {plate ? (
              <Link className="btn ghost" href="/historial">
                Quitar filtro
              </Link>
            ) : null}
          </div>
        </form>

        {plate ? (
          <section aria-live="polite">
            <div className="toolbar">
              <div>
                <p className="eyebrow">Repuestos en</p>
                <h2>
                  {filteredVehicle?.plate ?? plate}
                  {filteredVehicle ? (
                    <span className="muted plate-unit">
                      {" "}
                      · {filteredVehicle.brand} {filteredVehicle.model}
                    </span>
                  ) : null}
                </h2>
              </div>
              {filtered.length > 0 ? (
                <a className="btn ghost" href={`/api/export?patente=${encodeURIComponent(plate)}`}>
                  Exportar Excel
                </a>
              ) : null}
            </div>
            {filtered.length === 0 ? (
              <p className="muted">
                {filteredVehicle
                  ? "Esta patente aún no tiene repuestos registrados."
                  : "No hay salidas con esa patente. Revisa que esté bien escrita."}
              </p>
            ) : (
              <>
                <p className="muted">
                  {filtered.length} {filtered.length === 1 ? "salida" : "salidas"} · {filteredQty}{" "}
                  {filteredQty === 1 ? "unidad" : "unidades"}
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Cuándo</th>
                        <th>Repuesto</th>
                        <th>Cant.</th>
                        <th>Resultado</th>
                        <th>Instaló / recibió</th>
                        <th>Registró</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m) => (
                        <tr key={m.id}>
                          <td>{when(m.created_at)}</td>
                          <td>
                            {nameOf(m.item_sku)}
                            {m.note ? <div className="muted cell-note">{m.note}</div> : null}
                          </td>
                          <td>{m.qty}</td>
                          <td>{outcomeLabel(m.outcome)}</td>
                          <td>{m.worker_name ?? "—"}</td>
                          <td>{m.user_name ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        ) : plates.length > 0 ? (
          <>
            <h3>Patentes con repuestos</h3>
            <div className="plate-links">
              {plates.map((p) => (
                <Link key={p.key} className="pill plate-link" href={`/historial?patente=${encodeURIComponent(p.plate)}`}>
                  {p.plate} <span className="muted">· {p.qty}</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Aún no hay salidas de repuestos a patentes.</p>
        )}
      </div>

      {plate ? null : (
        <div className="card">
          <h2>Por responsable</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cargo</th>
                  <th>Entregas</th>
                </tr>
              </thead>
              <tbody>
                {(workers ?? []).map((w) => {
                  const done = delivered.filter((m) => m.worker_id === w.id);
                  return (
                    <tr key={w.id}>
                      <td>{w.full_name}</td>
                      <td>{w.job_title}</td>
                      <td>
                        {done.length === 0
                          ? "Sin entregas"
                          : done
                              .map((m) => `${nameOf(m.item_sku)} ×${m.qty}${m.plate ? ` (${m.plate})` : ""}`)
                              .join(" · ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2>{plate ? `Movimientos de ${filteredVehicle?.plate ?? plate}` : "Movimientos"}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Tipo</th>
                <th>Elemento</th>
                <th>Patente</th>
                <th>Responsable</th>
                <th>Registró</th>
                <th>Evidencia</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    Sin movimientos.
                  </td>
                </tr>
              ) : null}
              {history.map((m) => (
                <tr key={m.id}>
                  <td>{when(m.created_at)}</td>
                  <td>{movementTypeLabel(m.type, m.outcome)}</td>
                  <td>
                    {nameOf(m.item_sku)} ×{m.qty}
                  </td>
                  <td>
                    {m.plate ? (
                      <Link className="plate-cell" href={`/historial?patente=${encodeURIComponent(m.plate)}`}>
                        {m.plate}
                      </Link>
                    ) : (
                      <span className="muted">—</span>
                    )}
                    <CorrectPlateButton
                      movementId={m.id}
                      currentPlate={m.plate}
                      createdAt={m.created_at}
                      type={m.type}
                      itemLabel={nameOf(m.item_sku)}
                    />
                  </td>
                  <td>{m.worker_name ?? (m.plate ? "—" : (m.note ?? "—"))}</td>
                  <td>{m.user_name}</td>
                  <td>
                    <EvidenceThumbs urls={photosByMovement.get(m.id) ?? []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
