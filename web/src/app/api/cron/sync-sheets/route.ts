import { NextResponse } from "next/server";
import { useSupabaseInventory } from "@/lib/db";
import { syncComprasNow, syncPatioNow } from "@/lib/sync-stock";
import { cronAllowed } from "@/lib/cron-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  if (!cronAllowed(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!useSupabaseInventory()) {
    return NextResponse.json({ error: "Inventario no configurado" }, { status: 500 });
  }

  const patio = await syncPatioNow().catch((err: unknown) => ({
    error: err instanceof Error ? err.message : "Patio",
  }));
  const compras = await syncComprasNow().catch((err: unknown) => ({
    error: err instanceof Error ? err.message : "Compras",
  }));

  return NextResponse.json({
    ok: !("error" in patio) && !("error" in compras),
    patio,
    compras,
    syncedAt: new Date().toISOString(),
  });
}
