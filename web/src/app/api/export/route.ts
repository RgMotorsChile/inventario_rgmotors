import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth";
import { plateNorm } from "@/lib/format";
import { PLATE_EXIT_TYPES, movementsForPlate, outcomeLabel, parsePlateParam } from "@/lib/plate-trace";

export const dynamic = "force-dynamic";

function stamp() {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, "");
}

function xlsxResponse(buffer: ArrayBuffer | Buffer, filename: string) {
  return new NextResponse(Buffer.from(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Excel de una sola patente: qué repuestos se le pusieron, cuántos, quién y cuándo. */
async function plateExport(plate: string) {
  const { db } = await requireManagement();
  const [{ data: movements }, { data: items }, { data: vehicles }] = await Promise.all([
    db
      .from("movements")
      .select("type,item_sku,qty,plate,worker_name,outcome,note,user_name,created_at")
      .in("type", [...PLATE_EXIT_TYPES])
      .order("created_at", { ascending: false })
      .limit(3000),
    db.from("items").select("sku,name"),
    db.from("vehicles").select("plate,brand,model,year"),
  ]);
  const rows = movementsForPlate(movements ?? [], plate);
  const vehicle = (vehicles ?? []).find((v) => plateNorm(v.plate) === plateNorm(plate));
  const book = new ExcelJS.Workbook();
  book.creator = "RG Motors";
  const sheet = book.addWorksheet(`Repuestos ${plateNorm(plate)}`);
  sheet.addRow(["Patente", vehicle?.plate ?? plate]);
  sheet.addRow(["Unidad", vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year ?? ""}`.trim() : ""]);
  sheet.addRow([]);
  sheet.addRow(["Fecha", "Repuesto", "SKU", "Cantidad", "Resultado", "Instaló / recibió", "Registró", "Nota"]);
  for (const m of rows) {
    sheet.addRow([
      new Date(m.created_at),
      items?.find((i) => i.sku === m.item_sku)?.name ?? m.item_sku,
      m.item_sku,
      m.qty,
      outcomeLabel(m.outcome),
      m.worker_name ?? "",
      m.user_name ?? "",
      m.note ?? "",
    ]);
  }
  sheet.getColumn(1).numFmt = "dd-mm-yyyy hh:mm";
  sheet.columns.forEach((col) => (col.width = 18));
  const buffer = await book.xlsx.writeBuffer();
  return xlsxResponse(buffer, `RG_Repuestos_${plateNorm(plate)}_${stamp()}.xlsx`);
}

export async function GET(req: Request) {
  const plate = parsePlateParam(new URL(req.url).searchParams.get("patente") ?? undefined);
  if (plate) return plateExport(plate);
  const { db } = await requireManagement();
  const [{ data: items }, { data: movements }, { data: assignments }, { data: workers }, { data: vehicles }] =
    await Promise.all([
      db.from("items").select("*").order("name"),
      db.from("movements").select("*").order("created_at", { ascending: false }).limit(2000),
      db.from("assignments").select("*"),
      db.from("workers").select("*"),
      db.from("vehicles").select("*"),
    ]);

  const book = new ExcelJS.Workbook();
  book.creator = "RG Motors";

  const stock = book.addWorksheet("Stock");
  stock.addRow(["SKU", "Elemento", "Categoria", "Marca", "Stock", "Minimo", "Estado", "Ubicacion", "Costo", "Valor"]);
  for (const i of items ?? []) {
    const status = i.stock <= 0 ? "Sin stock" : i.stock <= i.min_stock ? "Stock bajo" : "En nivel";
    stock.addRow([
      i.sku,
      i.name,
      i.category,
      i.brand,
      i.stock,
      i.min_stock,
      status,
      i.location,
      Number(i.unit_cost),
      Number(i.stock) * Number(i.unit_cost),
    ]);
  }

  const alerts = book.addWorksheet("Alertas");
  alerts.addRow(["Tipo", "Detalle", "SKU", "Cantidad"]);
  for (const i of items ?? []) {
    if (i.stock > i.min_stock) continue;
    alerts.addRow([i.stock <= 0 ? "Sin stock" : "Stock bajo", i.name, i.sku, i.stock]);
  }
  const open = (assignments ?? []).filter((a) => a.status === "abierta");
  for (const a of open) {
    const days = Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000);
    if (days < 3) continue;
    const worker = workers?.find((w) => w.id === a.worker_id);
    alerts.addRow(["Asignacion vencida", worker?.full_name ?? a.worker_id, a.item_sku, a.qty]);
  }

  const metrics = book.addWorksheet("Metricas");
  const value = (items ?? []).reduce((s, i) => s + Number(i.stock) * Number(i.unit_cost), 0);
  metrics.addRow(["Metrica", "Valor"]);
  metrics.addRow(["SKUs", items?.length ?? 0]);
  metrics.addRow(["Valor bodega", value]);
  metrics.addRow(["Alertas stock", (items ?? []).filter((i) => i.stock <= i.min_stock).length]);
  metrics.addRow(["Asignaciones abiertas", open.length]);

  const people = book.addWorksheet("En poder de trabajadores");
  people.addRow(["Trabajador", "SKU", "Cantidad", "Desde"]);
  for (const a of open) {
    const worker = workers?.find((w) => w.id === a.worker_id);
    people.addRow([worker?.full_name ?? "", a.item_sku, a.qty, a.created_at]);
  }

  const used = book.addWorksheet("Usado en vehiculos");
  used.addRow(["Patente", "Unidad", "Repuesto", "SKU", "Cantidad", "Resultado", "Instaló / recibió", "Registró", "Cuando"]);
  for (const m of (movements ?? []).filter((row) => PLATE_EXIT_TYPES.includes(row.type) && row.plate)) {
    const v = vehicles?.find((unit) => plateNorm(unit.plate) === plateNorm(m.plate));
    used.addRow([
      m.plate,
      v ? `${v.brand} ${v.model}` : "",
      items?.find((i) => i.sku === m.item_sku)?.name ?? m.item_sku,
      m.item_sku,
      m.qty,
      outcomeLabel(m.outcome),
      m.worker_name ?? "",
      m.user_name ?? "",
      m.created_at,
    ]);
  }

  const moves = book.addWorksheet("Movimientos");
  moves.addRow(["Fecha", "Tipo", "SKU", "Cantidad", "Patente", "Trabajador", "Nota", "Registro"]);
  for (const m of movements ?? []) {
    moves.addRow([m.created_at, m.type, m.item_sku, m.qty, m.plate, m.worker_name, m.note, m.user_name]);
  }

  const buffer = await book.xlsx.writeBuffer();
  return xlsxResponse(buffer, `RG_Inventario_${stamp()}.xlsx`);
}
