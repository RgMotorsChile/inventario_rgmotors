import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { when } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RastroPage() {
  const { supabase, profile } = await requireManagement();
  const [{ data: vehicles }, { data: workers }, { data: movements }, { data: assignments }, { data: items }] =
    await Promise.all([
      supabase.from("vehicles").select("*").order("brand"),
      supabase.from("workers").select("*").order("full_name"),
      supabase.from("movements").select("*").eq("type", "uso").order("created_at", { ascending: false }),
      supabase.from("assignments").select("*").eq("status", "abierta"),
      supabase.from("items").select("sku,name"),
    ]);

  const nameOf = (sku: string) => items?.find((i) => i.sku === sku)?.name ?? sku;

  return (
    <Shell path="/rastro" name={profile.full_name}>
      <h1>Rastro de elementos</h1>
      <p className="lead">En qué patente se usó cada pieza y qué tiene cada trabajador ahora.</p>
      <div className="card">
        <h2>Vehículos</h2>
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Unidad</th>
              <th>Usado desde bodega</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v) => {
              const used = (movements ?? []).filter((m) => m.plate === v.plate);
              return (
                <tr key={v.id}>
                  <td>{v.plate}</td>
                  <td>
                    {v.brand} {v.model}
                  </td>
                  <td>
                    {used.length === 0
                      ? "Sin elementos de bodega"
                      : used.map((m) => `${nameOf(m.item_sku)} ×${m.qty} (${when(m.created_at)})`).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Trabajadores</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>A cargo ahora</th>
            </tr>
          </thead>
          <tbody>
            {(workers ?? []).map((w) => {
              const open = (assignments ?? []).filter((a) => a.worker_id === w.id);
              return (
                <tr key={w.id}>
                  <td>{w.full_name}</td>
                  <td>{w.job_title}</td>
                  <td>
                    {open.length === 0
                      ? "Sin elementos"
                      : open.map((a) => `${nameOf(a.item_sku)} ×${a.qty}`).join(" · ")}
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
