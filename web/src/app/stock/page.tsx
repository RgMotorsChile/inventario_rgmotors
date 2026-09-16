import { LiveKpis, LiveStockTable } from "@/components/live-inventory";
import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";
import type { AssignmentRow, ItemRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { db, profile } = await requireManagement();
  const [{ data: items }, { data: assignments }, { data: categories }] = await Promise.all([
    db.from("items").select("*").order("name"),
    db.from("assignments").select("*").eq("status", "abierta"),
    db.from("categories").select("name").order("name"),
  ]);
  const cats = [...new Set([...(categories ?? []).map((c) => c.name), ...(items ?? []).map((i) => i.category)])].sort();

  return (
    <Shell path="/stock" name={profile.full_name}>
      <h1>Stock en vivo</h1>
      <p className="lead">Detalle de cada elemento: cantidad, mínimo, ubicación y valor. Se refresca solo.</p>
      <a className="btn" href="/api/export">
        Descargar Excel
      </a>
      <div style={{ marginTop: 16 }}>
        <LiveKpis initialItems={(items ?? []) as ItemRow[]} initialAssignments={(assignments ?? []) as AssignmentRow[]} />
      </div>
      <LiveStockTable initialItems={(items ?? []) as ItemRow[]} categories={cats} />
    </Shell>
  );
}
