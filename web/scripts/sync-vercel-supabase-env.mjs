/**
 * Sync Supabase env vars from web/.env.local into Vercel (non-interactive).
 * Usage: node scripts/sync-vercel-supabase-env.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(ROOT, ".env.local");
const scope = process.env.VERCEL_SCOPE || "rg-motors-chile";

function loadEnvFile(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const fileEnv = loadEnvFile(envPath);
const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = keys.filter((k) => !fileEnv[k]);
if (missing.length) {
  console.error("Faltan en .env.local:", missing.join(", "));
  process.exit(1);
}

for (const key of keys) {
  const value = fileEnv[key];
  const args = [
    "env",
    "add",
    key,
    "production,preview,development",
    "--value",
    value,
    "--yes",
    "--force",
    "--scope",
    scope,
  ];
  // service role: keep sensitive; public keys can be readable
  if (key === "SUPABASE_SERVICE_ROLE_KEY") {
    args.push("--sensitive");
  } else {
    args.push("--no-sensitive");
  }
  const add = spawnSync("vercel", args, {
    encoding: "utf8",
    shell: true,
    cwd: ROOT,
  });
  if (add.status !== 0) {
    console.error(
      `FAIL ${key}:`,
      (add.stderr || add.stdout || "").slice(0, 500),
    );
    process.exit(1);
  }
  console.log(`OK ${key}`);
}

console.log("Env Supabase sincronizado en inventario-rg");
