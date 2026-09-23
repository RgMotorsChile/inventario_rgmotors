export async function callRpc(fn: string, params: Record<string, unknown> = {}) {
  const res = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fn, params }),
  });
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok || json.error) {
    return { data: null, error: { message: json.error ?? "Error al guardar" } };
  }
  return { data: json.data ?? null, error: null };
}
