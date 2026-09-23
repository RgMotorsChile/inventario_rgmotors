import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
