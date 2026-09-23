import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth";

export async function GET(req: Request) {
  const { db } = await requireManagement();
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "items";

  if (kind === "movements") {
    const { data, error } = await db
      .from("movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data ?? [] });
  }

  if (kind === "assignments") {
    const { data, error } = await db.from("assignments").select("*").eq("status", "abierta");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data ?? [] });
  }

  const { data, error } = await db.from("items").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}
