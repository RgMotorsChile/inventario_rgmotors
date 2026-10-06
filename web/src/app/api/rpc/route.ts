import { NextResponse } from "next/server";
import { requireManagementApi } from "@/lib/auth";
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
  "correct_delivery_plate",
  "attach_box_evidence",
  "attach_receive_photo",
  // Solo nombres públicos; el server remapea a *_for con p_user_id=gate.userId.
  // Nunca exponer claim_invite_for / ensure_profile_for (IDOR de p_user_id).
  "claim_invite",
  "ensure_profile",
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
    } else if (fn === "correct_delivery_plate") {
      rpcParams = {
        ...params,
        p_actor_id: gate.userId,
        p_actor_name: gate.profile.full_name,
      };
    }
    const { data, error } = await sb.rpc(rpcFn, rpcParams);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  }

  const session = await requireManagementApi();
  if (!session.ok) return session.response;
  const rpcParams =
    fn === "correct_delivery_plate"
      ? {
          ...params,
          p_actor_id: session.user.id,
          p_actor_name: session.profile.full_name,
        }
      : params;
  const { data, error } = await sb.rpc(fn, rpcParams);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
