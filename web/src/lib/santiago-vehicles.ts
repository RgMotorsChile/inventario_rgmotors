import ExcelJS from "exceljs";
import santiagoSeed from "../../scripts/santiago-seed.json";
import {
  canonicalPurchaseLot,
  isPurchaseLotTab,
  lotForPlate,
  lotFromPurchaseDate,
  mergePurchaseTabs,
  preferPurchaseLot,
  SANTIAGO_TABS,
} from "./santiago-lots";
import type { SheetVehicleRow } from "./sheet-vehicles";

export const SANTIAGO_SHEET_ID =
  process.env.SANTIAGO_SHEET_ID?.trim() || "1zoDDdg25sOExbcTrLvYpDVVduY5pL9xy-yWBR2dIqn4";

export type SantiagoSheetFetch = {
  vehicles: SheetVehicleRow[];
  sources: Record<string, number>;
};

const KNOWN_BRANDS = [
  "MITSUBISHI",
  "TOYOTA",
  "CHEVROLET",
  "PEUGEOT",
  "NISSAN",
  "FORD",
  "HYUNDAI",
  "MAXUS",
  "JAC",
  "RAM",
  "FIAT",
  "CITROEN",
  "CITROËN",
  "VOLKSWAGEN",
  "SUZUKI",
  "MAZDA",
  "SSANGYONG",
  "GREAT WALL",
  "MG",
];

export async function fetchSantiagoSheetVehicles(): Promise<SantiagoSheetFetch> {
  const fromWorkbook = await readPurchaseWorkbook();
  const tabs = fromWorkbook
    ? mergePurchaseTabs([...fromWorkbook.keys()], [])
    : await resolveSantiagoTabs();

  const sources: Record<string, number> = {};
  const found = new Map<string, SheetVehicleRow>();

  if (fromWorkbook) {
    for (const name of tabs) {
      const matrix = fromWorkbook.get(name) ?? fromWorkbook.get(canonicalPurchaseLot(name));
      if (!matrix) continue;
      const rows = parseSantiagoMatrix(matrix, name);
      sources[canonicalPurchaseLot(name)] = rows.length;
      for (const row of rows) {
        const key = plateNorm(row.plate);
        const prev = found.get(key);
        found.set(key, prev ? mergeSantiago(prev, row) : row);
      }
    }
  } else {
    const settled = await Promise.allSettled(
      tabs.map(async (name) => {
        const csv = await fetchTabCsv(name);
        return { name, rows: parseSantiagoCsv(csv, name) };
      }),
    );
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      sources[canonicalPurchaseLot(result.value.name)] = result.value.rows.length;
      for (const row of result.value.rows) {
        const key = plateNorm(row.plate);
        const prev = found.get(key);
        found.set(key, prev ? mergeSantiago(prev, row) : row);
      }
    }
  }

  if (found.size === 0) {
    for (const raw of santiagoSeed as Array<SheetVehicleRow & { purchase_lot?: string }>) {
      const purchase_lot = raw.purchase_lot || lotForPlate(raw.plate, "Santiago");
      const row: SheetVehicleRow = { ...raw, purchase_lot, source: raw.source || "Santiago" };
      found.set(plateNorm(row.plate), row);
      sources[purchase_lot] = (sources[purchase_lot] ?? 0) + 1;
    }
  }
  return { vehicles: [...found.values()], sources };
}

export async function resolveSantiagoTabs(): Promise<string[]> {
  const listed = await listSantiagoTabNames();
  if (listed.length > 0) return mergePurchaseTabs(listed);
  return [...SANTIAGO_TABS];
}

export function parseSantiagoCsv(csv: string, lot = ""): SheetVehicleRow[] {
  return parseSantiagoMatrix(parseCsv(csv), lot);
}

export function parseSantiagoMatrix(rows: string[][], lot = ""): SheetVehicleRow[] {
  if (rows.length < 2) return [];
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell).includes("patente")),
  );
  if (headerIndex < 0) return [];

  const headers = rows[headerIndex].map(santiagoHeaderKey);
  const found = new Map<string, SheetVehicleRow>();
  for (const row of rows.slice(headerIndex + 1)) {
    const mapped: Record<string, string> = {};
    headers.forEach((key, index) => {
      if (!key || mapped[key]) return;
      mapped[key] = (row[index] ?? "").trim();
    });
    const parsed = toSantiagoRow(mapped, lot);
    if (!parsed) continue;
    found.set(plateNorm(parsed.plate), parsed);
  }
  return [...found.values()];
}

export function splitSantiagoModel(raw: string): { brand: string; model: string; color: string } {
  const clean = raw.trim().replace(/\s+/g, " ");
  if (!clean) return { brand: "Por confirmar", model: "Por confirmar", color: "" };
  const upper = clean.toUpperCase();
  const brand = KNOWN_BRANDS.find((name) => upper.startsWith(name)) ?? clean.split(/\s+/)[0];
  let rest = clean.slice(brand.length).trim() || clean;
  let color = "";
  const colorMatch = rest.match(/\b(BLANC[OA]|ROJ[OA]|NEGR[OA]|GRIS|AZUL|PLATEAD[OA]|CELESTE)\b/i);
  if (colorMatch) {
    color = colorMatch[1];
    rest = rest.replace(colorMatch[0], "").replace(/\s+/g, " ").trim();
  }
  return {
    brand: titleBrand(brand),
    model: (rest || brand).toUpperCase(),
    color,
  };
}

function toSantiagoRow(mapped: Record<string, string>, lot: string): SheetVehicleRow | null {
  const plate = mapped.plate ?? "";
  if (!looksLikePlate(plate)) return null;
  const split = splitSantiagoModel(mapped.model ?? "");
  const location = normalizeSantiagoLocation(mapped.location ?? "");
  const notes = [mapped.note, mapped.note2, mapped.note3].filter((part) => part?.trim()).join(" · ");
  const purchaseLot =
    (lot ? canonicalPurchaseLot(lot) : "") ||
    lotFromPurchaseDate(mapped.fecha ?? "") ||
    lotForPlate(plate, "Santiago");
  return {
    plate: formatPlate(plate),
    brand: split.brand,
    model: split.model,
    year: parseYear(mapped.year ?? ""),
    color: split.color ? normalizeColor(split.color) : "Sin color",
    status: resolveSantiagoStatus(mapped.retiro ?? "", location),
    supplier: (mapped.supplier ?? "").trim(),
    location,
    source: "Santiago",
    purchase_lot: purchaseLot,
    note: notes,
  };
}

function resolveSantiagoStatus(retiro: string, location: string): string {
  const r = retiro.toUpperCase();
  const loc = location.toUpperCase();
  if (loc.includes("TRÁNSITO") || loc.includes("TRANSITO")) return "En tránsito";
  if (loc.includes("PROVEEDOR") || r.includes("PENDIENTE")) return "En proveedor";
  if (loc.includes("SANTIAGO")) return "En Santiago";
  return "Disponible";
}

function normalizeSantiagoLocation(raw: string): string {
  const n = normalizeHeader(raw);
  if (!n) return "Santiago";
  if (n.includes("puertomontt")) return "Puerto Montt";
  if (n.includes("provedor") || n.includes("proveedor")) return "En proveedor";
  if (n.includes("transito") || n.includes("tierra")) return "En tránsito";
  if (n.includes("santiago") || n === "stgo") return "Santiago";
  return raw.trim() || "Santiago";
}

function santiagoHeaderKey(cell: string): string | null {
  const n = normalizeHeader(cell);
  if (n.includes("patente")) return "plate";
  if (n.includes("fechacompra") || n.includes("fechadecompra")) return "fecha";
  if (n === "modelo") return "model";
  if (n === "ano" || n === "ao" || n === "anio" || n === "year") return "year";
  if (n.includes("proveedor") || n.includes("provedor")) return "supplier";
  if (n.includes("ubicacion")) return "location";
  if (n.includes("retiro")) return "retiro";
  if (n.includes("obsstgo") || n === "observasiones" || n === "observaciones") return "note";
  if (n.includes("obsrudyig")) return "note2";
  if (n === "obsrudy") return "note3";
  return null;
}

function mergeSantiago(prev: SheetVehicleRow, next: SheetVehicleRow): SheetVehicleRow {
  return {
    ...prev,
    ...next,
    supplier: next.supplier || prev.supplier,
    location: next.location || prev.location,
    purchase_lot: preferPurchaseLot(prev.purchase_lot, next.purchase_lot),
    note: next.note || prev.note,
    year: next.year ?? prev.year,
  };
}

async function readPurchaseWorkbook(): Promise<Map<string, string[][]> | null> {
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SANTIAGO_SHEET_ID}/export?format=xlsx`,
    `https://docs.google.com/spreadsheets/d/${SANTIAGO_SHEET_ID}/export?format=xlsx&id=${SANTIAGO_SHEET_ID}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (!res.ok || bytes.byteLength < 80) continue;
      const head = new TextDecoder().decode(bytes.subarray(0, 200));
      if (/accounts\.google|sign\s*in|Inicia sesi|<!DOCTYPE/i.test(head)) continue;
      const book = new ExcelJS.Workbook();
      const xlsx = book.xlsx as unknown as { load: (data: Uint8Array) => Promise<unknown> };
      await xlsx.load(bytes);
      const sheets = new Map<string, string[][]>();
      for (const sheet of book.worksheets) {
        if (!isPurchaseLotTab(sheet.name)) continue;
        const matrix = worksheetMatrix(sheet);
        sheets.set(sheet.name, matrix);
        sheets.set(canonicalPurchaseLot(sheet.name), matrix);
      }
      if (sheets.size > 0) return sheets;
    } catch {
      continue;
    }
  }
  return null;
}

async function listSantiagoTabNames(): Promise<string[]> {
  const fromHtml = await listTabsFromHtml();
  if (fromHtml.length > 0) return fromHtml;
  const fromFeed = await listTabsFromFeed();
  return fromFeed;
}

async function listTabsFromFeed(): Promise<string[]> {
  const url = `https://spreadsheets.google.com/feeds/worksheets/${SANTIAGO_SHEET_ID}/public/basic?alt=json`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    if (!res.ok || /accounts\.google|sign\s*in/i.test(text.slice(0, 400))) return [];
    const payload = JSON.parse(text) as { feed?: { entry?: Array<{ title?: { $t?: string } }> } };
    return (payload.feed?.entry ?? []).map((entry) => String(entry.title?.$t ?? "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function listTabsFromHtml(): Promise<string[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SANTIAGO_SHEET_ID}/htmlview`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    if (!res.ok || /accounts\.google|sign\s*in|Inicia sesi/i.test(text.slice(0, 400))) return [];
    const names = new Set<string>();
    const titled = text.matchAll(/"title":"([^"]+)"/g);
    for (const match of titled) {
      const name = match[1].replace(/\\u002f/g, "/").replace(/\\"/g, '"');
      if (isPurchaseLotTab(name)) names.add(name);
    }
    return [...names];
  } catch {
    return [];
  }
}

function worksheetMatrix(sheet: ExcelJS.Worksheet): string[][] {
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map(cellText));
  });
  return rows;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return `${value.getDate()}/${value.getMonth() + 1}/${value.getFullYear()}`;
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("result" in value && value.result != null) return cellText(value.result as ExcelJS.CellValue);
  }
  return String(value);
}

async function fetchTabCsv(name: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SANTIAGO_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  if (!res.ok || text.trim().length < 20) {
    throw new Error(`Google Sheets Santiago ${name} ${res.status}`);
  }
  if (/accounts\.google|sign\s*in|Inicia sesi/i.test(text.slice(0, 400))) {
    throw new Error("La hoja de Santiago no es pública");
  }
  return text;
}

function looksLikePlate(raw: string): boolean {
  return /^[A-Z]{2,4}\d{2,4}$/.test(plateNorm(raw));
}

function plateNorm(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatPlate(raw: string): string {
  const compact = plateNorm(raw);
  const match = compact.match(/^([A-Z]{2,4})(\d{2,4})$/);
  return match ? `${match[1]} ${match[2]}` : raw.trim().toUpperCase();
}

function parseYear(raw: string): number | null {
  const year = Number(String(raw).replace(/[^\d]/g, "").slice(0, 4));
  return year >= 1990 && year <= 2035 ? year : null;
}

function titleBrand(raw: string): string {
  const clean = raw.trim().replace(/\s+/g, " ");
  if (/merce/i.test(clean)) return "Mercedes";
  if (/citro/i.test(clean)) return "Citroen";
  return clean
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeColor(raw: string): string {
  const n = normalizeHeader(raw);
  if (n.startsWith("roj")) return "Rojo";
  if (n.startsWith("blanc")) return "Blanco";
  if (n.startsWith("negr")) return "Negro";
  if (n.startsWith("gris")) return "Gris";
  if (n.startsWith("azul")) return "Azul";
  if (!raw.trim()) return "Sin color";
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).toLowerCase();
}

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
