import { createServerClient } from "@supabase/ssr";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/client";
import { REMEMBER_COOKIE, authCookieWriteOptions } from "@/lib/session";

/** `rememberOverride` se usa en el login, cuando la cookie rg_remember aún no viaja en la request. */
export async function createSupabaseServer(rememberOverride?: "0" | "1") {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          const remember = rememberOverride ?? jar.get(REMEMBER_COOKIE)?.value;
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, authCookieWriteOptions(value, options, remember));
          }
        } catch {
          /* Server Component: set puede fallar; middleware refresca */
        }
      },
    },
  });
}

/** Cliente browser (login client-side si hace falta). */
export function createSupabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
