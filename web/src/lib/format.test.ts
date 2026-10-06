import { describe, expect, it } from "vitest";
import { canCorrectDeliveryPlate, itemStatus, plateNorm, when, whenDate, whenTime } from "./format";

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

describe("canCorrectDeliveryPlate", () => {
  it("deja corregir dentro de 24 horas", () => {
    const created = new Date("2026-09-23T12:00:00.000Z").getTime();
    expect(canCorrectDeliveryPlate("2026-09-23T10:00:00.000Z", created)).toBe(true);
  });

  it("bloquea después de 24 horas", () => {
    const created = new Date("2026-09-24T13:00:00.000Z").getTime();
    expect(canCorrectDeliveryPlate("2026-09-23T12:00:00.000Z", created)).toBe(false);
  });
});
