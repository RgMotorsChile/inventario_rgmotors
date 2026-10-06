/**
 * Lee las pestañas mensuales de Santiago y las deja en Compras.
 * No borra observaciones ni el stock de patio.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchSantiagoSheetVehicles } from "../src/lib/santiago-vehicles.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

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
if (!url || !key) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { vehicles, sources } = await fetchSantiagoSheetVehicles();
if (vehicles.length === 0) {
  console.error("La planilla de Santiago no trajo patentes");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await sb.rpc("sync_vehicles_from_sheet", {
  p_rows: vehicles,
  p_sync_key: "rg_motors_compras",
});
if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(JSON.stringify({ read: vehicles.length, sources, result: data }, null, 2));
