import { describe, expect, it } from "vitest";
import {
  closedRowStatus,
  mergeSheetVehicleRows,
  normalizeLocation,
  parseSalgadoCsv,
  parseStockCsv,
  parseStockMatrix,
} from "./sheet-vehicles";

const RG_CSV = [
  ",PATENTE,MARCA,MODELO,COLOR,AÑO,PRECIO LISTA,PRECIO OFERTA,KILOMETRAJE,PROVEEDOR,REVISIÓN,PERMISO,UBICACIÓN",
  '1,"THZF 75",MITSUBISHI,KATANA 4X2,ROJO,2024,"$15.990.000","$14.990.000",65000,ECONO,agosto 2026,AGOSTO,CARDONAL',
  ",,,PREPARACION,,,,,,,,,",
  '8,PSFK52,FORD,RANGER XLT 4X4,GRIS,2021,FALTA PREPARACION,FALTA PREPARACION,,ARVAL,,,TALLER SALGADO',
  '9,XXXX,,SIN MODELO,ROJO,2021,,,,,,,,',
].join("\n");

const UC_CSV = [
  ",PATENTE,MARCA,MODELO,COLOR,AÑO,PRECIO LISTA,PRECIO OFERTA,KILOMETRAJE,PROVEEDOR,REV. TECNICA,PERMISO CIRCULACION,UBICACION",
  '1,"RZVK 91",TOYOTA,HILUX 4X4,ROJO,2022,"$18.990.000","$17.990.000",151000,CHARRIOT,octubre 2026,MARZO,UNI CHILE',
  '2,PYSY84,PEUGEOT,PARTNER,BLANCO,2021,"$10.990.000","$8.990.000",160000,ECONO,JULIO,AGOSTO,UNI CHILE',
].join("\n");

const PREP_CSV = [
  ",PATENTE,MARCA,MODELO,COLOR,AÑO,PRECIO LISTA,PRECIO OFERTA,KILOMETRAJE,PROVEEDOR,REV. TECNICA,PERMISO CIRCULACION,UBICACION",
  "1,RLRG95,PEUGEOT,PARTNER,BLANCA,2022,FALTA PREPARACION,FALTA PREPARACION,79809,ECONORENT,,,TALLER SALGADO LUIS DIAZ",
  "3,PJBL79,MITSUBISHI,L200 KATANA CRT 4X4,ROJO,2021,CAMION 16-09,CAMION 16-09,136848,ECONO,enero 2027,marzo 2027,TALLER SALGADO LUIS DIAZ",
  "9,SOLOPLACA,,,,,,,,,,",
].join("\n");

const SAL_CSV = [
  '.,STOCK SALGADO AUTOMOTRIZ ORIGEN,ID,LINK FOTOS BUSCAR POR ID PATENTE,MARCA,MODELO,COLOR,AÑO,PRECIO,KILOMETRAJE,REV,PERMISO,UBICACION',
  ",CONSIG,323,TRBX87,MG,ZS,GRIS PLATA,2024,8990000,27523,,,PATIO",
  ",CONSIG,306,KVGK53 -,SUZUKI,BALENO GLS,AZUL,2019,7990000,102091,,,PATIO",
  ",CONSIG,280,LWRS - 59,JAC,T6,PLATEADO,2020,8990000,31665,,,PATIO",
  ",PROPIO,291,RYYX50,CHEVROLET,TRACKER,AZUL,2022,9990000,48001,,,UNIDADES",
  ",CONSIG,1,NOESPLACA,FORD,RANGER,ROJO,2021,1,1,,,PATIO",
].join("\n");

describe("parseStockCsv", () => {
  it("lee RG MOTORS e incluye preparación, taller y Don Rudy", () => {
    const csv = [
      RG_CSV,
      ",,,DON RUDY,,,,,,,,,",
      "1,JYFW75,CHEVROLET,TAHOE,CELESTE,2017,,,,,,,EN PODER DE DON RUDY",
      ",,,SALGADO,,,,,,,,,",
      "2,RTZH73,MG,ZS,ROJO,2022,,,,,,,SALGADO",
    ].join("\n");
    const rows = parseStockCsv(csv, "Disponible", "RG MOTORS");
    expect(rows.map((r) => r.plate)).toEqual(["THZF 75", "PSFK 52", "JYFW 75", "RTZH 73"]);
    expect(rows.find((r) => r.plate === "PSFK 52")?.status).toBe("En preparación");
    expect(rows.find((r) => r.plate === "THZF 75")).toMatchObject({
      status: "Disponible",
      location: "Cardonal",
      source: "RG MOTORS",
    });
    expect(rows.find((r) => r.plate === "JYFW 75")).toMatchObject({
      status: "En poder de Don Rudy",
      location: "Don Rudy",
    });
    expect(rows.find((r) => r.plate === "RTZH 73")?.status).toBe("En taller");
  });

  it("lee Unidades Chile con el mismo formato", () => {
    const rows = parseStockCsv(UC_CSV, "Disponible");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      plate: "RZVK 91",
      brand: "Toyota",
      model: "HILUX 4X4",
      status: "Disponible",
    });
  });

  it("marca preparación y camión en la hoja PREPARACION", () => {
    const rows = parseStockCsv(PREP_CSV, "En preparación");
    expect(rows.find((r) => r.plate === "RLRG 95")?.status).toBe("En preparación");
    expect(rows.find((r) => r.plate === "PJBL 79")?.status).toBe("En tránsito");
    expect(rows.every((r) => /[0-9]/.test(r.plate))).toBe(true);
  });

  it("lee la segunda tabla PATENTE aunque la fila venga con huecos", () => {
    const header: string[] = [];
    header[1] = "PATENTE";
    header[2] = "MARCA";
    header[3] = "MODELO";
    header[29] = "PATENTE";
    header[30] = "MARCA";
    header[31] = "MODELO";
    const data: string[] = [];
    data[1] = "KWRC 91";
    data[2] = "MITSUBISHI";
    data[3] = "KATANA";
    data[29] = "ZZZZ99";
    data[30] = "FORD";
    data[31] = "RANGER";
    const rows = parseStockMatrix([header, data], "Disponible", "RG MOTORS");
    expect(rows.map((r) => r.plate).sort()).toEqual(["KWRC 91", "ZZZZ 99"]);
    expect(rows.find((r) => r.plate === "ZZZZ 99")).toMatchObject({
      brand: "Ford",
      model: "RANGER",
      source: "RG MOTORS",
    });
  });

  it("carga una patente suelta aunque falte encabezado o marca", () => {
    const rows = parseStockCsv("anotacion\nPLDL15\nPLLD 15", "", "RG MOTORS");
    expect(rows.map((r) => r.plate).sort()).toEqual(["PLDL 15", "PLLD 15"]);
    expect(rows[0].brand).toBe("Por confirmar");
  });

  it("acepta patente sin marca o modelo", () => {
    const csv = [
      ",PATENTE,MARCA,MODELO,COLOR,AÑO,PRECIO LISTA,,, ,,,UBICACION",
      "1,ABCD12,,,,,,,,,",
    ].join("\n");
    const rows = parseStockCsv(csv, "En preparación");
    expect(rows).toEqual([
      {
        plate: "ABCD 12",
        brand: "Por confirmar",
        model: "Por confirmar",
        year: null,
        color: "Sin color",
        status: "En preparación",
        supplier: "",
        location: "Preparación",
        source: "",
        purchase_lot: "",
        note: "",
      },
    ]);
  });
});

describe("parseSalgadoCsv", () => {
  it("lee patentes aunque vengan sucias o con guion", () => {
    const rows = parseSalgadoCsv(SAL_CSV);
    const plates = rows.map((r) => r.plate);
    expect(plates).toEqual(["TRBX 87", "KVGK 53", "LWRS 59", "RYYX 50"]);
    expect(rows.find((r) => r.plate === "TRBX 87")?.status).toBe("En taller");
    expect(rows.find((r) => r.plate === "RYYX 50")?.brand).toBe("Chevrolet");
  });
});

describe("closedRowStatus", () => {
  it("marca vendido y no confunde NO VENDIDO", () => {
    expect(closedRowStatus(["THZF 75", "VENDIDO"])).toBe("Vendido");
    expect(closedRowStatus(["THZF 75", "NO VENDIDO"])).toBeNull();
  });
});

describe("normalizeLocation", () => {
  it("Patio de Salgado es taller; Patio de RG se queda Patio", () => {
    expect(normalizeLocation("PATIO", "Salgado")).toBe("Taller Salgado");
    expect(normalizeLocation("PATIO", "RG MOTORS")).toBe("Patio");
    expect(normalizeLocation("UNIDADES DE CHILE")).toBe("Unidades Chile");
  });
});

describe("parseStockCsv vendidos", () => {
  it("incluye patentes vendidas con estado Vendido", () => {
    const csv = [
      ",PATENTE,MARCA,MODELO,COLOR,AÑO,PRECIO LISTA,,,,,,,,,UBICACIÓN",
      '1,"RKRG 58",KIA,MORNING,BLANCO,2021,VENDIDO,,,,,,,,CARDONAL',
    ].join("\n");
    const rows = parseStockCsv(csv);
    expect(rows[0]).toMatchObject({ plate: "RKRG 58", status: "Vendido" });
  });
});

describe("mergeSheetVehicleRows", () => {
  it("conserva En preparación si la misma patente aparece en otra hoja", () => {
    const merged = mergeSheetVehicleRows(
      {
        plate: "RYYX 50",
        brand: "Chevrolet",
        model: "TRACKER",
        year: 2022,
        color: "Azul",
        status: "Disponible",
        supplier: "",
        location: "",
        source: "",
        purchase_lot: "",
        note: "",
      },
      {
        plate: "RYYX 50",
        brand: "Chevrolet",
        model: "TRACKER MT",
        year: 2022,
        color: "Azul",
        status: "En preparación",
        supplier: "",
        location: "",
        source: "",
        purchase_lot: "",
        note: "",
      },
    );
    expect(merged.status).toBe("En preparación");
    expect(merged.model).toBe("TRACKER MT");
  });

  it("conserva el origen de RG MOTORS si la misma patente reaparece en Salgado", () => {
    const merged = mergeSheetVehicleRows(
      {
        plate: "CRBW 65",
        brand: "Chevrolet",
        model: "SAIL",
        year: 2018,
        color: "Blanco",
        status: "En taller",
        supplier: "",
        location: "Taller Salgado",
        source: "RG MOTORS",
        purchase_lot: "",
        note: "",
      },
      {
        plate: "CRBW 65",
        brand: "Chevrolet",
        model: "SAIL",
        year: 2018,
        color: "Blanco",
        status: "En taller",
        supplier: "",
        location: "CLIENTE",
        source: "Salgado",
        purchase_lot: "",
        note: "",
      },
    );
    expect(merged.source).toBe("RG MOTORS");
    expect(merged.location).toBe("CLIENTE");
  });
});
