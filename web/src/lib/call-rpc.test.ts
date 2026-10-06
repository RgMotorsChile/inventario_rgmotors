import { describe, expect, it } from "vitest";
import { OFFLINE_MESSAGE, SESSION_MESSAGE, callRpc } from "./call-rpc";

function fakeFetch(impl: () => Promise<Response>) {
  return (async () => impl()) as unknown as typeof fetch;
}

describe("callRpc", () => {
  it("sin red devuelve error legible en vez de lanzar", async () => {
    const out = await callRpc("upsert_category", {}, fakeFetch(() => Promise.reject(new TypeError("Failed to fetch"))));
    expect(out).toEqual({ data: null, error: { message: OFFLINE_MESSAGE } });
  });

  it("respuesta HTML (no JSON) no rompe el formulario", async () => {
    const out = await callRpc("upsert_category", {}, fakeFetch(async () => new Response("<html>", { status: 500 })));
    expect(out.error?.message).toMatch(/500/);
  });

  it("401 se traduce a sesión caducada", async () => {
    const out = await callRpc("upsert_category", {}, fakeFetch(async () => new Response("{}", { status: 401 })));
    expect(out.error?.message).toBe(SESSION_MESSAGE);
  });

  it("redirección al login (redirect manual) se traduce a sesión caducada", async () => {
    const opaque = { status: 0, type: "opaqueredirect", redirected: false } as unknown as Response;
    const out = await callRpc("upsert_category", {}, fakeFetch(async () => opaque));
    expect(out.error?.message).toBe(SESSION_MESSAGE);
  });

  it("propaga el mensaje de la base", async () => {
    const out = await callRpc(
      "adjust_stock",
      {},
      fakeFetch(async () => Response.json({ error: "El SKU no existe" }, { status: 400 })),
    );
    expect(out.error?.message).toBe("El SKU no existe");
  });

  it("devuelve data cuando sale bien", async () => {
    const out = await callRpc("create_invite", {}, fakeFetch(async () => Response.json({ data: "ABCD1234" })));
    expect(out).toEqual({ data: "ABCD1234", error: null });
  });
});
