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

/**
 * Cliente de servidor con service role.
 * No cae a la anon key: anon y authenticated no tienen SELECT de la tabla
 * completa en `vehicles` ni en `tenants`.
 */
export function createServerSupabase(headers?: Record<string, string>): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(headers ? { global: { headers } } : {}),
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
