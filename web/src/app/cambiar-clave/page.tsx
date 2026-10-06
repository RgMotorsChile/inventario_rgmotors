import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ChangePasswordForm } from "./form";

export default async function ChangePasswordPage() {
  const sb = await createSupabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <main className="auth">
      <div className="card auth-card">
        <BrandLogo className="logo-auth" priority />
        <p className="eyebrow">RG Motors · Primer ingreso</p>
        <h1>Cambia tu contraseña</h1>
        <p className="lead">
          Elige una contraseña propia. Después de guardarla entras al panel.
        </p>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
