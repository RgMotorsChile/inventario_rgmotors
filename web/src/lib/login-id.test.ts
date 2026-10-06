import { describe, expect, it } from "vitest";
import { mustChangePassword, resolveLoginEmail } from "./login-id";

describe("resolveLoginEmail", () => {
  it("completa el dominio si solo viene el usuario", () => {
    expect(resolveLoginEmail("Santiago")).toBe("santiago@rgmotors.cl");
  });

  it("respeta un correo completo", () => {
    expect(resolveLoginEmail("  santiago@rgmotors.cl ")).toBe("santiago@rgmotors.cl");
  });

  it("usa @rgmotorschile.cl para Constanza y Rudy González", () => {
    expect(resolveLoginEmail("constanza.gonzalez")).toBe(
      "constanza.gonzalez@rgmotorschile.cl",
    );
    expect(resolveLoginEmail("Rudy.Gonzalez")).toBe("rudy.gonzalez@rgmotorschile.cl");
  });
});

describe("mustChangePassword", () => {
  it("lee el flag del primer ingreso", () => {
    expect(mustChangePassword({ must_change_password: true })).toBe(true);
    expect(mustChangePassword({ must_change_password: false })).toBe(false);
    expect(mustChangePassword({})).toBe(false);
  });
});
