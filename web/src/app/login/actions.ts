"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=auth");

  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }
  if (!["jefatura", "admin"].includes(profile.role)) {
    await supabase.auth.signOut();
    redirect("/login?error=forbidden");
  }
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
