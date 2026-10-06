import ExcelJS from "exceljs";
import { parseStockCsv } from "../src/lib/sheet-vehicles.ts";

const id = "1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc";

function cellText(v) {
  if (v == null) return "";
  if (typeof v === "object" && v.text) return String(v.text);
  if (typeof v === "object" && v.result != null) return String(v.result);
  return String(v).trim();
}

const res = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`, {
  redirect: "follow",
});
const book = new ExcelJS.Workbook();
await book.xlsx.load(new Uint8Array(await res.arrayBuffer()));

for (const name of ["RG MOTORS ", "UNIDADES CHILE"]) {
  const ws = book.worksheets.find((s) => s.name === name);
  console.log("\n====", JSON.stringify(name), "====");
  ws.eachRow((row, i) => {
    const vals = (Array.isArray(row.values) ? row.values.slice(1) : []).map(cellText);
    const line = vals.filter(Boolean).join(" | ");
    if (!line) return;
    if (
      i <= 8 ||
      /preparac|taller|don|consign|patio|camion|patente/i.test(line) ||
      i > 40
    ) {
      console.log(String(i).padStart(3), line.slice(0, 160));
    }
  });
}

const csvs = {
  gid0: await (await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`)).text(),
  named: await (
    await fetch(
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("RG MOTORS ")}`,
    )
  ).text(),
  uc: await (
    await fetch(
      `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("UNIDADES CHILE")}`,
    )
  ).text(),
};
console.log("\nparser gid0", parseStockCsv(csvs.gid0).length, parseStockCsv(csvs.gid0).map((r) => r.plate).join(" "));
console.log("parser named", parseStockCsv(csvs.named).length, parseStockCsv(csvs.named).map((r) => r.plate).join(" "));
console.log("parser uc", parseStockCsv(csvs.uc, "Disponible").length, parseStockCsv(csvs.uc).map((r) => r.plate).join(" "));
console.log("named csv bytes", csvs.named.length, "gid0 bytes", csvs.gid0.length);
