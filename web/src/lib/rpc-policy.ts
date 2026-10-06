/**
 * Qué RPC puede pedir cada rol a /api/rpc.
 *
 * `claim_invite_for` y `ensure_profile_for` reciben `p_user_id` y corren con
 * service role: nunca se exponen directo. La app de bodega pide
 * `claim_invite` / `ensure_profile` y el servidor fija `p_user_id` con el
 * usuario del token.
 */
export const STAFF_FNS = new Set([
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
  "claim_invite",
  "ensure_profile",
]);

export const MANAGEMENT_FNS = new Set([
  "upsert_category",
  "upsert_item",
  "adjust_stock",
  "upsert_vehicle",
  "upsert_worker",
  "delete_worker",
  "create_invite",
  "set_profile_active",
]);

/** Solo existen para que el servidor las llame con el usuario del token. */
export const SELF_ONLY_FNS = new Set(["claim_invite", "ensure_profile"]);

export type RpcRequest = { fn: string; params: Record<string, unknown> };

export function parseRpcBody(body: unknown): RpcRequest | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { fn, params } = body as { fn?: unknown; params?: unknown };
  if (typeof fn !== "string") return null;
  if (params !== undefined && params !== null && (typeof params !== "object" || Array.isArray(params))) {
    return null;
  }
  return { fn, params: (params as Record<string, unknown> | null | undefined) ?? {} };
}

export type RpcDecision =
  | { ok: true; fn: string; params: Record<string, unknown> }
  | { ok: false; status: number; error: string };

/** Decide si el rol puede llamar a `fn` y reescribe las RPC "para mí". */
export function authorizeRpc(
  req: RpcRequest,
  who:
    | { kind: "staff"; userId: string; role: string; fullName?: string | null }
    | { kind: "management"; userId: string; fullName?: string | null },
): RpcDecision {
  const { fn } = req;
  // La corrección de patente registra quién la hizo con el usuario de la sesión, nunca el del cliente.
  const params =
    fn === "correct_delivery_plate"
      ? { ...req.params, p_actor_id: who.userId, p_actor_name: who.fullName ?? null }
      : req.params;
  const isStaffFn = STAFF_FNS.has(fn);
  const isManagementFn = MANAGEMENT_FNS.has(fn);
  if (!isStaffFn && !isManagementFn) {
    return { ok: false, status: 400, error: "Función no permitida" };
  }

  if (who.kind === "management") {
    if (SELF_ONLY_FNS.has(fn)) return { ok: false, status: 400, error: "Función no permitida" };
    return { ok: true, fn, params };
  }

  if (isManagementFn && !["jefatura", "admin"].includes(who.role)) {
    return { ok: false, status: 403, error: "Solo jefatura" };
  }
  if (fn === "claim_invite") {
    return {
      ok: true,
      fn: "claim_invite_for",
      params: { p_user_id: who.userId, p_code: params.p_code, p_full_name: params.p_full_name ?? null },
    };
  }
  if (fn === "ensure_profile") {
    return {
      ok: true,
      fn: "ensure_profile_for",
      params: { p_user_id: who.userId, p_full_name: params.p_full_name ?? null },
    };
  }
  return { ok: true, fn, params };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cabecera que las RPCs leen (vía request.headers) para registrar quién hizo el movimiento. */
export function actorHeaders(userId: string | null | undefined): Record<string, string> {
  return userId && UUID_RE.test(userId) ? { "x-inv-actor-id": userId } : {};
}
