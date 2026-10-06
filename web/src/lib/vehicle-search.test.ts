import { describe, expect, it } from "vitest";
import { filterVehicles, uniqueSorted } from "./vehicle-search";

const rows = [
  {
    plate: "THZF 75",
    brand: "Mitsubishi",
    model: "KATANA",
    status: "Disponible",
    supplier: "Econo",
    location: "Cardonal",
    note: "",
  },
  {
    plate: "LXPJ 27",
    brand: "Chevrolet",
    model: "COLORADO",
    status: "Disponible",
    supplier: "Relsa",
    location: "Santiago",
    note: "Sensor de presión",
  },
];

describe("filterVehicles", () => {
  it("filtra por patente de inmediato", () => {
    expect(filterVehicles(rows, "lxpj")).toEqual([rows[1]]);
  });

  it("encuentra la patente aunque se escriba pegada", () => {
    expect(filterVehicles(rows, "thzf75")).toEqual([rows[0]]);
    expect(filterVehicles(rows, "THZF-75")).toEqual([rows[0]]);
  });

  it("filtra por proveedor", () => {
    expect(filterVehicles(rows, "", "econo")).toEqual([rows[0]]);
  });

  it("filtra por ubicación", () => {
    expect(filterVehicles(rows, "", "", "santiago")).toEqual([rows[1]]);
  });
});

describe("uniqueSorted", () => {
  it("deja valores únicos", () => {
    expect(uniqueSorted(["Cardonal", "", "Santiago", "Cardonal"])).toEqual([
      "Cardonal",
      "Santiago",
    ]);
  });
});
