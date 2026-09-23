import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/client";
import { useSupabaseInventory } from "@/lib/db";
import { fetchRgMotorsSheetVehicles } from "@/lib/sheet-vehicles";

export async function POST() {
  await requireManagement();

  if (!useSupabaseInventory()) {
    return NextResponse.json(
      { error: "Inventario Supabase no configurado" },
      { status: 500 },
    );
  }

  try {
    const vehicles = await fetchRgMotorsSheetVehicles();
    if (vehicles.length === 0) {
      return NextResponse.json(
        { error: "La hoja RG MOTORS no trajo patentes" },
        { status: 502 },
      );
    }

    const sb = createServerSupabase();
    const { data, error } = await sb.rpc("sync_vehicles_from_sheet", {
      p_rows: vehicles,
    });
    if (error) {
      return NextResponse.json({ error: error.message, read: vehicles.length }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      source: "RG MOTORS",
      read: vehicles.length,
      result: data,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer el stock";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
