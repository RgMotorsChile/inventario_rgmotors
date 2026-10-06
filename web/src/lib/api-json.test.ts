import { describe, expect, it } from "vitest";
import { readApiJson } from "./api-json";

describe("readApiJson", () => {
  it("lee JSON normal", async () => {
    const res = new Response(JSON.stringify({ error: "Falta la unidad" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
    await expect(readApiJson<{ error: string }>(res)).resolves.toEqual({ error: "Falta la unidad" });
  });

  it("explica si el login HTML llega por sesión caducada", async () => {
    const res = new Response("<html>login</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
    Object.defineProperty(res, "redirected", { value: true });
    await expect(readApiJson(res)).rejects.toThrow("Tu sesión caducó. Vuelve a entrar.");
  });

  it("trata un 307 a login como sesión caducada", async () => {
    const res = new Response(null, { status: 307, headers: { location: "/login" } });
    await expect(readApiJson(res)).rejects.toThrow("Tu sesión caducó. Vuelve a entrar.");
  });
});
