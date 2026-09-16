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
        <p className="eyebrow" style={{ marginTop: 18 }}>
          Panel
        </p>
        <h1>Jefatura</h1>
        <p className="lead">Métricas, rastro de piezas y Excel. El encargado de bodega usa la app del celular.</p>
        <LoginForm initialError={error} />
      </div>
    </main>
  );
}
