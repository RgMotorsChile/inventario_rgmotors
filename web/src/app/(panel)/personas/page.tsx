import { PageHead } from "@/components/page-head";
import { RpcForm } from "@/components/rpc-form";
import { WorkerDesk } from "@/components/worker-desk";
import { requireManagement } from "@/lib/auth";
import { when } from "@/lib/format";
import type { WorkerRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PersonasPage() {
  const { db } = await requireManagement();
  const [{ data: workers }, { data: invites }, { data: users }] = await Promise.all([
    db.from("workers").select("*").order("full_name"),
    db.from("invites").select("*").order("created_at", { ascending: false }),
    db.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHead
        eyebrow="Equipo"
        title="Personas"
        lead="Responsables de taller y quién puede entrar a la app o a esta web."
      />
      <div className="card">
        <h2>Trabajadores</h2>
        <RpcForm
          fn="upsert_worker"
          submit="Agregar responsable"
          fields={[
            { name: "p_full_name", label: "Nombre", required: true },
            { name: "p_job_title", label: "Cargo", required: true },
          ]}
        />
        <WorkerDesk workers={(workers ?? []) as WorkerRow[]} />
      </div>
      <div className="card">
        <h2>Acceso al sistema</h2>
        <RpcForm
          fn="create_invite"
          submit="Generar código"
          fields={[
            { name: "p_email", label: "Correo (opcional)" },
            { name: "p_role", label: "Rol", placeholder: "bodega o jefatura", required: true },
          ]}
        />
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Vence</th>
            </tr>
          </thead>
          <tbody>
            {(invites ?? []).map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.code}</strong>
                </td>
                <td>{i.role}</td>
                <td className={i.used_at ? "ok" : "warn"}>{i.used_at ? "Usado" : "Pendiente"}</td>
                <td>{when(i.expires_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>Usuarios</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.role}</td>
                <td className={u.active ? "ok" : "bad"}>{u.active ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
