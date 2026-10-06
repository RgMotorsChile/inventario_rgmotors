import { LiveKpis, LiveStockTable } from "@/components/live-inventory";
import { PageHead } from "@/components/page-head";
import { RpcForm } from "@/components/rpc-form";
import { requireManagement } from "@/lib/auth";
import type { AssignmentRow, ItemRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const { db } = await requireManagement();
  const [{ data: items }, { data: assignments }, { data: categories }, { data: workers }, { data: vehicles }] =
    await Promise.all([
      db.from("items").select("*").order("name"),
      db.from("assignments").select("*").eq("status", "abierta"),
      db.from("categories").select("*").order("name"),
      db.from("workers").select("id,full_name,active").eq("active", true).order("full_name"),
      db.from("vehicles").select("plate").order("plate"),
    ]);
  const stock = (items ?? []) as ItemRow[];
  const cats = [...new Set([...(categories ?? []).map((c) => c.name), ...stock.map((i) => i.category)])].sort();

  return (
    <>
      <PageHead
        eyebrow="Bodega"
        title="Inventario"
        lead="Lo que hay en bodega. Bodega suma desde el celular; aquí se crean familias, se ajusta y se ve el valor."
      />
      <LiveKpis initialItems={stock} initialAssignments={(assignments ?? []) as AssignmentRow[]} />
      <LiveStockTable initialItems={stock} categories={cats} />
      <div className="card">
        <h2>Familia</h2>
        <RpcForm
          fn="upsert_category"
          submit="Crear categoría"
          fields={[{ name: "p_name", label: "Nombre", required: true, placeholder: "Barras" }]}
        />
        <p className="muted">
          {(categories ?? []).map((c) => c.name).join(" · ") || "Aún no hay categorías."}
        </p>
      </div>
      <div className="card">
        <h2>Elemento</h2>
        <RpcForm
          fn="upsert_item"
          submit="Guardar elemento"
          fields={[
            { name: "p_sku", label: "Código interno", required: true, placeholder: "BAR-HILUX", uppercase: true },
            { name: "p_name", label: "Nombre", required: true },
            { name: "p_category", label: "Categoría", required: true },
            { name: "p_brand", label: "Marca", required: true },
            { name: "p_min_stock", label: "Mínimo", type: "number", required: true, min: 0, step: 1 },
            { name: "p_location", label: "Ubicación", required: true },
            { name: "p_unit_cost", label: "Costo", type: "number", required: true, min: 0, step: "any" },
            { name: "p_compatible", label: "Compatible" },
          ]}
        />
      </div>
      <div className="card">
        <h2>Salida a vehículo</h2>
        <p className="muted">
          Para repuestos que se instalan en una patente. Queda en Historial con quién lo instaló y quién lo registró.
        </p>
        <RpcForm
          fn="deliver_item"
          submit="Registrar salida"
          extra={{ p_outcome: "instalado" }}
          fields={[
            {
              name: "p_sku",
              label: "Repuesto",
              required: true,
              options: [
                { value: "", label: "Elige…" },
                ...stock
                  .filter((i) => Number(i.stock) > 0)
                  .map((i) => ({ value: i.sku, label: `${i.name} · ${i.stock} en bodega` })),
              ],
            },
            { name: "p_qty", label: "Cantidad", type: "number", required: true, min: 1, step: 1 },
            {
              name: "p_plate",
              label: "Patente",
              required: true,
              uppercase: true,
              placeholder: "ABCD 12",
              maxLength: 12,
              suggestions: (vehicles ?? []).map((v) => String(v.plate)),
            },
            {
              name: "p_worker_id",
              label: "Instaló",
              required: true,
              options: [
                { value: "", label: "Elige…" },
                ...(workers ?? []).map((w) => ({ value: String(w.id), label: String(w.full_name) })),
              ],
            },
            { name: "p_note", label: "Nota (opcional)" },
          ]}
        />
      </div>
      <div className="card">
        <h2>Ajuste</h2>
        <RpcForm
          fn="adjust_stock"
          submit="Aplicar ajuste"
          fields={[
            { name: "p_sku", label: "Código interno", required: true, uppercase: true },
            { name: "p_qty", label: "Cantidad (+ o −)", type: "number", required: true, step: 1 },
            { name: "p_note", label: "Motivo", required: true },
          ]}
        />
      </div>
    </>
  );
}
