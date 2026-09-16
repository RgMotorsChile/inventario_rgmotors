import { RpcForm } from "@/components/rpc-form";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TrabajadoresPage() {
  const { db, profile } = await requireManagement();
  const { data: workers } = await db.from("workers").select("*").order("full_name");

  return (
    <Shell path="/trabajadores" name={profile.full_name}>
      <h1>Trabajadores</h1>
      <p className="lead">A quién se le puede asignar una herramienta o accesorio para que no se pierda.</p>
      <div className="card">
        <RpcForm
          fn="upsert_worker"
          submit="Agregar trabajador"
          fields={[
            { name: "p_full_name", label: "Nombre", required: true },
            { name: "p_job_title", label: "Cargo", required: true },
          ]}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(workers ?? []).map((w) => (
              <tr key={w.id}>
                <td>{w.full_name}</td>
                <td>{w.job_title}</td>
                <td className={w.active ? "ok" : "bad"}>{w.active ? "Activo" : "Baja"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
