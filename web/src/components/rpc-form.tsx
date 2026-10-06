"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { callRpc } from "@/lib/call-rpc";

export type RpcField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  options?: { value: string; label: string }[];
  uppercase?: boolean;
};

export function RpcForm({
  fn,
  fields,
  submit,
  extra,
}: {
  fn: string;
  submit: string;
  fields: RpcField[];
  extra?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    // currentTarget es null después del primer await: guardamos el form antes.
    const form = event.currentTarget;
    setBusy(true);
    setError(null);
    setOk(null);
    const data = new FormData(form);
    const params: Record<string, unknown> = { ...extra };
    for (const field of fields) {
      let raw = String(data.get(field.name) ?? "").trim();
      if (field.uppercase) raw = raw.toUpperCase();
      if (field.type === "number") params[field.name] = raw === "" ? null : Number(raw);
      else if (field.type === "checkbox") params[field.name] = data.get(field.name) === "on";
      else params[field.name] = raw === "" ? null : raw;
    }
    const { data: result, error: rpcError } = await callRpc(fn, params);
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setOk(typeof result === "string" ? `Código: ${result}` : "Guardado");
    form.reset();
    router.refresh();
  }

  return (
    <form className="row" onSubmit={onSubmit} aria-busy={busy}>
      {fields.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.type === "checkbox" ? (
            <input name={field.name} type="checkbox" defaultChecked />
          ) : field.options ? (
            <select name={field.name} required={field.required} defaultValue={field.options[0]?.value}>
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={field.name}
              type={field.type ?? "text"}
              required={field.required}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              autoCapitalize={field.uppercase ? "characters" : undefined}
            />
          )}
        </label>
      ))}
      <button className="btn" disabled={busy} type="submit">
        {busy ? "Guardando…" : submit}
      </button>
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="ok" role="status">
          {ok}
        </p>
      ) : null}
    </form>
  );
}
