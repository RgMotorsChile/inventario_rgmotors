import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "forbidden"
      ? "Esta web es solo para jefatura. Bodega entra por la app móvil."
      : error === "auth"
        ? "Correo o contraseña incorrectos."
        : error === "inactive"
          ? "Tu cuenta no está activa."
          : null;

  return (
    <main className="auth">
      <div className="card auth-card">
        <img src="/logo.png" alt="RG Motors" />
        <h1 style={{ marginTop: 16 }}>Jefatura</h1>
        <p className="lead">Métricas, rastro de piezas y Excel. El encargado de bodega usa la app del celular.</p>
        <form action={login}>
          <label>
            Correo
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Contraseña
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          {message ? <p className="err">{message}</p> : null}
          <button className="btn" type="submit">
            Entrar al panel
          </button>
        </form>
      </div>
    </main>
  );
}
