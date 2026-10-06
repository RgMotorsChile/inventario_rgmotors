/**
 * Crea (o actualiza) usuario jefatura en Supabase Auth + profiles + tenant_members.
 *
 *   INV_ADMIN_EMAIL=... INV_ADMIN_PASSWORD=... INV_ADMIN_NAME="..." \
 *   node scripts/create-inv-admin.mjs
 *
 * Lee SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_* de web/.env.local
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TENANT = process.env.INV_TENANT_ID?.trim() || "26291b1f-2133-4ea0-8b5e-83765c357771";

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

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.INV_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.INV_ADMIN_PASSWORD || "";
const fullName = process.env.INV_ADMIN_NAME?.trim() || "Jefatura RG Motors";
const mustChange = process.env.INV_MUST_CHANGE_PASSWORD === "1";
const role = ["bodega", "jefatura", "admin"].includes(process.env.INV_ADMIN_ROLE)
  ? process.env.INV_ADMIN_ROLE
  : "jefatura";
const userMetadata = { full_name: fullName, must_change_password: mustChange };

if (!url || !key) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email || password.length < 8) {
  console.error("Define INV_ADMIN_EMAIL e INV_ADMIN_PASSWORD (>=8 chars)");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed, error: listErr } = await sb.auth.admin.listUsers({ perPage: 200 });
if (listErr) {
  console.error(listErr.message);
  process.exit(1);
}

let userId = listed.users.find((u) => u.email?.toLowerCase() === email)?.id;

if (!userId) {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (error) {
    console.error("createUser:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log("Usuario creado:", userId);
} else {
  const { error } = await sb.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (error) {
    console.error("updateUser:", error.message);
    process.exit(1);
  }
  console.log("Usuario existente actualizado:", userId);
}

const { error: pErr } = await sb.from("profiles").upsert(
  {
    id: userId,
    tenant_id: TENANT,
    full_name: fullName,
    role,
    active: true,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "id" },
);
if (pErr) {
  console.error("profiles:", pErr.message);
  process.exit(1);
}

const { error: mErr } = await sb.from("tenant_members").upsert(
  {
    tenant_id: TENANT,
    user_id: userId,
    role,
    active: true,
  },
  { onConflict: "tenant_id,user_id" },
);
if (mErr) {
  console.error("tenant_members:", mErr.message);
  process.exit(1);
}

console.log("OK — jefatura lista en Supabase Auth + profiles + tenant_members");
console.log("Reinicia el panel e inicia sesión con ese correo.");
