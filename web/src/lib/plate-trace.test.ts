import { describe, expect, it } from "vitest";
import { movementTypeLabel, movementsForPlate, parsePlateParam, platesWithExits, type PlateMovement } from "./plate-trace";

const mov = (over: Partial<PlateMovement>): PlateMovement => ({
  id: Math.random().toString(36),
  type: "uso",
  item_sku: "BAR-1",
  qty: 1,
  plate: "QAZZ 99",
  worker_name: "Ana",
  outcome: "instalado",
  note: null,
  user_name: "Bodega",
  created_at: "2026-10-06T10:00:00Z",
  ...over,
});

describe("trazabilidad por patente", () => {
  it("normaliza el parámetro de la URL", () => {
    expect(parsePlateParam("  qazz 99 ")).toBe("QAZZ 99");
    expect(parsePlateParam(["abcd12", "x"])).toBe("ABCD12");
    expect(parsePlateParam(undefined)).toBe("");
    expect(parsePlateParam("x".repeat(40))).toHaveLength(12);
  });

  it("filtra sin importar espacios ni guiones", () => {
    const rows = [mov({ plate: "QAZZ 99" }), mov({ plate: "QAZZ-99" }), mov({ plate: "OTRA 11" }), mov({ plate: null })];
    expect(movementsForPlate(rows, "qazz99")).toHaveLength(2);
    expect(movementsForPlate(rows, "")).toHaveLength(0);
  });

  it("resume solo salidas a vehículos, la más reciente primero", () => {
    const rows = [
      mov({ plate: "AAAA 11", qty: 2, created_at: "2026-10-01T00:00:00Z" }),
      mov({ plate: "AAAA11", qty: 1, created_at: "2026-10-03T00:00:00Z" }),
      mov({ plate: "BBBB 22", created_at: "2026-10-02T00:00:00Z", type: "dano", outcome: "danado" }),
      mov({ plate: "CCCC 33", type: "ajuste" }),
    ];
    const out = platesWithExits(rows);
    expect(out.map((p) => p.key)).toEqual(["AAAA11", "BBBB22"]);
    expect(out[0]).toMatchObject({ count: 2, qty: 3, last: "2026-10-03T00:00:00Z" });
  });

  it("etiquetas legibles", () => {
    expect(movementTypeLabel("uso", "instalado")).toBe("Instalado");
    expect(movementTypeLabel("uso", "usado")).toBe("Entregado");
    expect(movementTypeLabel("ajuste", null)).toBe("Ajuste");
  });
});

describe("chileWallClock", () => {
  it("deja en el Excel la hora de Chile, no la UTC", async () => {
    const { chileWallClock } = await import("./format");
    expect(chileWallClock("2026-10-06T19:36:49Z").toISOString()).toBe("2026-10-06T16:36:49.000Z");
    expect(chileWallClock("2026-07-01T12:00:00Z").toISOString()).toBe("2026-07-01T08:00:00.000Z");
  });
});
