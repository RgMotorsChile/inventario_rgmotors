"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login, type LoginError } from "./actions";

const copy: Record<LoginError, string> = {
  forbidden: "Esta web es solo para jefatura. Bodega entra por la app móvil.",
  auth: "Correo o contraseña incorrectos.",
  inactive: "Tu cuenta no está activa.",
};

const EMAIL_KEY = "rg.remember.email";

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<LoginError | null>(
    initialError === "forbidden" || initialError === "auth" || initialError === "inactive"
      ? initialError
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  useEffect(() => {
    for (const href of ["/", "/inventario", "/unidades", "/personas", "/historial"]) {
      router.prefetch(href);
    }
    const email = window.localStorage.getItem(EMAIL_KEY);
    if (email) setSavedEmail(email);
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await login(form);
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    const keep = form.get("remember") === "1";
    const mail = String(form.get("email") ?? "").trim();
    if (keep && mail) window.localStorage.setItem(EMAIL_KEY, mail);
    else window.localStorage.removeItem(EMAIL_KEY);
    window.location.assign("/");
  }

  return (
    <form onSubmit={onSubmit} aria-busy={busy}>
      <label>
        Correo
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus={!savedEmail}
          key={savedEmail || "email"}
          defaultValue={savedEmail}
          disabled={busy}
        />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" required autoComplete="current-password" disabled={busy} />
      </label>
      <label className="check">
        <input name="remember" type="checkbox" value="1" defaultChecked disabled={busy} />
        Mantener la sesión iniciada
      </label>
      {error ? <p className="err">{copy[error]}</p> : null}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
