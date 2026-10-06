export async function readApiJson<T>(res: Response): Promise<T> {
  const type = res.headers.get("content-type") ?? "";
  const expired =
    res.status === 401 ||
    res.status === 403 ||
    res.status === 307 ||
    res.status === 308 ||
    res.redirected ||
    res.type === "opaqueredirect";
  if (!type.includes("application/json")) {
    throw new Error(expired ? "Tu sesión caducó. Vuelve a entrar." : "No se pudo leer la respuesta.");
  }
  return (await res.json()) as T;
}
