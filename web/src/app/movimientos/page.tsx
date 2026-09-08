import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { when } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MovimientosPage() {
  const { supabase, profile } = await requireManagement();
  const [{ data: movements }, { data: items }] = await Promise.all([
    supabase.from("movements").select("*").order("created_at", { ascending: false }).limit(400),
    supabase.from("items").select("sku,name"),
  ]);
  const nameOf = (sku: string) => items?.find((i) => i.sku === sku)?.name ?? sku;

  return (
    <Shell path="/movimientos" name={profile.full_name}>
      <h1>Movimientos</h1>
      <p className="lead">Historial de usos, ingresos, asignaciones, devoluciones y ajustes.</p>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Elemento</th>
              <th>Cant.</th>
              <th>Patente / trabajador</th>
              <th>Registró</th>
            </tr>
          </thead>
          <tbody>
            {(movements ?? []).map((m) => (
              <tr key={m.id}>
                <td>{when(m.created_at)}</td>
                <td>{m.type}</td>
                <td>{nameOf(m.item_sku)}</td>
                <td>{m.qty}</td>
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
