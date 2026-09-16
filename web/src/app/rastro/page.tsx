import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { when } from "@/lib/format";

export const dynamic = "force-dynamic";

function plateNorm(value: string | null | undefined) {
  return (value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function outcomeLabel(value: string | null) {
  switch (value) {
    case "instalado":
      return "Instalado";
    case "usado":
      return "Usado";
    case "danado":
      return "Dañado";
    case "extraviado":
      return "Extraviado";
    default:
      return value ?? "—";
  }
}

export default async function RastroPage() {
  const { db, profile } = await requireManagement();
  const [{ data: vehicles }, { data: workers }, { data: movements }, { data: items }] = await Promise.all([
    db.from("vehicles").select("*").order("brand"),
    db.from("workers").select("*").order("full_name"),
    db
      .from("movements")
      .select("*")
      .in("type", ["uso", "dano", "asignacion"])
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("items").select("sku,name"),
  ]);

  const nameOf = (sku: string) => items?.find((i) => i.sku === sku)?.name ?? sku;
  const history = movements ?? [];

  return (
    <Shell path="/rastro" name={profile.full_name}>
      <h1>Rastro de elementos</h1>
      <p className="lead">
        Qué salió de bodega, a qué trabajador se entregó, en qué patente se instaló y si salió dañado o extraviado.
      </p>
      <div className="card">
        <h2>Historial</h2>
        <table>
          <thead>
            <tr>
              <th>Cuándo</th>
              <th>Elemento</th>
              <th>Trabajador</th>
              <th>Patente / uso</th>
              <th>Qué pasó</th>
            </tr>
          </thead>
          <tbody>
            {history.map((m) => (
              <tr key={m.id}>
                <td>{when(m.created_at)}</td>
                <td>
                  {nameOf(m.item_sku)} ×{m.qty}
                </td>
                <td>{m.worker_name ?? "—"}</td>
                <td>{m.plate ?? m.note ?? "—"}</td>
                <td className={m.outcome === "danado" || m.outcome === "extraviado" ? "bad" : ""}>
                  {outcomeLabel(m.outcome)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Por vehículo (patentes de la automotora)</h2>
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Unidad</th>
              <th>Qué se le instaló</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v) => {
              const used = history.filter((m) => plateNorm(m.plate) === plateNorm(v.plate));
              return (
                <tr key={v.id}>
                  <td>{v.plate}</td>
                  <td>
                    {v.brand} {v.model}
                  </td>
                  <td>
                    {used.length === 0
                      ? "Sin elementos de bodega"
                      : used.map((m) => `${nameOf(m.item_sku)} ×${m.qty} · ${m.worker_name ?? ""}`).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Por trabajador</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Entregas registradas</th>
            </tr>
          </thead>
          <tbody>
            {(workers ?? []).map((w) => {
              const done = history.filter((m) => m.worker_id === w.id);
              return (
                <tr key={w.id}>
                  <td>{w.full_name}</td>
                  <td>{w.job_title}</td>
                  <td>
                    {done.length === 0
                      ? "Sin entregas"
                      : done.map((m) => `${nameOf(m.item_sku)} ×${m.qty}`).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
