import { NextResponse } from "next/server";
import {
  inventoryDb,
  requireStaffFromRequest,
  TENANT,
} from "@/lib/bodegaAuth";
import { useSupabaseInventory } from "@/lib/db";

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
    sb.from("vehicles").select("*").eq("tenant_id", t).order("brand"),
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
    vehicles: vehicles.data ?? [],
    movements: movements.data ?? [],
    boxes: boxes.data ?? [],
    box_lines: boxLines.data ?? [],
    workers: workers.data ?? [],
    assignments: assignments.data ?? [],
    categories: categories.data ?? [],
  });
}
