import { NextResponse } from "next/server";
import { requireManagementApi } from "@/lib/auth";
import { APP_RELEASES_BUCKET, assertApkUpload } from "@/lib/app-release";
import { RG_MOTORS_TENANT_ID, useSupabaseInventory } from "@/lib/db";
import { createServerSupabase } from "@/lib/supabase/client";

type Body = {
  action?: string;
  version_code?: number;
  version_name?: string;
  notes?: string | null;
  force_update?: boolean;
  path?: string;
  file_name?: string;
  file_size?: number;
};

function cleanVersion(raw: Body) {
  const versionCode = Number(raw.version_code);
  const versionName = String(raw.version_name ?? "").trim();
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    throw new Error("Indica el número de build (versionCode)");
  }
  if (!/^\d+\.\d+\.\d+$/.test(versionName)) {
    throw new Error("La versión debe verse como 1.0.3");
  }
  return { versionCode, versionName };
}

export async function POST(req: Request) {
  if (!useSupabaseInventory()) {
    return NextResponse.json({ error: "Inventario Supabase no configurado" }, { status: 500 });
  }

  const session = await requireManagementApi();
  if (!session.ok) return session.response;
  const body = (await req.json()) as Body;
  const action = String(body.action ?? "");
  const sb = createServerSupabase();

  try {
    const { versionCode, versionName } = cleanVersion(body);
    const notes = String(body.notes ?? "").trim() || null;
    const forceUpdate = body.force_update !== false;

    if (action === "prepare") {
      assertApkUpload({
        name: String(body.file_name ?? "app.apk"),
        size: Number(body.file_size ?? 0),
      });
      const path = `rg-motors/${versionCode}/InventarioRG-${versionName}.apk`;
      const { data, error } = await sb.storage.from(APP_RELEASES_BUCKET).createSignedUploadUrl(path);
      if (error || !data) {
        return NextResponse.json({ error: error?.message ?? "No se pudo preparar la subida" }, { status: 400 });
      }
      return NextResponse.json({
        path: data.path,
        token: data.token,
        signedUrl: data.signedUrl,
      });
    }

    if (action === "commit") {
      const path = String(body.path ?? "");
      const expected = `rg-motors/${versionCode}/InventarioRG-${versionName}.apk`;
      if (path !== expected) {
        return NextResponse.json({ error: "Ruta de APK inválida" }, { status: 400 });
      }
      const { error: missing } = await sb.storage.from(APP_RELEASES_BUCKET).createSignedUrl(path, 30);
      if (missing) {
        return NextResponse.json({ error: "La APK no llegó al almacenamiento" }, { status: 400 });
      }

      const { error } = await sb.from("app_releases").insert({
        tenant_id: RG_MOTORS_TENANT_ID,
        version_code: versionCode,
        version_name: versionName,
        storage_path: path,
        notes,
        force_update: forceUpdate,
        published_by: session.user.id,
        published_by_name: session.profile.full_name,
      });
      if (error) {
        if (error.code === "23505") {
          return NextResponse.json({ error: `Ya existe el build ${versionCode}` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true, version_code: versionCode, version_name: versionName });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo publicar" },
      { status: 400 },
    );
  }
}
