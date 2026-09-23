import { cache } from "react";
import { redirect } from "next/navigation";
import { tenantDb, type InventoryDb } from "@/lib/db";
import { useSupabaseAuth } from "@/lib/auth-mode";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createServerSupabase } from "@/lib/supabase/client";

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

export const requireManagement = cache(async () => {
  if (!useSupabaseAuth()) {
    redirect("/login?error=auth");
  }

  const sb = await createSupabaseServer();
  const { data: authData } = await sb.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) redirect("/login");

  const row = await loadProfileSupabase(userId);
  if (!row?.active || !["jefatura", "admin"].includes(row.role)) {
    await sb.auth.signOut();
    redirect("/login?error=forbidden");
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
    db,
    authDb,
    user: { id: userId },
    profile: row,
    inventoryBackend: "supabase" as const,
    authBackend: "supabase" as const,
  };
});
