import { NextResponse } from "next/server";
import { requireStaffFromRequest } from "@/lib/bodegaAuth";
import { RG_MOTORS_TENANT_ID, useSupabaseInventory } from "@/lib/db";
import { createServerSupabase } from "@/lib/supabase/client";

/** Bucket donde scripts/publish-apk.mjs sube la APK de bodega. */
const APP_RELEASES_BUCKET = "app-releases";

export async function GET(req: Request) {
  if (!useSupabaseInventory()) {
    return NextResponse.json({ error: "Inventario Supabase no configurado" }, { status: 500 });
  }

  const gate = await requireStaffFromRequest(req);
  if ("error" in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const sb = createServerSupabase();
  const { data, error } = await sb
    .from("app_releases")
    .select("version_code,version_name,notes,force_update,storage_path,created_at")
    .eq("tenant_id", RG_MOTORS_TENANT_ID)
    .order("version_code", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ release: null });

  const { data: signed, error: signErr } = await sb.storage
    .from(APP_RELEASES_BUCKET)
    .createSignedUrl(String(data.storage_path), 60 * 60);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message ?? "No se pudo firmar la APK" }, { status: 400 });
  }

  return NextResponse.json({
    release: {
      version_code: Number(data.version_code),
      version_name: String(data.version_name),
      notes: (data.notes as string | null) ?? null,
      force_update: Boolean(data.force_update),
      download_url: signed.signedUrl,
      published_at: data.created_at,
    },
  });
}
