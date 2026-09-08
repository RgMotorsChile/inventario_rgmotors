import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { clp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, profile } = await requireManagement();
  const [{ data: items }, { data: assignments }, { data: movements }, { data: vehicles }] = await Promise.all([
    supabase.from("items").select("*"),
    supabase.from("assignments").select("*").eq("status", "abierta"),
    supabase.from("movements").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("vehicles").select("*"),
  ]);

  const catalog = items ?? [];
  const open = assignments ?? [];
  const low = catalog.filter((i) => i.stock <= i.min_stock);
  const value = catalog.reduce((s, i) => s + Number(i.stock) * Number(i.unit_cost), 0);
  const custody = open.reduce((s, a) => {
    const item = catalog.find((i) => i.sku === a.item_sku);
    return s + Number(a.qty) * Number(item?.unit_cost ?? 0);
  }, 0);
  const stale = open.filter((a) => Date.now() - new Date(a.created_at).getTime() >= 3 * 86400000);
  const preparing = (vehicles ?? []).filter((v) => v.status === "En preparación").length;

  return (
    <Shell path="/" name={profile.full_name}>
      <h1>Control de jefatura</h1>
      <p className="lead">
        Stock, alertas de cantidad y rastro de cada elemento: en qué camioneta se usó o a qué trabajador se asignó.
      </p>
      <div className="kpis">
        <div className="card">
          <div className="label">Valor bodega</div>
          <div className="value ok">{clp.format(value)}</div>
        </div>
        <div className="card">
          <div className="label">En poder de gente</div>
          <div className="value warn">{clp.format(custody)}</div>
        </div>
        <div className="card">
          <div className="label">Alertas stock</div>
          <div className="value bad">{low.length}</div>
        </div>
        <div className="card">
          <div className="label">Asig. 3+ días / patio</div>
          <div className="value">
            {stale.length} / {preparing}
          </div>
        </div>
      </div>
      <div className="row">
        <a className="btn" href="/api/export">
          Extraer stock completo a Excel
        </a>
        <a className="btn ghost" href="/rastro">
          Ver rastro
        </a>
      </div>
      <div className="card">
        <h2>Alertas de cantidad</h2>
        {low.length === 0 && stale.length === 0 ? <p className="muted">Sin alertas críticas.</p> : null}
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Detalle</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {low.map((i) => (
              <tr key={i.sku}>
                <td className={i.stock <= 0 ? "bad" : "warn"}>{i.stock <= 0 ? "Sin stock" : "Stock bajo"}</td>
                <td>
                  {i.name} · {i.sku}
                </td>
                <td>
                  {i.stock} / mín. {i.min_stock}
                </td>
              </tr>
            ))}
            {stale.map((a) => (
              <tr key={a.id}>
                <td className="warn">Asignación vencida</td>
                <td>{a.item_sku}</td>
                <td>{Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000)} días · {a.qty} u.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
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
            {(movements ?? []).map((m) => (
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
    </Shell>
  );
}
