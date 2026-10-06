import { NextResponse } from "next/server";
import { requireManagementApi } from "@/lib/auth";
import { useSupabaseInventory } from "@/lib/db";
import { syncPatioNow } from "@/lib/sync-stock";

export const maxDuration = 60;

export async function POST() {
  const session = await requireManagementApi();
  if (!session.ok) return session.response;

  if (!useSupabaseInventory()) {
    return NextResponse.json(
      { error: "Inventario Supabase no configurado" },
      { status: 500 },
    );
  }

  try {
    const result = await syncPatioNow();
    return NextResponse.json({
      source: "RG MOTORS + UNIDADES CHILE + SALGADO + PREPARACION",
      ...result,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer el stock";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
