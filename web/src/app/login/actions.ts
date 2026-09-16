"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";

export type LoginError = "auth" | "inactive" | "forbidden";
export type LoginResult = { error: LoginError | null };

export async function login(formData: FormData): Promise<LoginResult> {
  const auth = createAuthActions({ cookies: await cookies() });
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await auth.signInWithPassword({ email, password });
  if (error) return { error: "auth" };
  return { error: null };
}

export async function logout() {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
  redirect("/login");
}
