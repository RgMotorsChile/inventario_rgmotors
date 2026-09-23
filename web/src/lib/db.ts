/**
 * DB inventario — Supabase tenant-scoped (rg-motors).
 */
import {
  createServerSupabase,
  isSupabaseConfigured,
  INV_TENANT_SLUG,
} from "@/lib/supabase/client";

export const RG_MOTORS_TENANT_ID =
  process.env.INV_TENANT_ID?.trim() || "26291b1f-2133-4ea0-8b5e-83765c357771";

/** Fila genérica del panel. */
export type InvRow = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type InvResult = { data: InvRow[] | null; error: { message: string } | null };

/** Cadena estilo PostgREST tipada para el panel. */
export type InvQuery = PromiseLike<InvResult> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select: (...args: any[]) => InvQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: (...args: any[]) => InvQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eq: (...args: any[]) => InvQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  in: (...args: any[]) => InvQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  limit: (...args: any[]) => InvQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maybeSingle: (...args: any[]) => PromiseLike<{
    data: InvRow | null;
    error: { message: string } | null;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  single: (...args: any[]) => PromiseLike<{
    data: InvRow | null;
    error: { message: string } | null;
  }>;
};

export function useSupabaseInventory(): boolean {
  if (process.env.USE_SUPABASE_INVENTORY?.trim() === "0") return false;
  return (
    isSupabaseConfigured() &&
    Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
  );
}

/** Cliente `.from().select()` filtrado por tenant (salvo profiles). */
export function tenantDb(tenantId: string = RG_MOTORS_TENANT_ID) {
  if (!useSupabaseInventory()) {
    throw new Error(
      "Inventario Supabase no configurado. Define SUPABASE_* y USE_SUPABASE_INVENTORY≠0.",
    );
  }
  const sb = createServerSupabase();
  return {
    from(table: string): InvQuery {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: any = sb.from(table);
      if (table === "profiles") return builder as InvQuery;
      const origSelect = builder.select.bind(builder);
      builder.select = (...args: unknown[]) =>
        origSelect(...args).eq("tenant_id", tenantId);
      return builder as InvQuery;
    },
    rpc(fn: string, params?: Record<string, unknown>) {
      return sb.rpc(fn, params ?? {});
    },
    raw: sb,
    tenantId,
    tenantSlug: process.env.INV_TENANT_SLUG || INV_TENANT_SLUG,
  };
}

export type InventoryDb = ReturnType<typeof tenantDb>;
