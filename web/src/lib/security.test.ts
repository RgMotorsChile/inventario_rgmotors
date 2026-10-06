import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "..");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("secretos y superficie pública", () => {
  it("el frontend web no embebe secrets de servicio", () => {
    const envExample = read("web/.env.example");
    expect(envExample).not.toMatch(/\bik_[A-Za-z0-9]+/);
    expect(envExample).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(envExample).toMatch(/SUPABASE_SERVICE_ROLE_KEY=/);
    expect(envExample).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./);
  });

  it("el cliente de servidor no cae a la anon key", () => {
    const src = read("web/src/lib/supabase/client.ts");
    expect(src).toContain("Falta SUPABASE_SERVICE_ROLE_KEY");
    expect(src).not.toMatch(
      /SUPABASE_SERVICE_ROLE_KEY\?\.trim\(\)\s*\|\|\s*SUPABASE_ANON_KEY/,
    );
  });

  it("el export Excel exige requireManagement", () => {
    const src = read("web/src/app/api/export/route.ts");
    expect(src).toContain("requireManagement");
    expect(src).toContain("Cache-Control");
    expect(src).toContain("no-store");
  });

  it("las escrituras de inventario pasan por RPC, no por update directo de items", () => {
    const store = read("rg_inventario/lib/state/inventory_store.dart");
    expect(store).toContain("receive_stock");
    expect(store).toContain("deliver_item");
    expect(store).not.toMatch(/from\('items'\)\.(update|insert|delete)/);
  });
});

describe("superficie del panel", () => {
  it("/api/rpc no expone las RPC *_for con p_user_id libre", () => {
    const policy = read("web/src/lib/rpc-policy.ts");
    const staff = policy.slice(policy.indexOf("STAFF_FNS"), policy.indexOf("MANAGEMENT_FNS"));
    expect(staff).not.toContain('"claim_invite_for"');
    expect(staff).not.toContain('"ensure_profile_for"');
  });

  it("next.config manda cabeceras anti-clickjacking y nosniff", () => {
    const cfg = read("web/next.config.ts");
    expect(cfg).toContain("frame-ancestors 'none'");
    expect(cfg).toContain("X-Content-Type-Options");
    expect(cfg).toContain("async headers()");
  });

  it("las pantallas antiguas ya no existen (solo quedan los redirects)", () => {
    for (const old of ["stock", "catalogo", "categorias", "rastro", "movimientos", "trabajadores", "equipo"]) {
      expect(() => read(`web/src/app/${old}/page.tsx`)).toThrow();
    }
  });
});
