/**
 * Cliente Supabase — Inventario RG Motors (tenant: rg-motors).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const INV_TENANT_SLUG = "rg-motors";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tuybpizjeszgwtcvunmp.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

export function createBrowserSupabase(): SupabaseClient {
  if (!SUPABASE_ANON_KEY) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function createServerSupabase(): SupabaseClient {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || SUPABASE_ANON_KEY;
  if (!key) throw new Error("Falta clave Supabase");
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
