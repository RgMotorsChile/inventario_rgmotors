import { BrandLogo } from "@/components/brand-logo";
import { getInventarioSuspension } from "@/lib/suspension";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const suspension = await getInventarioSuspension();

  if (suspension.suspended) {
    return (
      <main className="auth">
        <div className="card auth-card">
          <BrandLogo className="logo-auth" priority />
          <p className="eyebrow">RG Motors · Puerto Montt</p>
          <h1>Servicio suspendido temporalmente</h1>
          <p className="lead">{suspension.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth">
      <div className="card auth-card">
        <BrandLogo className="logo-auth" priority />
        <p className="eyebrow">RG Motors · Puerto Montt</p>
        <h1>Jefatura</h1>
        <p className="lead">
          Acceso reservado a la dirección. Inventario, patio y personal de la automotora, en un solo panel.
        </p>
        <LoginForm initialError={error} />
      </div>
    </main>
  );
}
