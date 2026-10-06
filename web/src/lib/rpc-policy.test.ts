import { describe, expect, it } from "vitest";
import { actorHeaders, authorizeRpc, parseRpcBody } from "./rpc-policy";

const bodega = { kind: "staff" as const, userId: "u-bodega", role: "bodega", fullName: "Pedro Bodega" };
const jefaturaApp = { kind: "staff" as const, userId: "u-jef", role: "jefatura" };
const panel = { kind: "management" as const, userId: "u-panel", fullName: "Jefa Panel" };

describe("authorizeRpc", () => {
  it("bodega no puede llamar *_for con un p_user_id ajeno", () => {
    for (const fn of ["ensure_profile_for", "claim_invite_for"]) {
      const out = authorizeRpc({ fn, params: { p_user_id: "otro", p_full_name: "x" } }, bodega);
      expect(out).toEqual({ ok: false, status: 400, error: "Función no permitida" });
    }
  });

  it("ensure_profile / claim_invite quedan amarrados al usuario del token", () => {
    const a = authorizeRpc({ fn: "ensure_profile", params: { p_user_id: "otro", p_full_name: "Ana" } }, bodega);
    expect(a).toEqual({ ok: true, fn: "ensure_profile_for", params: { p_user_id: "u-bodega", p_full_name: "Ana" } });
    const b = authorizeRpc({ fn: "claim_invite", params: { p_code: "ABCD1234", p_user_id: "otro" } }, bodega);
    expect(b).toEqual({
      ok: true,
      fn: "claim_invite_for",
      params: { p_user_id: "u-bodega", p_code: "ABCD1234", p_full_name: null },
    });
  });

  it("bodega no puede usar funciones de jefatura", () => {
    expect(authorizeRpc({ fn: "create_invite", params: { p_role: "jefatura" } }, bodega)).toEqual({
      ok: false,
      status: 403,
      error: "Solo jefatura",
    });
    expect(authorizeRpc({ fn: "create_invite", params: {} }, jefaturaApp).ok).toBe(true);
  });

  it("el panel no llama funciones fuera de la lista", () => {
    expect(authorizeRpc({ fn: "sync_vehicles_from_sheet", params: {} }, panel).ok).toBe(false);
    expect(authorizeRpc({ fn: "ensure_profile", params: {} }, panel).ok).toBe(false);
    expect(authorizeRpc({ fn: "upsert_item", params: {} }, panel).ok).toBe(true);
  });
});

describe("parseRpcBody", () => {
  it("rechaza cuerpos que no son objeto o params raros", () => {
    expect(parseRpcBody(null)).toBeNull();
    expect(parseRpcBody([])).toBeNull();
    expect(parseRpcBody({ fn: 3 })).toBeNull();
    expect(parseRpcBody({ fn: "x", params: [1] })).toBeNull();
    expect(parseRpcBody({ fn: "x", params: "a" })).toBeNull();
  });

  it("acepta params ausentes", () => {
    expect(parseRpcBody({ fn: "x" })).toEqual({ fn: "x", params: {} });
  });
});

describe("correct_delivery_plate", () => {
  it("el actor sale de la sesión, no del cliente", () => {
    const req = { fn: "correct_delivery_plate", params: { p_movement_id: "m1", p_plate: "AB 12", p_actor_id: "falso", p_actor_name: "Falso" } };
    expect(authorizeRpc(req, bodega)).toEqual({
      ok: true,
      fn: "correct_delivery_plate",
      params: { p_movement_id: "m1", p_plate: "AB 12", p_actor_id: "u-bodega", p_actor_name: "Pedro Bodega" },
    });
    expect(authorizeRpc(req, panel)).toMatchObject({ ok: true, params: { p_actor_id: "u-panel", p_actor_name: "Jefa Panel" } });
  });
});

describe("actorHeaders", () => {
  it("envía el id del usuario para registrar quién hizo el movimiento", () => {
    const id = "7ddc8999-e09a-411d-8d11-c15b1a717894";
    expect(actorHeaders(id)).toEqual({ "x-inv-actor-id": id });
  });
  it("no envía nada si el id no es un uuid", () => {
    expect(actorHeaders("x' or 1=1")).toEqual({});
    expect(actorHeaders(undefined)).toEqual({});
  });
});
