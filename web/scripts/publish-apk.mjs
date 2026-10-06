/**
 * Publica una APK en app_releases (service role, sin pasar por Vercel).
 *
 *   node scripts/publish-apk.mjs "C:\ruta\InventarioRG.apk"
 *
 * Lee versión de rg_inventario/pubspec.yaml salvo APP_VERSION / APP_BUILD.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.join(ROOT, "..");
const TENANT = process.env.INV_TENANT_ID?.trim() || "26291b1f-2133-4ea0-8b5e-83765c357771";
const BUCKET = "app-releases";

function loadEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

function readPubspecVersion() {
  const pub = path.join(REPO, "rg_inventario", "pubspec.yaml");
  const text = fs.readFileSync(pub, "utf8");
  const m = text.match(/^version:\s*(\d+\.\d+\.\d+)\+(\d+)\s*$/m);
  if (!m) throw new Error("No pude leer version: x.y.z+n en pubspec.yaml");
  return { versionName: m[1], versionCode: Number(m[2]) };
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apkPath = process.argv[2];

if (!url || !key) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!apkPath || !fs.existsSync(apkPath) || !apkPath.toLowerCase().endsWith(".apk")) {
  console.error("Pasa la ruta de la APK: node scripts/publish-apk.mjs InventarioRG.apk");
  process.exit(1);
}

const fromPub = readPubspecVersion();
const versionName = process.env.APP_VERSION?.trim() || fromPub.versionName;
const versionCode = Number(process.env.APP_BUILD || fromPub.versionCode);
const notes = process.env.APP_NOTES?.trim() || null;
const force = process.env.APP_FORCE !== "0";
const storagePath = `rg-motors/${versionCode}/InventarioRG-${versionName}.apk`;

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const bytes = fs.readFileSync(apkPath);

const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, bytes, {
  contentType: "application/vnd.android.package-archive",
  upsert: true,
});
if (upErr) {
  console.error(upErr.message);
  process.exit(1);
}

const { error: insErr } = await sb.from("app_releases").insert({
  tenant_id: TENANT,
  version_code: versionCode,
  version_name: versionName,
  storage_path: storagePath,
  notes,
  force_update: force,
  published_by_name: "Build local",
});
if (insErr) {
  console.error(insErr.message);
  process.exit(1);
}

console.log(`Publicada ${versionName}+${versionCode} → ${storagePath}`);
