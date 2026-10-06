import { describe, expect, it } from "vitest";
import {
  canonicalPurchaseLot,
  dateTabCandidates,
  isPurchaseLotTab,
  lotFromPurchaseDate,
  mergePurchaseTabs,
  preferPurchaseLot,
  sortPurchaseLots,
} from "./santiago-lots";

describe("lotFromPurchaseDate", () => {
  it("arma el mes/año de la fecha de compra", () => {
    expect(lotFromPurchaseDate("28/7/2026")).toBe("07/26");
    expect(lotFromPurchaseDate("8/9/2026")).toBe("09/26");
    expect(lotFromPurchaseDate("1/10/2026")).toBe("10/26");
  });
});

describe("sortPurchaseLots", () => {
  it("ordena como las pestañas del Excel", () => {
    expect(sortPurchaseLots(["12/26", "07/26", "Copia de 09/26", "09/26", "Ofertas pendientes"])).toEqual([
      "07/26",
      "09/26",
      "Copia de 09/26",
      "12/26",
      "Ofertas pendientes",
    ]);
  });
});

describe("isPurchaseLotTab", () => {
  it("acepta mes/año y deja fuera pestañas que no son compras", () => {
    expect(isPurchaseLotTab("01/27")).toBe(true);
    expect(isPurchaseLotTab("1/27")).toBe(true);
    expect(isPurchaseLotTab("Copia de 01/27")).toBe(true);
    expect(isPurchaseLotTab("Ofertas pendientes")).toBe(true);
    expect(isPurchaseLotTab("Proveedores")).toBe(false);
    expect(isPurchaseLotTab("Notas")).toBe(false);
  });
});

describe("canonicalPurchaseLot", () => {
  it("normaliza 1/27 a 01/27", () => {
    expect(canonicalPurchaseLot("1/27")).toBe("01/27");
    expect(canonicalPurchaseLot("Copia de 1/2027")).toBe("Copia de 01/27");
  });
});

describe("mergePurchaseTabs", () => {
  it("suma pestañas nuevas de fecha y descarta las que no son mes/año", () => {
    expect(mergePurchaseTabs(["01/27", "Proveedores", "02/27"], ["07/26"])).toEqual([
      "07/26",
      "01/27",
      "02/27",
    ]);
  });
});

describe("dateTabCandidates", () => {
  it("incluye el mes siguiente al año en curso", () => {
    const names = dateTabCandidates(new Date(2026, 8, 24));
    expect(names).toContain("01/27");
    expect(names).toContain("09/26");
    expect(names).toContain("Copia de 09/26");
  });
});

describe("preferPurchaseLot", () => {
  it("no deja que la copia pise el mes canónico", () => {
    expect(preferPurchaseLot("09/26", "Copia de 09/26")).toBe("09/26");
    expect(preferPurchaseLot("08/26", "09/26")).toBe("09/26");
  });
});
