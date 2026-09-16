import { describe, expect, it } from "vitest";
import { itemStatus, plateNorm, when, whenDate, whenTime } from "./format";

describe("plateNorm", () => {
  it("quita espacios y deja mayúsculas", () => {
    expect(plateNorm("thzf 75")).toBe("THZF75");
  });

  it("ignora nulos", () => {
    expect(plateNorm(null)).toBe("");
    expect(plateNorm(undefined)).toBe("");
  });

  it("agrupa la misma patente escrita distinto", () => {
    expect(plateNorm("TH-ZF-75")).toBe(plateNorm("thzf75"));
  });
});

describe("itemStatus", () => {
  it("marca sin stock", () => {
    expect(itemStatus(0, 2)).toEqual({ label: "Sin stock", tone: "bad" });
  });

  it("marca stock bajo en el mínimo", () => {
    expect(itemStatus(1, 1)).toEqual({ label: "Stock bajo", tone: "warn" });
  });

  it("marca en nivel sobre el mínimo", () => {
    expect(itemStatus(8, 2)).toEqual({ label: "En nivel", tone: "ok" });
  });
});

describe("fechas Chile", () => {
  const noonUtc = "2026-09-16T15:00:00.000Z";

  it("when no inventa fecha vacía", () => {
    expect(when(null)).toBe("—");
    expect(whenDate("")).toBe("—");
    expect(whenTime(undefined)).toBe("—");
  });

  it("formatea hora en zona Chile", () => {
    expect(whenTime(noonUtc)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("incluye el año en la fecha larga", () => {
    expect(whenDate(noonUtc)).toContain("2026");
  });
});
