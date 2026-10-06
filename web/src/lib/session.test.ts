import { describe, expect, it } from "vitest";
import { REMEMBER_MAX_AGE, authCookieOptions, authCookieWriteOptions, wantsRemember } from "./session";

describe("wantsRemember", () => {
  it("queda activa salvo que el usuario la apague", () => {
    expect(wantsRemember(undefined)).toBe(true);
    expect(wantsRemember("1")).toBe(true);
    expect(wantsRemember("0")).toBe(false);
  });
});

describe("authCookieOptions", () => {
  it("persiste 30 días si hay que mantener la sesión", () => {
    const options = authCookieOptions(true);
    expect(options.accessToken.maxAge).toBe(REMEMBER_MAX_AGE);
    expect(options.refreshToken.maxAge).toBe(REMEMBER_MAX_AGE);
  });

  it("no deja Max-Age si la sesión es solo de esta visita", () => {
    const options = authCookieOptions(false);
    expect(options.accessToken.maxAge).toBeUndefined();
    expect(options.refreshToken.expires).toBeUndefined();
  });
});

describe("authCookieWriteOptions", () => {
  it("sin recordar deja cookie de sesión", () => {
    const o = authCookieWriteOptions("tok", { maxAge: 34560000, path: "/" }, "0", true);
    expect(o.maxAge).toBeUndefined();
    expect(o.expires).toBeUndefined();
    expect(o.httpOnly).toBe(true);
    expect(o.secure).toBe(true);
  });

  it("con recordar usa 30 días, no 400", () => {
    const o = authCookieWriteOptions("tok", { maxAge: 34560000 }, "1", false);
    expect(o.maxAge).toBe(REMEMBER_MAX_AGE);
    expect(o.secure).toBeUndefined();
  });

  it("respeta el borrado al cerrar sesión", () => {
    const o = authCookieWriteOptions("", { maxAge: 0 }, "0", true);
    expect(o.maxAge).toBe(0);
  });
});
