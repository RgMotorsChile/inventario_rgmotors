export function userIdFromAccessToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string };
    return typeof json.sub === "string" && json.sub.length > 0 ? json.sub : null;
  } catch {
    return null;
  }
}

export function isPublicPath(path: string) {
  return (
    path === "/login" ||
    path.startsWith("/login") ||
    path.startsWith("/api/auth") ||
    path === "/manifest.webmanifest" ||
    path === "/sw.js"
  );
}

/** Las APIs autentican solas (cookie o Bearer). El middleware no las manda a /login. */
export function isApiPath(path: string) {
  return path === "/api" || path.startsWith("/api/");
}
