import { RpcForm } from "@/components/rpc-form";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { clp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const { db, profile } = await requireManagement();
  const { data: items } = await db.from("items").select("*").order("name");

  return (
    <Shell path="/catalogo" name={profile.full_name}>
      <h1>Catálogo</h1>
      <p className="lead">Alta de elementos. Usa una categoría ya creada (Barras, Maxus…). Bodega los ve en su lista.</p>
      <div className="card">
        <h2>Nuevo / actualizar SKU</h2>
        <RpcForm
          fn="upsert_item"
          submit="Guardar SKU"
          fields={[
            { name: "p_sku", label: "SKU", required: true, placeholder: "BAR-MIT-L200" },
            { name: "p_name", label: "Nombre", required: true },
            { name: "p_category", label: "Categoría", required: true },
            { name: "p_brand", label: "Marca", required: true },
            { name: "p_min_stock", label: "Mínimo", type: "number", required: true },
            { name: "p_location", label: "Ubicación", required: true },
            { name: "p_unit_cost", label: "Costo", type: "number", required: true },
            { name: "p_compatible", label: "Compatible" },
          ]}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Ajuste de stock</h2>
        <RpcForm
          fn="adjust_stock"
          submit="Aplicar ajuste"
          fields={[
            { name: "p_sku", label: "SKU", required: true },
            { name: "p_qty", label: "Cantidad (+ o −)", type: "number", required: true },
            { name: "p_note", label: "Motivo", required: true },
          ]}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((i) => (
              <tr key={i.sku}>
                <td>{i.sku}</td>
                <td>{i.name}</td>
                <td>{i.stock}</td>
                <td>{clp.format(Number(i.unit_cost))}</td>
                <td>{i.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
