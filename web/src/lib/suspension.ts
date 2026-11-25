import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/client";

export const DEFAULT_SUSPENDED_MESSAGE = "Servicio suspendido temporalmente.";

export type AppSuspensionStatus = {
  suspended: boolean;
  message: string;
};

export function parseSuspensionRow(row: unknown): AppSuspensionStatus {
  if (!row || typeof row !== "object") {
    return { suspended: false, message: "" };
  }
  const record = row as { suspendido?: unknown; mensaje?: unknown };
  if (record.suspendido !== true) {
    return { suspended: false, message: "" };
  }
  const message =
    typeof record.mensaje === "string" && record.mensaje.trim()
      ? record.mensaje.trim()
      : DEFAULT_SUSPENDED_MESSAGE;
  return { suspended: true, message };
}

export async function getInventarioSuspension(): Promise<AppSuspensionStatus> {
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !apiKey) {
    return { suspended: false, message: "" };
  }
  try {
    const endpoint =
      `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/app_status` +
      `?select=suspendido,mensaje&app=eq.inventario&limit=1`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { suspended: false, message: "" };
    const rows = (await res.json()) as unknown;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return parseSuspensionRow(row);
  } catch {
    return { suspended: false, message: "" };
  }
}
