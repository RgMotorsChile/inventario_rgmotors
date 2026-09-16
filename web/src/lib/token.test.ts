import { describe, expect, it } from "vitest";
import { isPublicPath, userIdFromAccessToken } from "./token";

function encodeUnsignedJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}

describe("isPublicPath", () => {
  it("deja pasar login y refresh", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login?error=auth")).toBe(true);
    expect(isPublicPath("/api/auth/refresh")).toBe(true);
    expect(isPublicPath("/manifest.webmanifest")).toBe(true);
    expect(isPublicPath("/sw.js")).toBe(true);
  });

  it("protege panel y export", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/inventario")).toBe(false);
    expect(isPublicPath("/unidades")).toBe(false);
    expect(isPublicPath("/personas")).toBe(false);
    expect(isPublicPath("/historial")).toBe(false);
    expect(isPublicPath("/api/export")).toBe(false);
  });
});

describe("userIdFromAccessToken", () => {
  it("lee el sub de un JWT", () => {
    const token = encodeUnsignedJwt({ sub: "user-jefatura-1", role: "authenticated" });
    expect(userIdFromAccessToken(token)).toBe("user-jefatura-1");
  });

  it("rechaza token vacío, roto o sin sub", () => {
    expect(userIdFromAccessToken(undefined)).toBeNull();
    expect(userIdFromAccessToken("no-es-jwt")).toBeNull();
    expect(userIdFromAccessToken(encodeUnsignedJwt({ role: "authenticated" }))).toBeNull();
    expect(userIdFromAccessToken(encodeUnsignedJwt({ sub: "" }))).toBeNull();
  });
});
