import { NextResponse } from "next/server";
import {
  inventoryDb,
  requireStaffFromRequest,
  TENANT,
} from "@/lib/bodegaAuth";
import { useSupabaseInventory } from "@/lib/db";
import { isPatioVehicle } from "@/lib/vehicle-scope";
import { syncPatioIfStale } from "@/lib/sync-stock";

export const maxDuration = 60;

export async function GET(req: Request) {
  const gate = await requireStaffFromRequest(req);
  if ("error" in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  if (!useSupabaseInventory()) {
    return NextResponse.json(
      { error: "Inventario Supabase no configurado" },
      { status: 500 },
    );
  }

  await syncPatioIfStale(20_000).catch(() => undefined);

  const sb = inventoryDb()!;
  const t = TENANT;
  const [
    items,
    vehicles,
    movements,
    boxes,
    boxLines,
    workers,
    assignments,
    categories,
  ] = await Promise.all([
    sb.from("items").select("*").eq("tenant_id", t).order("name"),
    sb
      .from("vehicles")
      .select("id,plate,brand,model,year,color,status,source,location")
      .eq("tenant_id", t)
      .order("brand"),
    sb
      .from("movements")
      .select("*")
      .eq("tenant_id", t)
      .order("created_at", { ascending: false })
      .limit(500),
    sb
      .from("boxes")
      .select("*")
      .eq("tenant_id", t)
      .order("created_at", { ascending: false }),
    sb.from("box_lines").select("*").eq("tenant_id", t),
    sb.from("workers").select("*").eq("tenant_id", t).order("full_name"),
    sb
      .from("assignments")
      .select("*")
      .eq("tenant_id", t)
      .order("created_at", { ascending: false }),
    sb.from("categories").select("*").eq("tenant_id", t).order("name"),
  ]);

  const err =
    items.error ||
    vehicles.error ||
    movements.error ||
    boxes.error ||
    boxLines.error ||
    workers.error ||
    assignments.error ||
    categories.error;
  if (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  return NextResponse.json({
    source: "supabase",
    profile: gate.profile,
    items: items.data ?? [],
    vehicles: (vehicles.data ?? [])
      .filter((row) => isPatioVehicle(row))
      .map(({ source: _source, location: _location, ...row }) => row),
    movements: movements.data ?? [],
    boxes: boxes.data ?? [],
    box_lines: boxLines.data ?? [],
    workers: workers.data ?? [],
    assignments: assignments.data ?? [],
    categories: categories.data ?? [],
  });
}
