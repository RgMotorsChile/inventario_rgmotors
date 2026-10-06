import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { tenantDb, type InventoryDb } from "@/lib/db";
import { useSupabaseAuth } from "@/lib/auth-mode";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createServerSupabase } from "@/lib/supabase/client";
import { mustChangePassword } from "@/lib/login-id";

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
};

async function loadProfileSupabase(userId: string): Promise<Profile | null> {
  const sb = createServerSupabase();
  const { data } = await sb
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

type AuthFail = { ok: false; reason: "auth" | "unauth" | "forbidden" | "password" };
type AuthOk = {
  ok: true;
  db: InventoryDb;
  authDb: InventoryDb;
  user: { id: string };
  profile: Profile;
  inventoryBackend: "supabase";
  authBackend: "supabase";
};

const loadManagementSession = cache(async (): Promise<AuthOk | AuthFail> => {
  if (!useSupabaseAuth()) {
    return { ok: false, reason: "auth" };
  }

  const sb = await createSupabaseServer();
  const { data: authData } = await sb.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return { ok: false, reason: "unauth" };
  if (mustChangePassword(authData.user?.user_metadata as Record<string, unknown> | undefined)) {
    return { ok: false, reason: "password" };
  }

  const row = await loadProfileSupabase(userId);
  if (!row?.active || !["jefatura", "admin"].includes(row.role)) {
    await sb.auth.signOut();
    return { ok: false, reason: "forbidden" };
  }

  const db = tenantDb();
  const authDb = {
    from(table: string) {
      return createServerSupabase().from(table) as unknown as ReturnType<
        InventoryDb["from"]
      >;
    },
    rpc(fn: string, params?: Record<string, unknown>) {
      return createServerSupabase().rpc(fn, params ?? {});
    },
    raw: createServerSupabase(),
    tenantId: db.tenantId,
    tenantSlug: db.tenantSlug,
  } satisfies InventoryDb;

  return {
    ok: true,
    db,
    authDb,
    user: { id: userId },
    profile: row,
    inventoryBackend: "supabase",
    authBackend: "supabase",
  };
});

export const requireManagement = cache(async () => {
  const session = await loadManagementSession();
  if (!session.ok) {
    if (session.reason === "password") redirect("/cambiar-clave");
    if (session.reason === "forbidden") redirect("/login?error=forbidden");
    if (session.reason === "auth") redirect("/login?error=auth");
    redirect("/login");
  }
  const { ok: _ok, ...rest } = session;
  return rest;
});

/** Para rutas /api: JSON 401/403, sin redirigir a HTML de login. */
export async function requireManagementApi() {
  const session = await loadManagementSession();
  if (!session.ok) {
    const error =
      session.reason === "password"
        ? "Debes cambiar la contraseña antes de continuar."
        : session.reason === "forbidden"
          ? "Esta acción es solo para jefatura."
          : "Tu sesión caducó. Vuelve a entrar.";
    const status = session.reason === "forbidden" || session.reason === "password" ? 403 : 401;
    return { ok: false as const, response: NextResponse.json({ error }, { status }) };
  }
  const { ok: _ok, ...rest } = session;
  return { ok: true as const, ...rest };
}
