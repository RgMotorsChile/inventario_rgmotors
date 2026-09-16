import { readFileSync } from "node:fs";

const raw = readFileSync(process.env.TEMP + "/rg-inventario.csv", "utf8").replace(/^\uFEFF/, "");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

const rows = parseCsv(raw);
const width = Math.max(...rows.map((r) => r.length));
for (const r of rows) while (r.length < width) r.push("");

function isHeader(value) {
  const v = value.replace(/:$/, "").trim();
  if (v.length < 3) return false;
  if (/^(color|cant|estado|izquierda|derecho|fecha|opcion|item)$/i.test(v)) return false;
  const letters = v.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  if (letters.length < 3) return false;
  return v === v.toUpperCase() || /:$/.test(value);
}

function parseQty(value) {
  if (!value) return null;
  const compact = value.replace(/\s+/g, " ").trim();
  if (/usado|suelta|armada|completa|mitad|resumen|bidon|pernos|pares|mas /i.test(compact) && !/^\d+/.test(compact)) {
    const n = compact.match(/^(\d+)/);
    return n ? Number(n[1]) : null;
  }
  const m = compact.match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

const blocks = [];
for (let c = 0; c < width; c += 1) {
  for (let r = 0; r < rows.length; r += 1) {
    const cell = rows[r][c];
    if (!isHeader(cell)) continue;
    const category = cell.replace(/:$/, "").replace(/\s+/g, " ").trim();
    let nameCol = c;
    let qtyCol = c + 1;
    for (let look = c + 1; look <= Math.min(c + 3, width - 1); look += 1) {
      if (/^cant/i.test(rows[r][look]) || /^cant /i.test(rows[r][look])) qtyCol = look;
    }
    const items = [];
    for (let rr = r + 1; rr < rows.length; rr += 1) {
      const name = rows[rr][nameCol];
      if (!name) {
        if (items.length && !rows[rr].slice(c, c + 4).some(Boolean)) break;
        continue;
      }
      if (isHeader(name)) break;
      if (/^(opcion|item entregados|llega de)/i.test(name)) break;
      const qty = parseQty(rows[rr][qtyCol]) ?? parseQty(rows[rr][c + 1]) ?? parseQty(rows[rr][c + 2]);
      if (qty == null) continue;
      items.push({ name, qty, extra: [rows[rr][c + 1], rows[rr][c + 2], rows[rr][c + 3]].filter(Boolean).join(" | ") });
    }
    if (items.length) blocks.push({ category, col: c, row: r, items });
  }
}

console.log(JSON.stringify(blocks, null, 2));
console.log("BLOCKS", blocks.length, "ITEMS", blocks.reduce((s, b) => s + b.items.length, 0));
