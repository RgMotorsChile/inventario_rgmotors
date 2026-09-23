import { describe, expect, it } from "vitest";
import { REMEMBER_MAX_AGE, authCookieOptions, wantsRemember } from "./session";

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
