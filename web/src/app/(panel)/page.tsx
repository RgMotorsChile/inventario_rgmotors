import Link from "next/link";
import { LiveKpis, LiveMoves } from "@/components/live-inventory";
import { PageHead } from "@/components/page-head";
import { requireManagement } from "@/lib/auth";
import { itemStatus } from "@/lib/format";
import type { AssignmentRow, ItemRow, MovementRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type SyncStateRow = {
  synced_at: string;
};

function formatChileTime(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(iso));
}

export default async function AtencionPage() {
  const { db } = await requireManagement();
  const [{ data: items }, { data: assignments }, { data: movements }, { data: sync }] = await Promise.all([
    db.from("items").select("*").order("name"),
    db.from("assignments").select("*").eq("status", "abierta"),
    db.from("movements").select("*").order("created_at", { ascending: false }).limit(10),
    db.from("sync_state").select("synced_at").eq("key", "rg_motors_vehicles").limit(1),
  ]);

  const stock = (items ?? []) as ItemRow[];
  const low = stock.filter((i) => Number(i.stock) <= Number(i.min_stock));
  const lastSync = ((sync ?? [])[0] ?? null) as SyncStateRow | null;

  return (
    <>
      <PageHead
        eyebrow="Hoy"
        title="Atención"
        lead="Bodega recibe, suma y entrega con responsable y vehículo. Aquí ves qué pide cuidado ahora."
      />
      <LiveKpis initialItems={stock} initialAssignments={(assignments ?? []) as AssignmentRow[]} />
      <div className="row">
        <Link className="btn" href="/inventario" prefetch>
          Ver inventario
        </Link>
        <Link className="btn ghost" href="/unidades" prefetch>
          Ver patio
        </Link>
        <a className="btn ghost" href="/api/export">
          Extraer Excel
        </a>
      </div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          {lastSync?.synced_at
            ? `Patentes RG MOTORS leídas ${formatChileTime(lastSync.synced_at)}.`
            : "Aún no hay lectura automática de patentes."}
        </p>
      </div>
      {low.length > 0 ? (
        <div className="card">
          <h2>Stock bajo</h2>
          <table>
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Quedan</th>
                <th>Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {low.map((i) => {
                const status = itemStatus(Number(i.stock), Number(i.min_stock));
                return (
                  <tr key={i.sku}>
                    <td>
                      <strong>{i.name}</strong>
                    </td>
                    <td>{i.stock}</td>
                    <td>{i.min_stock}</td>
                    <td className={status.tone}>{status.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      <LiveMoves initial={(movements ?? []) as MovementRow[]} />
    </>
  );
}
