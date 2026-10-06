"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { mustChangePassword } from "@/lib/login-id";

export type ChangePasswordError = "auth" | "short" | "mismatch" | "same" | "update";
export type ChangePasswordResult = { error: ChangePasswordError | null };

export async function changePassword(formData: FormData): Promise<ChangePasswordResult> {
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const current = String(formData.get("current") ?? "");
  if (next.length < 8) return { error: "short" };
  if (next !== confirm) return { error: "mismatch" };
  if (current && next === current) return { error: "same" };

  const sb = await createSupabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return { error: "auth" };

  const { error: updateError } = await sb.auth.updateUser({
    password: next,
    data: {
      ...(data.user.user_metadata ?? {}),
      must_change_password: false,
    },
  });
  if (updateError) return { error: "update" };
  return { error: null };
}

export async function needsPasswordChange() {
  const sb = await createSupabaseServer();
  const { data } = await sb.auth.getUser();
  return mustChangePassword(data.user?.user_metadata as Record<string, unknown> | undefined);
}
