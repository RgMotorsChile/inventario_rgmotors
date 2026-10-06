/**
 * Copia claves públicas de web/.env.local a rg_inventario/.dart_defines.json
 * No imprime valores.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(webRoot, ".env.local");
const definesPath = path.join(webRoot, "..", "rg_inventario", ".dart_defines.json");

function loadEnv(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim().replace(/^["']|["']$/g, "");
    out[m[1].trim()] = v;
  }
  return out;
}

const env = loadEnv(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
if (!url.startsWith("https://") || anon.length < 20) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const prev = fs.existsSync(definesPath) ? JSON.parse(fs.readFileSync(definesPath, "utf8")) : {};
const next = {
  ...prev,
  SUPABASE_URL: url,
  SUPABASE_ANON_KEY: anon,
  JEFATURA_WEB_URL: prev.JEFATURA_WEB_URL || "https://inventario-rg.vercel.app",
};
fs.writeFileSync(definesPath, `${JSON.stringify(next, null, 2)}\n`);
console.log("dart_defines listo (SUPABASE_URL, SUPABASE_ANON_KEY, JEFATURA_WEB_URL)");
