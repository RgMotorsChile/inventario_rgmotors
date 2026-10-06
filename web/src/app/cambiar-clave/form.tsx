"use client";

import { useState } from "react";
import { changePassword, type ChangePasswordError } from "./actions";

const copy: Record<ChangePasswordError, string> = {
  auth: "La sesión expiró. Vuelve a entrar.",
  short: "La nueva contraseña debe tener al menos 8 caracteres.",
  mismatch: "Las contraseñas no coinciden.",
  same: "Elige una contraseña distinta a la temporal.",
  update: "No se pudo guardar. Inténtalo de nuevo.",
};

export function ChangePasswordForm() {
  const [error, setError] = useState<ChangePasswordError | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await changePassword(new FormData(event.currentTarget));
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
        Contraseña temporal
        <input name="current" type="password" autoComplete="current-password" disabled={busy} />
      </label>
      <label>
        Nueva contraseña
        <input name="password" type="password" required autoComplete="new-password" minLength={8} disabled={busy} />
      </label>
      <label>
        Repetir nueva contraseña
        <input name="confirm" type="password" required autoComplete="new-password" minLength={8} disabled={busy} />
      </label>
      {error ? <p className="err">{copy[error]}</p> : null}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}
