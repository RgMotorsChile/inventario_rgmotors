/**
 * Lectura del stock patio: RG MOTORS y UNIDADES CHILE completas
 * (patio, preparación, taller y Don Rudy), más Salgado y PREPARACION.
 * Las compras de Santiago van en Compras.
 */
import ExcelJS from "exceljs";

const SHEET_ID =
  process.env.RG_MOTORS_SHEET_ID?.trim() ||
  process.env.GOOGLE_SHEET_ID?.trim() ||
  "1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc";

type SheetKind = "standard" | "salgado";

type SheetTab = {
  name: string;
  gid?: string;
  kind: SheetKind;
  defaultStatus: string;
};

const PATIO_TABS: SheetTab[] = [
  { name: "RG MOTORS", kind: "standard", defaultStatus: "Disponible" },
  { name: "UNIDADES CHILE", kind: "standard", defaultStatus: "Disponible" },
  { name: "SALGADO AUTOMOTRIZ", kind: "salgado", defaultStatus: "En taller" },
  { name: "PREPARACION", kind: "standard", defaultStatus: "En preparación" },
];

export type SheetVehicleRow = {
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string;
  status: string;
  supplier: string;
  location: string;
  source: string;
  purchase_lot: string;
  note: string;
};

export type PatioSheetFetch = {
  vehicles: SheetVehicleRow[];
  sources: Record<string, number>;
};

const SECTION_STATUS: Record<string, string> = {
  preparacion: "En preparación",
  salgado: "En taller",
  taller: "En taller",
  donrudy: "En poder de Don Rudy",
  campodonrudy: "En poder de Don Rudy",
  consignados: "Consignado",
  camion: "En tránsito",
  camion1609: "En tránsito",
};

const STATUS_RANK: Record<string, number> = {
  Disponible: 0,
  Consignado: 1,
  Reservada: 2,
  "En poder de Don Rudy": 3,
  "En taller": 4,
  "En tránsito": 5,
  "En preparación": 6,
  Vendido: 7,
};

const FALLBACK_BRAND = "Por confirmar";
const FALLBACK_MODEL = "Por confirmar";

/** @deprecated Usar fetchPatioSheetVehicles. Queda como alias para no romper callers. */
export async function fetchRgMotorsSheetVehicles(): Promise<SheetVehicleRow[]> {
  const { vehicles } = await fetchPatioSheetVehicles();
  return vehicles;
}

export async function fetchPatioSheetVehicles(): Promise<PatioSheetFetch> {
  const workbook = await readPatioWorkbook();
  const settled = await Promise.allSettled(
    PATIO_TABS.map((tab) => loadPatioTab(tab, workbook)),
  );

  const sources: Record<string, number> = {};
  const merged = new Map<string, SheetVehicleRow>();
  const errors: string[] = [];

  for (const result of settled) {
    if (result.status === "rejected") {
      errors.push(result.reason instanceof Error ? result.reason.message : "Hoja ilegible");
      continue;
    }
    sources[result.value.name] = result.value.rows.length;
    for (const row of result.value.rows) {
      const key = plateNorm(row.plate);
      const prev = merged.get(key);
      merged.set(key, prev ? mergeSheetVehicleRows(prev, row) : row);
    }
  }

  if (merged.size === 0) {
    throw new Error(errors[0] || "Las hojas de stock no trajeron patentes");
  }

  return { vehicles: [...merged.values()], sources };
}

async function loadPatioTab(
  tab: SheetTab,
  workbook: Map<string, string[][]> | null,
): Promise<{ name: string; rows: SheetVehicleRow[] }> {
  const batches: SheetVehicleRow[][] = [];
  const matrix = workbook?.get(normalizeSheetName(tab.name));
  if (matrix) {
    try {
      batches.push(
        tab.kind === "salgado"
          ? parseSalgadoMatrix(matrix, tab.defaultStatus, tab.name)
          : parseStockMatrix(matrix, tab.defaultStatus, tab.name),
      );
    } catch {
      // El xlsx a veces viene con celdas huecas; el CSV cubre la hoja.
    }
  }

  try {
    const csv = await fetchSheetCsv(tab);
    batches.push(
      tab.kind === "salgado"
        ? parseSalgadoCsv(csv, tab.defaultStatus)
        : parseStockCsv(csv, tab.defaultStatus, tab.name),
    );
  } catch (err) {
    if (batches.length === 0) throw err;
  }

  const found = new Map<string, SheetVehicleRow>();
  for (const batch of batches) {
    for (const row of batch) {
      const key = plateNorm(row.plate);
      const prev = found.get(key);
      found.set(key, prev ? mergeSheetVehicleRows(prev, row) : row);
    }
  }
  if (found.size === 0) {
    throw new Error(`La hoja ${tab.name} no trajo patentes`);
  }
  return { name: tab.name, rows: [...found.values()] };
}

async function fetchSheetCsv(tab: SheetTab): Promise<string> {
  const urls: string[] = [];
  if (tab.gid) {
    urls.push(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${tab.gid}`);
    urls.push(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${tab.gid}`);
  }
  for (const name of [tab.name, `${tab.name} `, tab.name.trim()]) {
    urls.push(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`,
    );
  }

  let lastError = `No se pudo leer la hoja ${tab.name}`;
  for (const url of urls) {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    if (!res.ok || text.trim().length < 20) {
      lastError = `Google Sheets ${tab.name} ${res.status}`;
      continue;
    }
    if (/accounts\.google|sign\s*in|Inicia sesi/i.test(text.slice(0, 400))) {
      lastError = `La hoja ${tab.name} no es pública`;
      continue;
    }
    return text;
  }
  throw new Error(lastError);
}

function normalizeSheetName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function readPatioWorkbook(): Promise<Map<string, string[][]> | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!res.ok || bytes.byteLength < 80) return null;
    const head = new TextDecoder().decode(bytes.subarray(0, 200));
    if (/accounts\.google|sign\s*in|Inicia sesi|<!DOCTYPE/i.test(head)) return null;
    const book = new ExcelJS.Workbook();
    const xlsx = book.xlsx as unknown as { load: (data: Uint8Array) => Promise<unknown> };
    await xlsx.load(bytes);
    const sheets = new Map<string, string[][]>();
    for (const sheet of book.worksheets) {
      sheets.set(normalizeSheetName(sheet.name), worksheetMatrix(sheet));
    }
    return sheets.size > 0 ? sheets : null;
  } catch {
    return null;
  }
}

function worksheetMatrix(sheet: ExcelJS.Worksheet): string[][] {
  const lastCol = Math.max(sheet.columnCount || 0, sheet.actualColumnCount || 0, 42);
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    let any = false;
    for (let col = 1; col <= lastCol; col += 1) {
      const cell = row.getCell(col);
      const text = String(cell.text || excelCellText(cell.value)).trim();
      cells.push(text);
      if (text) any = true;
    }
    if (any) rows.push(cells);
  });
  return rows;
}

function denseRow(row: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  for (let i = 0; i < row.length; i += 1) {
    out.push(String(row[i] ?? ""));
  }
  return out;
}

function excelCellText(value: ExcelJS.CellValue): string {
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
    if ("result" in value && value.result != null) return excelCellText(value.result as ExcelJS.CellValue);
  }
  return String(value);
}

export function parseStockCsv(csv: string, defaultStatus = "", source = ""): SheetVehicleRow[] {
  return parseStockMatrix(parseCsv(csv), defaultStatus, source);
}

export function parseStockMatrix(
  rows: string[][],
  defaultStatus = "",
  source = "",
): SheetVehicleRow[] {
  const found = new Map<string, SheetVehicleRow>();
  const headerIndex = rows.findIndex((row) =>
    denseRow(row).some((cell) => normalizeHeader(cell).includes("patente") || normalizeHeader(cell) === "placa"),
  );

  if (headerIndex >= 0) {
    const headers = denseRow(rows[headerIndex]).map(headerKey);
    const plateCols = headers
      .map((key, index) => (key === "plate" ? index : -1))
      .filter((index) => index >= 0);
    let section = "";

    for (const raw of rows.slice(headerIndex + 1)) {
      const row = denseRow(raw);
      const sectionHint = row
        .map((cell) => normalizeHeader(cell))
        .find((cell) => Boolean(cell) && (SECTION_STATUS[cell] || Object.keys(SECTION_STATUS).some((key) => cell.includes(key))));
      const mappedGroups = plateCols.length > 0 ? plateCols.map((col) => mapRowFromPlateCol(row, headers, col)) : [mapRow(row, headers)];
      const hasPlate = mappedGroups.some((mapped) => looksLikePlate(mapped.plate));
      if (sectionHint && !hasPlate) {
        const key = Object.keys(SECTION_STATUS).find((name) => sectionHint === name || sectionHint.includes(name));
        if (key) section = SECTION_STATUS[key];
        continue;
      }
      const sold = closedRowStatus(row);
      for (const mapped of mappedGroups) {
        const parsed = toVehicleRow(
          { ...mapped, source },
          sold || section || defaultStatus,
        );
        if (!parsed) continue;
        if (sold) parsed.status = sold;
        found.set(plateNorm(parsed.plate), parsed);
      }
    }
  }

  collectLoosePlates(rows, found, defaultStatus, source);
  return [...found.values()];
}

function collectLoosePlates(
  rows: string[][],
  found: Map<string, SheetVehicleRow>,
  defaultStatus: string,
  source: string,
) {
  let section = "";
  for (const raw of rows) {
    const row = denseRow(raw);
    const platesHere = row.flatMap((cell) => cellPlates(cell));
    const sectionHint = row
      .map((cell) => normalizeHeader(cell))
      .find((cell) => Boolean(cell) && (SECTION_STATUS[cell] || Object.keys(SECTION_STATUS).some((key) => cell.includes(key))));
    if (sectionHint && platesHere.length === 0) {
      const key = Object.keys(SECTION_STATUS).find((name) => sectionHint === name || sectionHint.includes(name));
      if (key) section = SECTION_STATUS[key];
      continue;
    }
    const sold = closedRowStatus(row);
    row.forEach((cell, index) => {
      for (const plate of cellPlates(cell)) {
        if (found.has(plateNorm(plate))) continue;
        const parsed = toVehicleRow(
          {
            plate,
            brand: row[index + 1] ?? "",
            model: row[index + 2] ?? "",
            year: row[index + 3] ?? "",
            color: row[index + 4] ?? "",
            price: "",
            location: "",
            source,
          },
          sold || section || defaultStatus,
        );
        if (!parsed) continue;
        if (sold) parsed.status = sold;
        found.set(plateNorm(parsed.plate), parsed);
      }
    });
  }
}

/** Celdas que son solo una patente, aunque falte marca o modelo. */
export function cellPlates(raw: string): string[] {
  const compact = plateNorm(raw);
  if (compact.length >= 5 && compact.length <= 7 && /^[A-Z]{2,4}\d{2,4}$/.test(compact)) {
    return [compact];
  }
  return [];
}

export function parseSalgadoCsv(csv: string, defaultStatus = "En taller"): SheetVehicleRow[] {
  return parseSalgadoMatrix(parseCsv(csv), defaultStatus, "Salgado");
}

export function parseSalgadoMatrix(
  rows: string[][],
  defaultStatus = "En taller",
  source = "Salgado",
): SheetVehicleRow[] {
  if (rows.length < 2) return [];

  const found = new Map<string, SheetVehicleRow>();
  const headerIndex = rows.findIndex((row) =>
    denseRow(row).some((cell) => normalizeHeader(cell).includes("patente")),
  );
  const start = headerIndex >= 0 ? headerIndex + 1 : 1;
  for (const raw of rows.slice(start)) {
    const row = denseRow(raw);
    const sold = closedRowStatus(row);
    const plate = extractPlate(row[3] ?? "") || extractPlateFromRow(row);
    const brand = (row[4] ?? "").trim();
    const model = (row[5] ?? "").trim();
    const color = (row[6] ?? "").trim();
    const year = (row[7] ?? "").trim();
    const price = (row[8] ?? "").trim();
    const location = (row[12] ?? "").trim();
    const parsed = toVehicleRow(
      {
        plate,
        brand,
        model,
        year,
        color,
        price,
        location,
        supplier: (row[1] ?? "").trim(),
        note: "",
        source,
      },
      sold || defaultStatus,
    );
    if (!parsed) continue;
    if (sold) parsed.status = sold;
    found.set(plateNorm(parsed.plate), parsed);
  }
  return [...found.values()];
}

export function mergeSheetVehicleRows(
  prev: SheetVehicleRow,
  next: SheetVehicleRow,
): SheetVehicleRow {
  const prevKnown = isKnownLabel(prev.brand, prev.model);
  const nextKnown = isKnownLabel(next.brand, next.model);
  const takeNextIdentity = nextKnown || !prevKnown;
  return {
    plate: next.plate || prev.plate,
    brand: takeNextIdentity ? next.brand : prev.brand,
    model: takeNextIdentity ? next.model : prev.model,
    year: next.year ?? prev.year,
    color:
      next.color && next.color !== "Sin color" ? next.color : prev.color || next.color,
    status: preferStatus(prev.status, next.status),
    supplier: next.supplier || prev.supplier,
    location: next.location || prev.location,
    source: prev.source || next.source,
    purchase_lot: next.purchase_lot || prev.purchase_lot,
    note: next.note || prev.note,
  };
}

function isKnownLabel(brand: string, model: string): boolean {
  return Boolean(brand && brand !== FALLBACK_BRAND && model && model !== FALLBACK_MODEL);
}

function preferStatus(a: string, b: string): string {
  return (STATUS_RANK[a] ?? 0) >= (STATUS_RANK[b] ?? 0) ? a : b;
}

function toVehicleRow(
  mapped: {
    plate: string;
    brand: string;
    model: string;
    year: string;
    color: string;
    price: string;
    location: string;
    supplier?: string;
    note?: string;
    source?: string;
  },
  fallbackStatus: string,
): SheetVehicleRow | null {
  const plate = extractPlate(mapped.plate);
  if (!looksLikePlate(plate)) return null;
  let location = normalizeLocation(mapped.location, mapped.source);
  if (!location) location = locationFromSection(fallbackStatus, mapped.source ?? "");
  return {
    plate: formatPlate(plate),
    brand: mapped.brand.trim() ? titleBrand(mapped.brand) : FALLBACK_BRAND,
    model: mapped.model.trim() ? mapped.model.trim().toUpperCase() : FALLBACK_MODEL,
    year: parseYear(mapped.year),
    color: normalizeColor(mapped.color),
    status: resolveStatus(mapped.price, location, fallbackStatus),
    supplier: (mapped.supplier ?? "").trim(),
    location,
    source: (mapped.source ?? "").trim(),
    purchase_lot: "",
    note: (mapped.note ?? "").trim(),
  };
}

function headerKey(cell: string): string | null {
  const n = normalizeHeader(cell);
  if (n.includes("patente") || n === "placa") return "plate";
  if (n === "marca") return "brand";
  if (n === "modelo") return "model";
  if (n === "color") return "color";
  if (n === "ano" || n === "ao" || n === "anio" || n === "year") return "year";
  if (n.includes("preciolista") || n === "precio") return "price";
  if (n.includes("ubicacion")) return "location";
  if (n.includes("proveedor") || n.includes("provedor")) return "supplier";
  if (n.startsWith("obs") || n.includes("observacion")) return "note";
  return null;
}

function mapRow(row: string[], headers: Array<string | null>) {
  return mapRowFromPlateCol(row, headers, headers.findIndex((key) => key === "plate"));
}

function mapRowFromPlateCol(row: string[], headers: Array<string | null>, plateCol: number) {
  const mapped: Record<string, string> = {};
  const start = plateCol > 0 ? plateCol : 0;
  const nextPlate = headers.findIndex((key, index) => key === "plate" && index > start);
  const end = nextPlate > start ? nextPlate : headers.length;
  headers.forEach((key, index) => {
    if (!key || index < start || index >= end || mapped[key]) return;
    mapped[key] = String(row[index] ?? "").trim();
  });
  return {
    plate: mapped.plate ?? "",
    brand: mapped.brand ?? "",
    model: mapped.model ?? "",
    year: mapped.year ?? "",
    color: mapped.color ?? "",
    price: mapped.price ?? "",
    location: mapped.location ?? "",
    supplier: mapped.supplier ?? "",
    note: mapped.note ?? "",
  };
}

export function normalizeLocation(raw: string, source = ""): string {
  const n = normalizeHeader(raw);
  if (!n) return "";
  if (n.includes("cardonal")) return "Cardonal";
  if (n.includes("unichile") || n.includes("unidadesdechile") || n === "unidades") {
    return "Unidades Chile";
  }
  if (n.includes("taller") || n.includes("salgado")) return "Taller Salgado";
  if (n === "patio") return /salgado/i.test(source) ? "Taller Salgado" : "Patio";
  if (n.includes("puertomontt")) return "Puerto Montt";
  if (n.includes("santiago") || n === "stgo") return "Santiago";
  if (n.includes("provedor") || n.includes("proveedor")) return "En proveedor";
  if (n.includes("transito") || n.includes("camion")) return "En tránsito";
  if (n.includes("donrudy")) return "Don Rudy";
  if (n.includes("preparacion")) return "Preparación";
  return raw.trim();
}

function locationFromSection(section: string, source: string): string {
  if (section === "En preparación") return "Preparación";
  if (section === "En poder de Don Rudy") return "Don Rudy";
  if (section === "En taller") return "Taller Salgado";
  if (section === "Consignado") return "Patio";
  if (/unidades chile/i.test(source)) return "Unidades Chile";
  if (/rg motors/i.test(source)) return "Patio";
  return "";
}

function resolveStatus(price: string, location: string, section: string): string {
  if (section === "Vendido") return "Vendido";
  const p = price.toUpperCase();
  const loc = location.toUpperCase();
  if (p.includes("RESERVADA")) return "Reservada";
  if (p.includes("PREPARACION") || loc.includes("PREPARACION")) return "En preparación";
  if (p.includes("CAMION") || loc.includes("CAMION")) return "En tránsito";
  if (loc.includes("EN PODER DE DON RUDY") || loc.includes("DON RUDY")) {
    return "En poder de Don Rudy";
  }
  if (loc.includes("TALLER") || loc.includes("SALGADO")) {
    return "En taller";
  }
  if (loc.includes("CONSIGNAD")) return "Consignado";
  if (section) return section;
  return "Disponible";
}

export function extractPlate(raw: string): string {
  const compact = plateNorm(raw);
  const match = compact.match(/[A-Z]{2,4}\d{2,4}/);
  return match?.[0] ?? "";
}

function extractPlateFromRow(row: string[]): string {
  for (const cell of row) {
    const plate = extractPlate(cell);
    if (looksLikePlate(plate)) return plate;
  }
  return "";
}

function looksLikePlate(raw: string): boolean {
  return /^[A-Z]{2,4}\d{2,4}$/.test(extractPlate(raw));
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
  if (n.startsWith("celest")) return "Celeste";
  if (!raw.trim()) return "Sin color";
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).toLowerCase();
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function closedRowStatus(row: string[]): string | null {
  const text = row.join(" ").toUpperCase().replace(/NO\s+VENDIDO/g, " ");
  if (/\bENTREGADO\b/.test(text) || /\bVENDIDO\b/.test(text)) return "Vendido";
  return null;
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
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
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
