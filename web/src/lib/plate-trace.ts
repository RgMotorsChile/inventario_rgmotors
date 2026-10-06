import { plateNorm } from "@/lib/format";

/** Movimientos que sacan stock hacia una unidad (instalado/entregado o dañado/extraviado). */
export const PLATE_EXIT_TYPES = ["uso", "dano"] as const;

export type PlateMovement = {
  id: string;
  type: string;
  item_sku: string;
  qty: number;
  plate: string | null;
  worker_name: string | null;
  outcome: string | null;
  note: string | null;
  user_name: string | null;
  created_at: string;
};

export type PlateSummary = { plate: string; key: string; count: number; qty: number; last: string };

/** Lee `?patente=` de la URL: primer valor, sin espacios extra, en mayúsculas y acotado. */
export function parsePlateParam(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim().toUpperCase().replace(/\s+/g, " ").slice(0, 12);
}

/** Filtra por patente sin importar espacios, guiones ni mayúsculas ("qazz-99" = "QAZZ 99"). */
export function movementsForPlate<T extends { plate?: string | null }>(rows: T[], plate: string): T[] {
  const key = plateNorm(plate);
  if (!key) return [];
  return rows.filter((row) => plateNorm(row.plate) === key);
}

/** Patentes que recibieron repuestos, la más reciente primero. */
export function platesWithExits(rows: PlateMovement[]): PlateSummary[] {
  const byKey = new Map<string, PlateSummary>();
  for (const row of rows) {
    if (!PLATE_EXIT_TYPES.includes(row.type as (typeof PLATE_EXIT_TYPES)[number])) continue;
    const key = plateNorm(row.plate);
    if (!key) continue;
    const prev = byKey.get(key);
    if (prev) {
      prev.count += 1;
      prev.qty += Number(row.qty) || 0;
      if (row.created_at > prev.last) prev.last = row.created_at;
    } else {
      byKey.set(key, { plate: row.plate ?? key, key, count: 1, qty: Number(row.qty) || 0, last: row.created_at });
    }
  }
  return [...byKey.values()].sort((a, b) => b.last.localeCompare(a.last));
}

export function outcomeLabel(value: string | null | undefined) {
  switch (value) {
    case "instalado":
      return "Instalado";
    case "usado":
      return "Entregado";
    case "danado":
      return "Dañado";
    case "extraviado":
      return "Extraviado";
    default:
      return value ?? "—";
  }
}

export function movementTypeLabel(type: string, outcome: string | null) {
  if (type === "uso" || type === "dano") return outcomeLabel(outcome ?? (type === "dano" ? "danado" : "usado"));
  switch (type) {
    case "ingreso":
      return "Ingreso";
    case "ajuste":
      return "Ajuste";
    case "asignacion":
      return "Asignación";
    case "devolucion":
      return "Devolución";
    default:
      return type;
  }
}
