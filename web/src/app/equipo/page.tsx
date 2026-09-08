import { RpcForm } from "@/components/rpc-form";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import { when } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const { supabase, profile } = await requireManagement();
  const [{ data: invites }, { data: users }] = await Promise.all([
    supabase.from("invites").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <Shell path="/equipo" name={profile.full_name}>
      <h1>Equipo y seguridad</h1>
      <p className="lead">
        Nadie se crea como jefatura solo. Genera un código, dáselo al encargado y él lo usa en la app. El primer usuario
        de jefatura se activa a mano en Supabase.
      </p>
      <div className="card">
        <h2>Invitar</h2>
        <RpcForm
          fn="create_invite"
          submit="Generar código"
          fields={[
            { name: "p_email", label: "Correo (opcional)" },
            { name: "p_role", label: "Rol", placeholder: "bodega o jefatura", required: true },
          ]}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Códigos</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Rol</th>
              <th>Correo</th>
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
                <td>{i.email ?? "cualquiera"}</td>
                <td className={i.used_at ? "ok" : "warn"}>{i.used_at ? "Usado" : "Pendiente"}</td>
                <td>{when(i.expires_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
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
    </Shell>
  );
}
