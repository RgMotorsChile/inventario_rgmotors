import { NextResponse } from "next/server";
import { requireManagementApi } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/client";
import { useSupabaseInventory } from "@/lib/db";
import { fetchSantiagoSheetVehicles } from "@/lib/santiago-vehicles";

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
    const { vehicles, sources } = await fetchSantiagoSheetVehicles();
    if (vehicles.length === 0) {
      return NextResponse.json(
        { error: "La planilla de Santiago no trajo patentes" },
        { status: 502 },
      );
    }

    const sb = createServerSupabase();
    const { data, error } = await sb.rpc("sync_vehicles_from_sheet", {
      p_rows: vehicles,
      p_sync_key: "rg_motors_compras",
    });
    if (error) {
      return NextResponse.json({ error: error.message, read: vehicles.length, sources }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      source: "Compras Santiago",
      sources,
      read: vehicles.length,
      result: data,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer las compras";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
