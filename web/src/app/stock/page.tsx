import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { clp, itemStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { supabase, profile } = await requireManagement();
  const { data: items } = await supabase.from("items").select("*").order("name");

  return (
    <Shell path="/stock" name={profile.full_name}>
      <h1>Stock completo</h1>
      <p className="lead">Inventario físico. Exporta Excel con alertas, vehículos y trabajadores.</p>
      <a className="btn" href="/api/export">
        Descargar Excel
      </a>
      <div className="card" style={{ marginTop: 18 }}>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Elemento</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Ubicación</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((i) => {
              const status = itemStatus(i.stock, i.min_stock);
              return (
                <tr key={i.sku}>
                  <td>{i.sku}</td>
                  <td>
                    {i.name}
                    <div className="muted">
                      {i.brand} · {i.category}
                    </div>
                  </td>
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
    </Shell>
  );
}
