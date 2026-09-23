"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
export function RpcForm({
  fn,
  fields,
  submit,
  extra,
}: {
  fn: string;
  submit: string;
  fields: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }[];
  extra?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const data = new FormData(event.currentTarget);
    const params: Record<string, unknown> = { ...extra };
    for (const field of fields) {
      const raw = String(data.get(field.name) ?? "").trim();
      if (field.type === "number") params[field.name] = raw === "" ? null : Number(raw);
      else if (field.type === "checkbox") params[field.name] = data.get(field.name) === "on";
      else params[field.name] = raw === "" ? null : raw;
    }
    const res = await fetch("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fn, params }),
    });
    const json = (await res.json()) as { data?: unknown; error?: string };
    setBusy(false);
    if (!res.ok || json.error) {
      setError(json.error ?? "Error al guardar");
      return;
    }
    const result = json.data;
    setOk(typeof result === "string" ? `Código: ${result}` : "Guardado");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="row" onSubmit={onSubmit}>
      {fields.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.type === "checkbox" ? (
            <input name={field.name} type="checkbox" defaultChecked />
          ) : (
            <input
              name={field.name}
              type={field.type ?? "text"}
              required={field.required}
              placeholder={field.placeholder}
            />
          )}
        </label>
      ))}
      <button className="btn" disabled={busy} type="submit">
        {busy ? "Guardando…" : submit}
      </button>
      {error ? <p className="err">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
    </form>
  );
}
