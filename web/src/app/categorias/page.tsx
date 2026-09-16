import { RpcForm } from "@/components/rpc-form";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const { db, profile } = await requireManagement();
  const [{ data: categories }, { data: items }] = await Promise.all([
    db.from("categories").select("*").order("name"),
    db.from("items").select("sku,category"),
  ]);

  return (
    <Shell path="/categorias" name={profile.full_name}>
      <h1>Categorías</h1>
      <p className="lead">Crea las familias que ve bodega en el celular: Barras, Pisaderas, Lonas, Maxus, etc.</p>
      <div className="card">
        <RpcForm
          fn="upsert_category"
          submit="Crear categoría"
          fields={[{ name: "p_name", label: "Nombre", required: true, placeholder: "Barras" }]}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Elementos</th>
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{(items ?? []).filter((i) => i.category === c.name).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
