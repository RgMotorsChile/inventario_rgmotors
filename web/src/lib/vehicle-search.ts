import { plateNorm } from "./format";

export type SearchableVehicle = {
  plate: string;
  brand: string;
  model: string;
  status: string;
  supplier?: string | null;
  location?: string | null;
  note?: string | null;
  year?: number | null;
  color?: string | null;
};

export function filterVehicles<T extends SearchableVehicle>(
  vehicles: T[],
  query: string,
  supplier = "",
  location = "",
): T[] {
  const q = query.trim().toLowerCase();
  const qPlate = plateNorm(query);
  const sup = supplier.trim().toLowerCase();
  const loc = location.trim().toLowerCase();
  return vehicles.filter((v) => {
    if (sup && !(v.supplier ?? "").toLowerCase().includes(sup)) return false;
    if (loc && !(v.location ?? "").toLowerCase().includes(loc)) return false;
    if (!q) return true;
    if (qPlate && plateNorm(v.plate).includes(qPlate)) return true;
    const hay = [v.plate, v.brand, v.model, v.status, v.supplier, v.location, v.note]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}
