import { describe, expect, it } from "vitest";
import { parseSantiagoCsv, splitSantiagoModel } from "./santiago-vehicles";

const CSV = [
  "Patente,Fecha de compra,Modelo,Año,Provedor,Retiro,Ubicación,Obs. Stgo,Obs. Rudy ig.,Obs. Rudy",
  "LXPJ27,28/7/2026,CHEVROLET COLORADO LTZ 4X4 2.8,2020,RELSA,Retirada,Puerto Montt,Sensor de neumaticos,,",
  "RJHT24,8/9/2026,TOYOTA HILUX DX 4X2,2022,ECONO,Pendiente doc.,PROVEDOR,,,",
  "SFYB24,18/8/2026,MITSUBISHI NEW KATANA CRT 4X4,2023,,Retirada,En transito tierra,,,",
  "SLBH24,,HYUNDAI SANTA FE 4WD 2.5 AUT,2023,,,,,Tapabarro rayado,,",
].join("\n");

describe("splitSantiagoModel", () => {
  it("separa marca, modelo y color", () => {
    expect(splitSantiagoModel("TOYOTA HILUX 4X4 ROJO")).toEqual({
      brand: "Toyota",
      model: "HILUX 4X4",
      color: "ROJO",
    });
  });
});

describe("parseSantiagoCsv", () => {
  it("lee patentes de Santiago con proveedor y ubicación", () => {
    const rows = parseSantiagoCsv(CSV);
    expect(rows.map((r) => r.plate)).toEqual(["LXPJ 27", "RJHT 24", "SFYB 24", "SLBH 24"]);
    const july = parseSantiagoCsv(CSV, "07/26");
    expect(july.find((r) => r.plate === "LXPJ 27")).toMatchObject({
      brand: "Chevrolet",
      model: "COLORADO LTZ 4X4 2.8",
      supplier: "RELSA",
      location: "Puerto Montt",
      source: "Santiago",
      purchase_lot: "07/26",
    });
    expect(rows.find((r) => r.plate === "LXPJ 27")).toMatchObject({
      brand: "Chevrolet",
      model: "COLORADO LTZ 4X4 2.8",
      supplier: "RELSA",
      location: "Puerto Montt",
      source: "Santiago",
      purchase_lot: "07/26",
    });
    expect(rows.find((r) => r.plate === "RJHT 24")?.status).toBe("En proveedor");
    expect(rows.find((r) => r.plate === "SFYB 24")?.status).toBe("En tránsito");
    expect(rows.find((r) => r.plate === "SLBH 24")?.location).toBe("Santiago");
  });

  it("asigna el mes de una pestaña nueva", () => {
    const rows = parseSantiagoCsv(CSV, "01/27");
    expect(rows.find((r) => r.plate === "LXPJ 27")?.purchase_lot).toBe("01/27");
  });
});
