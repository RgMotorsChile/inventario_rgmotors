export const LOGIN_EMAIL_DOMAIN = "rgmotors.cl";

const LOGIN_ALIASES: Record<string, string> = {
  "constanza.gonzalez": "constanza.gonzalez@rgmotorschile.cl",
  "rudy.gonzalez": "rudy.gonzalez@rgmotorschile.cl",
};

/** Acepta `santiago`, `santiago@rgmotors.cl` o alias @rgmotorschile.cl. */
export function resolveLoginEmail(raw: string) {
  const value = raw.trim().toLowerCase();
  if (!value) return "";
  if (value.includes("@")) return value;
  return LOGIN_ALIASES[value] ?? `${value}@${LOGIN_EMAIL_DOMAIN}`;
}

export function mustChangePassword(metadata: Record<string, unknown> | null | undefined) {
  const flag = metadata?.must_change_password;
  return flag === true || flag === "true" || flag === 1;
}
