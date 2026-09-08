import { RpcForm } from "@/components/rpc-form";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UnidadesPage() {
  const { supabase, profile } = await requireManagement();
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("brand");

  return (
    <Shell path="/unidades" name={profile.full_name}>
      <h1>Unidades del patio</h1>
      <p className="lead">Patentes sobre las que bodega puede descontar stock. Cárgalas desde aquí o desde tu planilla.</p>
      <div className="card">
        <RpcForm
          fn="upsert_vehicle"
          submit="Guardar unidad"
          fields={[
            { name: "p_plate", label: "Patente", required: true, placeholder: "THZF 75" },
            { name: "p_brand", label: "Marca", required: true },
            { name: "p_model", label: "Modelo", required: true },
            { name: "p_year", label: "Año", type: "number", required: true },
            { name: "p_color", label: "Color", required: true },
            { name: "p_status", label: "Estado", placeholder: "Disponible" },
          ]}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Unidad</th>
              <th>Año</th>
              <th>Color</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(vehicles ?? []).map((v) => (
              <tr key={v.id}>
                <td>{v.plate}</td>
                <td>
                  {v.brand} {v.model}
                </td>
                <td>{v.year}</td>
                <td>{v.color}</td>
                <td>{v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
