import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
};

export async function requireManagement() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const row = profile as Profile | null;
  if (!row?.active || !["jefatura", "admin"].includes(row.role)) {
    await supabase.auth.signOut();
    redirect("/login?error=forbidden");
  }
  return { supabase, user, profile: row };
}
