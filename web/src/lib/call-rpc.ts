import { readApiJson } from "@/lib/api-json";

export async function callRpc(fn: string, params: Record<string, unknown> = {}) {
  const res = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fn, params }),
    redirect: "manual",
  });
  try {
    const json = await readApiJson<{ data?: unknown; error?: string }>(res);
    if (!res.ok || json.error) {
      return { data: null, error: { message: json.error ?? "Error al guardar" } };
    }
    return { data: json.data ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "Error al guardar" },
    };
  }
}
