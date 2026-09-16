import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireManagement } from "@/lib/auth";

export const dynamic = "force-dynamic";

function stamp() {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, "");
}

export async function GET() {
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
  used.addRow(["Patente", "Unidad", "SKU", "Cantidad", "Cuando"]);
  for (const m of (movements ?? []).filter((row) => row.type === "uso")) {
    const v = vehicles?.find((unit) => unit.plate === m.plate);
    used.addRow([m.plate, v ? `${v.brand} ${v.model}` : "", m.item_sku, m.qty, m.created_at]);
  }

  const moves = book.addWorksheet("Movimientos");
  moves.addRow(["Fecha", "Tipo", "SKU", "Cantidad", "Patente", "Trabajador", "Nota", "Registro"]);
  for (const m of movements ?? []) {
    moves.addRow([m.created_at, m.type, m.item_sku, m.qty, m.plate, m.worker_name, m.note, m.user_name]);
  }

  const buffer = await book.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="RG_Inventario_${stamp()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
