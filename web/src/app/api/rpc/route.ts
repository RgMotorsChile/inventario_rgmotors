import { NextResponse } from "next/server";
import { requireManagementApi } from "@/lib/auth";
import { requireStaffFromRequest } from "@/lib/bodegaAuth";
import { createServerSupabase } from "@/lib/supabase/client";
import { useSupabaseInventory } from "@/lib/db";
import { actorHeaders, authorizeRpc, parseRpcBody } from "@/lib/rpc-policy";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!useSupabaseInventory()) {
    return NextResponse.json(
      { error: "Inventario Supabase no configurado" },
      { status: 500 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const body = parseRpcBody(raw);
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const hasBearer = (req.headers.get("authorization") || "").startsWith("Bearer ");
  let decision;
  let actorId: string;
  if (hasBearer) {
    const gate = await requireStaffFromRequest(req);
    if ("error" in gate) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    actorId = gate.userId;
    decision = authorizeRpc(body, {
      kind: "staff",
      userId: gate.userId,
      role: gate.profile.role,
      fullName: gate.profile.full_name,
    });
  } else {
    const session = await requireManagementApi();
    if (!session.ok) return session.response;
    actorId = session.user.id;
    decision = authorizeRpc(body, { kind: "management", userId: session.user.id, fullName: session.profile.full_name });
  }
  if (!decision.ok) {
    return NextResponse.json({ error: decision.error }, { status: decision.status });
  }

  const sb = createServerSupabase(actorHeaders(actorId));
  const { data, error } = await sb.rpc(decision.fn, decision.params);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
