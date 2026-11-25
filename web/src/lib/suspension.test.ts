import { describe, expect, it } from "vitest";
import { DEFAULT_SUSPENDED_MESSAGE, parseSuspensionRow } from "./suspension";

describe("parseSuspensionRow", () => {
  it("marca suspendido cuando suspendido=true", () => {
    expect(
      parseSuspensionRow({ suspendido: true, mensaje: "Pausa programada." }),
    ).toEqual({
      suspended: true,
      message: "Pausa programada.",
    });
    expect(parseSuspensionRow({ suspendido: true, mensaje: "  " })).toEqual({
      suspended: true,
      message: DEFAULT_SUSPENDED_MESSAGE,
    });
  });

  it("marca activo cuando suspendido=false o fila vacía", () => {
    expect(
      parseSuspensionRow({ suspendido: false, mensaje: "Cualquiera" }),
    ).toEqual({
      suspended: false,
      message: "",
    });
    expect(parseSuspensionRow(null)).toEqual({ suspended: false, message: "" });
  });
});
