"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  REMEMBER_COOKIE,
  rememberCookieOptions,
} from "@/lib/session";
import { useSupabaseAuth } from "@/lib/auth-mode";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createServerSupabase } from "@/lib/supabase/client";
import { mustChangePassword, resolveLoginEmail } from "@/lib/login-id";

export type LoginError = "auth" | "inactive" | "forbidden";
export type LoginResult = { error: LoginError | null; mustChange?: boolean };

export async function login(formData: FormData): Promise<LoginResult> {
  if (!useSupabaseAuth()) return { error: "auth" };

  const jar = await cookies();
  const remember = String(formData.get("remember") ?? "") === "1";
  jar.set(REMEMBER_COOKIE, remember ? "1" : "0", rememberCookieOptions(remember));
  const email = resolveLoginEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const sb = await createSupabaseServer(remember ? "1" : "0");
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "auth" };

  const admin = createServerSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.active) {
    await sb.auth.signOut();
    return { error: "inactive" };
  }
  if (!["jefatura", "admin"].includes(String(profile.role))) {
    await sb.auth.signOut();
    return { error: "forbidden" };
  }
  if (mustChangePassword(data.user.user_metadata as Record<string, unknown>)) {
    return { error: null, mustChange: true };
  }
  return { error: null };
}

export async function logout() {
  const jar = await cookies();
  const sb = await createSupabaseServer();
  await sb.auth.signOut();
  jar.set(REMEMBER_COOKIE, "", rememberCookieOptions(false));
  redirect("/login");
}
