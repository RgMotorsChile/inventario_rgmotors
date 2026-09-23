/**
 * Lectura pública CSV pestaña RG MOTORS → filas para sync_vehicles_from_sheet.
 */
const SHEET_ID =
  process.env.RG_MOTORS_SHEET_ID?.trim() ||
  process.env.GOOGLE_SHEET_ID?.trim() ||
  "1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc";
const SHEET_GID = process.env.RG_MOTORS_SHEET_GID?.trim() || "0";
const SHEET_NAME = "RG MOTORS";

export type SheetVehicleRow = {
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string;
  status: string;
};

const SECTION_STATUS: Record<string, string> = {
  preparacion: "En preparación",
  salgado: "En taller",
  donrudy: "En poder de Don Rudy",
  consignados: "Consignado",
  camion: "En tránsito",
  camion1609: "En tránsito",
};

export async function fetchRgMotorsSheetVehicles(): Promise<SheetVehicleRow[]> {
  const csv = await fetchRgMotorsCsv();
  return parseRgMotorsCsv(csv);
}

async function fetchRgMotorsCsv(): Promise<string> {
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`,
  ];
  let lastError = "No se pudo leer la hoja RG MOTORS";
  for (const url of urls) {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    if (!res.ok || text.trim().length < 20) {
      lastError = `Google Sheets ${res.status}`;
      continue;
    }
    if (/accounts\.google|sign\s*in|Inicia sesi/i.test(text.slice(0, 400))) {
      lastError = "La hoja RG MOTORS no es pública";
      continue;
    }
    return text;
  }
  throw new Error(lastError);
}

function parseRgMotorsCsv(csv: string): SheetVehicleRow[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell).includes("patente")),
  );
  if (headerIndex < 0) return [];

  const headers = rows[headerIndex].map(headerKey);
  const found = new Map<string, SheetVehicleRow>();
  let section = "";

  for (const row of rows.slice(headerIndex + 1)) {
    const mapped = mapRow(row, headers);
    const sectionHint = row
      .map((cell) => normalizeHeader(cell))
      .find((cell) => SECTION_STATUS[cell]);
    if (sectionHint && !mapped.plate) {
      section = SECTION_STATUS[sectionHint];
      continue;
    }
    if (!mapped.plate || !mapped.brand || !mapped.model) continue;
    found.set(mapped.plate.replace(/[^A-Za-z0-9]/g, "").toUpperCase(), {
      plate: formatPlate(mapped.plate),
      brand: titleBrand(mapped.brand),
      model: mapped.model.trim().toUpperCase(),
      year: parseYear(mapped.year),
      color: normalizeColor(mapped.color),
      status: resolveStatus(mapped.price, mapped.location, section),
    });
  }
  return [...found.values()];
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
  return null;
}

function mapRow(row: string[], headers: Array<string | null>) {
  const mapped: Record<string, string> = {};
  headers.forEach((key, index) => {
    if (!key || mapped[key]) return;
    mapped[key] = (row[index] ?? "").trim();
  });
  return {
    plate: mapped.plate ?? "",
    brand: mapped.brand ?? "",
    model: mapped.model ?? "",
    year: mapped.year ?? "",
    color: mapped.color ?? "",
    price: mapped.price ?? "",
    location: mapped.location ?? "",
  };
}

function resolveStatus(price: string, location: string, section: string): string {
  const p = price.toUpperCase();
  const loc = location.toUpperCase();
  if (p.includes("RESERVADA")) return "Reservada";
  if (p.includes("PREPARACION") || loc.includes("PREPARACION")) return "En preparación";
  if (p.includes("CAMION") || loc.includes("CAMION")) return "En tránsito";
  if (loc.includes("EN PODER DE DON RUDY") || loc.includes("DON RUDY")) return "En poder de Don Rudy";
  if (loc.includes("TALLER") || loc.includes("SALGADO")) return "En taller";
  if (loc.includes("CONSIGNAD")) return "Consignado";
  if (section) return section;
  return "Disponible";
}

function formatPlate(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
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
