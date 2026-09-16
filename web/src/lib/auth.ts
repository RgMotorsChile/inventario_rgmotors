import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { createClient } from "@/lib/insforge/server";
import { userIdFromAccessToken } from "@/lib/token";

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
};

export const requireManagement = cache(async () => {
  const jar = await cookies();
  const insforge = await createClient();
  const fromToken = userIdFromAccessToken(jar.get("insforge_access_token")?.value);
  const userId = fromToken ?? (await insforge.auth.getCurrentUser()).data?.user?.id;
  if (!userId) redirect("/login");

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", userId)
    .maybeSingle();
  const row = profile as Profile | null;
  if (!row?.active || !["jefatura", "admin"].includes(row.role)) {
    const auth = createAuthActions({ cookies: jar });
    await auth.signOut();
    redirect("/login?error=forbidden");
  }
  return { insforge, db: insforge.database, user: { id: userId }, profile: row };
});
