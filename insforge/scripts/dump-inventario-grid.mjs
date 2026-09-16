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
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n") { row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}
const rows = parseCsv(raw).slice(0, 55);
const width = Math.max(...rows.map((r) => r.length));
for (const [i, r] of rows.entries()) {
  const cells = [];
  for (let c = 0; c < Math.min(width, 18); c += 1) {
    const v = (r[c] || "").replace(/\s+/g, " ");
    if (v) cells.push(`${c}:${v}`);
  }
  if (cells.length) console.log(String(i).padStart(2, "0"), cells.join(" || "));
}
