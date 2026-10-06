export type RpcResult = { data: unknown; error: { message: string } | null };

export const OFFLINE_MESSAGE = "Sin conexión. Revisa la red e intenta de nuevo.";
export const SESSION_MESSAGE = "Tu sesión caducó. Vuelve a entrar.";

/**
 * Llama a /api/rpc desde el panel. Nunca lanza: devuelve siempre
 * `{ data, error }` para que el formulario no quede pegado en "Guardando…"
 * cuando no hay red, la sesión caducó o el servidor responde algo que no es JSON.
 */
export async function callRpc(
  fn: string,
  params: Record<string, unknown> = {},
  fetcher: typeof fetch = fetch,
): Promise<RpcResult> {
  let res: Response;
  try {
    res = await fetcher("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fn, params }),
      redirect: "manual",
    });
  } catch {
    return { data: null, error: { message: OFFLINE_MESSAGE } };
  }

  if (res.status === 401 || res.redirected || res.type === "opaqueredirect" || res.status === 0) {
    return { data: null, error: { message: SESSION_MESSAGE } };
  }

  let json: { data?: unknown; error?: string } | null = null;
  try {
    json = (await res.json()) as { data?: unknown; error?: string };
  } catch {
    json = null;
  }
  if (!res.ok || !json || json.error) {
    return { data: null, error: { message: json?.error ?? `Error al guardar (${res.status})` } };
  }
  return { data: json.data ?? null, error: null };
}
