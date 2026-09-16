import { PageHead } from "@/components/page-head";
import { requireManagement } from "@/lib/auth";
import { plateNorm, when } from "@/lib/format";

export const dynamic = "force-dynamic";

function outcomeLabel(value: string | null) {
  switch (value) {
    case "instalado":
      return "Instalado";
    case "usado":
      return "Entregado";
    case "danado":
      return "Dañado";
    case "extraviado":
      return "Extraviado";
    default:
      return value ?? "—";
  }
}

export default async function HistorialPage() {
  const { db } = await requireManagement();
  const [{ data: vehicles }, { data: workers }, { data: movements }, { data: items }] = await Promise.all([
    db.from("vehicles").select("*").order("brand"),
    db.from("workers").select("*").order("full_name"),
    db.from("movements").select("*").order("created_at", { ascending: false }).limit(400),
    db.from("items").select("sku,name"),
  ]);

  const nameOf = (sku: string) => items?.find((i) => i.sku === sku)?.name ?? sku;
  const history = movements ?? [];
  const delivered = history.filter((m) => ["uso", "dano", "asignacion"].includes(m.type));

  return (
    <>
      <PageHead
        eyebrow="Rastro"
        title="Historial"
        lead="Libro de ingresos y entregas. Quién recibió, en qué patente y qué se sumó a bodega."
      />
      <div className="card">
        <h2>Por vehículo</h2>
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Unidad</th>
              <th>Entregas</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v) => {
              const used = delivered.filter((m) => plateNorm(m.plate) === plateNorm(v.plate));
              return (
                <tr key={v.id}>
                  <td>{v.plate}</td>
                  <td>
                    {v.brand} {v.model}
                  </td>
                  <td>
                    {used.length === 0
                      ? "Sin entregas"
                      : used.map((m) => `${nameOf(m.item_sku)} ×${m.qty} · ${m.worker_name ?? ""}`).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>Por responsable</h2>
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
                    {done.length === 0 ? "Sin entregas" : done.map((m) => `${nameOf(m.item_sku)} ×${m.qty}`).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>Movimientos</h2>
        <table>
          <thead>
            <tr>
              <th>Cuándo</th>
              <th>Tipo</th>
              <th>Elemento</th>
              <th>Responsable / patente</th>
              <th>Registró</th>
            </tr>
          </thead>
          <tbody>
            {history.map((m) => (
              <tr key={m.id}>
                <td>{when(m.created_at)}</td>
                <td>{m.type === "uso" ? outcomeLabel(m.outcome) : m.type}</td>
                <td>
                  {nameOf(m.item_sku)} ×{m.qty}
                </td>
                <td>{m.plate ?? m.worker_name ?? m.note ?? "—"}</td>
                <td>{m.user_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
