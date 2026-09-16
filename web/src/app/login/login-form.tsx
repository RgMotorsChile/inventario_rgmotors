"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login, type LoginError } from "./actions";

const copy: Record<LoginError, string> = {
  forbidden: "Esta web es solo para jefatura. Bodega entra por la app móvil.",
  auth: "Correo o contraseña incorrectos.",
  inactive: "Tu cuenta no está activa.",
};

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<LoginError | null>(
    initialError === "forbidden" || initialError === "auth" || initialError === "inactive"
      ? initialError
      : null,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    for (const href of ["/", "/inventario", "/unidades", "/personas", "/historial"]) {
      router.prefetch(href);
    }
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await login(new FormData(event.currentTarget));
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    window.location.assign("/");
  }

  return (
    <form onSubmit={onSubmit} aria-busy={busy}>
      <label>
        Correo
        <input name="email" type="email" required autoComplete="username" autoFocus disabled={busy} />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" required autoComplete="current-password" disabled={busy} />
      </label>
      {error ? <p className="err">{copy[error]}</p> : null}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
