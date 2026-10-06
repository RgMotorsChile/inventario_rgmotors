import { describe, expect, it } from "vitest";
import { isComprasVehicle, isPatioVehicle } from "./vehicle-scope";

describe("vehicle-scope", () => {
  it("Patio es RG Motors y Unidades Chile; Compras es solo Santiago", () => {
    expect(isPatioVehicle({ source: "RG MOTORS" })).toBe(true);
    expect(isPatioVehicle({ source: "UNIDADES CHILE" })).toBe(true);
    expect(isPatioVehicle({ source: "RG MOTORS", purchase_lot: "08/26" })).toBe(true);
    expect(isPatioVehicle({ source: "Santiago" })).toBe(false);
    expect(isPatioVehicle({ source: "Santiago", purchase_lot: "08/26" })).toBe(false);
    expect(isPatioVehicle({ source: "Santiago", location: "Cardonal" })).toBe(true);
    expect(isPatioVehicle({ source: "Santiago", status: "En preparación" })).toBe(true);

    expect(isComprasVehicle({ source: "Santiago", purchase_lot: "09/26" })).toBe(true);
    expect(isComprasVehicle({ source: "Santiago" })).toBe(true);
    expect(isComprasVehicle({ source: "", purchase_lot: "07/26" })).toBe(true);
    expect(isComprasVehicle({ source: "RG MOTORS", purchase_lot: "08/26" })).toBe(false);
    expect(isComprasVehicle({ source: "UNIDADES CHILE", purchase_lot: "07/26" })).toBe(false);
    expect(isComprasVehicle({ source: "Salgado", purchase_lot: "" })).toBe(false);
  });

  it("las patentes del Excel de patio no se van a Compras por tener lote", () => {
    const patio = [
      { source: "RG MOTORS", purchase_lot: "08/26", location: "Cardonal" },
      { source: "RG MOTORS", purchase_lot: "07/26", location: "Cardonal" },
      { source: "UNIDADES CHILE", purchase_lot: "07/26", location: "Unidades Chile" },
    ];
    for (const row of patio) {
      expect(isPatioVehicle(row)).toBe(true);
      expect(isComprasVehicle(row)).toBe(false);
    }
  });
});
