import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth";
import { requireStaffFromRequest } from "@/lib/bodegaAuth";
import { createServerSupabase } from "@/lib/supabase/client";
import { useSupabaseInventory } from "@/lib/db";

const STAFF_FNS = new Set([
  "receive_stock",
  "receive_item",
  "receive_box",
  "assign_item",
  "return_assignment",
  "use_item",
  "deliver_item",
  "attach_box_evidence",
  "attach_receive_photo",
  "claim_invite",
  "ensure_profile",
  "claim_invite_for",
  "ensure_profile_for",
]);

const MANAGEMENT_FNS = new Set([
  "upsert_category",
  "upsert_item",
  "adjust_stock",
  "upsert_vehicle",
  "upsert_worker",
  "delete_worker",
  "create_box",
  "create_invite",
  "set_profile_active",
]);

const ALLOWED = new Set([...STAFF_FNS, ...MANAGEMENT_FNS]);

export async function POST(req: Request) {
  if (!useSupabaseInventory()) {
    return NextResponse.json(
      { error: "Inventario Supabase no configurado" },
      { status: 500 },
    );
  }

  const body = (await req.json()) as { fn?: string; params?: Record<string, unknown> };
  const fn = String(body.fn ?? "");
  if (!ALLOWED.has(fn)) {
    return NextResponse.json({ error: "Función no permitida" }, { status: 400 });
  }
  const params = body.params ?? {};
  const hasBearer = (req.headers.get("authorization") || "").startsWith("Bearer ");
  const sb = createServerSupabase();

  if (hasBearer) {
    const gate = await requireStaffFromRequest(req);
    if ("error" in gate) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    if (MANAGEMENT_FNS.has(fn) && !["jefatura", "admin"].includes(gate.profile.role)) {
      return NextResponse.json({ error: "Solo jefatura" }, { status: 403 });
    }

    let rpcFn = fn;
    let rpcParams = params;
    if (fn === "claim_invite") {
      rpcFn = "claim_invite_for";
      rpcParams = {
        p_user_id: gate.userId,
        p_code: params.p_code,
        p_full_name: params.p_full_name ?? null,
      };
    } else if (fn === "ensure_profile") {
      rpcFn = "ensure_profile_for";
      rpcParams = {
        p_user_id: gate.userId,
        p_full_name: params.p_full_name ?? null,
      };
    }
    const { data, error } = await sb.rpc(rpcFn, rpcParams);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  }

  await requireManagement();
  const { data, error } = await sb.rpc(fn, params);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
