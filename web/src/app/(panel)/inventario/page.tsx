import { LiveKpis, LiveStockTable } from "@/components/live-inventory";
import { PageHead } from "@/components/page-head";
import { RpcForm } from "@/components/rpc-form";
import { requireManagement } from "@/lib/auth";
import { clp } from "@/lib/format";
import type { AssignmentRow, ItemRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const { db } = await requireManagement();
  const [{ data: items }, { data: assignments }, { data: categories }] = await Promise.all([
    db.from("items").select("*").order("name"),
    db.from("assignments").select("*").eq("status", "abierta"),
    db.from("categories").select("*").order("name"),
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
            { name: "p_sku", label: "Código interno", required: true, placeholder: "BAR-HILUX" },
            { name: "p_name", label: "Nombre", required: true },
            { name: "p_category", label: "Categoría", required: true },
            { name: "p_brand", label: "Marca", required: true },
            { name: "p_min_stock", label: "Mínimo", type: "number", required: true },
            { name: "p_location", label: "Ubicación", required: true },
            { name: "p_unit_cost", label: "Costo", type: "number", required: true },
            { name: "p_compatible", label: "Compatible" },
          ]}
        />
      </div>
      <div className="card">
        <h2>Ajuste</h2>
        <RpcForm
          fn="adjust_stock"
          submit="Aplicar ajuste"
          fields={[
            { name: "p_sku", label: "Código interno", required: true },
            { name: "p_qty", label: "Cantidad (+ o −)", type: "number", required: true },
            { name: "p_note", label: "Motivo", required: true },
          ]}
        />
      </div>
      <div className="card">
        <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((i) => (
              <tr key={i.sku}>
                <td>{i.sku}</td>
                <td>{i.name}</td>
                <td>{i.stock}</td>
                <td>{clp.format(Number(i.unit_cost))}</td>
                <td>{i.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
