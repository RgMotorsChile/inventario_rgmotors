/**
 * Solo con CRON_SECRET (Vercel Cron lo manda como Bearer).
 * No se confía en `x-vercel-cron`: cualquiera puede mandar esa cabecera.
 */
export function cronAllowed(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  return Boolean(secret) && auth === `Bearer ${secret}`;
}
