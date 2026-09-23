import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { createServerSupabase, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/client";
import { RG_MOTORS_TENANT_ID, useSupabaseInventory } from "@/lib/db";
import { useSupabaseAuth } from "@/lib/auth-mode";
import type { Profile } from "@/lib/auth";

export type StaffContext = {
  userId: string;
  profile: Profile;
};

/** Valida Bearer Supabase JWT y exige perfil activo (bodega / jefatura / admin). */
export async function requireStaffFromRequest(
  req: Request,
): Promise<StaffContext | { error: string; status: number }> {
  if (!useSupabaseAuth()) {
    return { error: "Auth Supabase no configurado", status: 500 };
  }

  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { error: "Sin token", status: 401 };

  const sb = createSupabaseJs(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authErr } = await sb.auth.getUser(token);
  const userId = authData.user?.id;
  if (authErr || !userId) return { error: "Sesión inválida", status: 401 };

  const admin = createServerSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", userId)
    .maybeSingle();
  const row = profile as Profile | null;
  if (!row?.active || !["bodega", "jefatura", "admin"].includes(row.role)) {
    return { error: "Sin permiso de bodega", status: 403 };
  }
  return { userId, profile: row };
}

export function inventoryDb() {
  if (!useSupabaseInventory()) return null;
  return createServerSupabase();
}

export const TENANT = RG_MOTORS_TENANT_ID;
