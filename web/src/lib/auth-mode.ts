/**
 * Flags de cutover Inventario — Supabase es el único backend.
 * USE_SUPABASE_*=0 solo sirve para forzar error visible si falta config.
 */
import { isSupabaseConfigured } from "@/lib/supabase/client";

function flagOff(name: string): boolean {
  return process.env[name]?.trim() === "0";
}

export function useSupabaseAuth(): boolean {
  if (flagOff("USE_SUPABASE_AUTH")) return false;
  return (
    isSupabaseConfigured() &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  );
}

export function requireSupabaseAuth(): void {
  if (!useSupabaseAuth()) {
    throw new Error(
      "Supabase Auth no configurado. Define NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (USE_SUPABASE_AUTH≠0).",
    );
  }
}
