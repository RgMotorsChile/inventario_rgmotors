import { ComprasBoard } from "@/components/compras-board";
import { PageHead } from "@/components/page-head";
import { SyncVehiclesButton } from "@/components/sync-vehicles-button";
import { requireManagement } from "@/lib/auth";
import { plateNorm, when } from "@/lib/format";
import type { VehicleDelivery, VehicleRow } from "@/lib/types";
import { isComprasVehicle } from "@/lib/vehicle-scope";
import { syncComprasIfStale } from "@/lib/sync-stock";
import "@/components/patio.css";

export const dynamic = "force-dynamic";

type SyncStateRow = {
  synced_at: string;
  detail: { inserted?: number; updated?: number; source?: string };
};

export default async function ComprasPage() {
  const { db } = await requireManagement();
  await syncComprasIfStale(20_000).catch(() => undefined);
  const [{ data: vehicles }, { data: sync }, { data: movements }, { data: items }] = await Promise.all([
    db.from("vehicles").select("*").order("brand"),
    db.from("sync_state").select("synced_at,detail").eq("key", "rg_motors_compras").limit(1),
    db
      .from("movements")
      .select("id,type,item_sku,qty,plate,worker_name,note,outcome,user_name,created_at")
      .in("type", ["uso", "dano"])
      .order("created_at", { ascending: false })
      .limit(800),
    db.from("items").select("sku,name"),
  ]);
  const lastSync = ((sync ?? [])[0] ?? null) as SyncStateRow | null;
  const compras = ((vehicles ?? []) as VehicleRow[]).filter(isComprasVehicle);
  const nameOf = (sku: string) => items?.find((i) => i.sku === sku)?.name ?? sku;
  const deliveries: Record<string, VehicleDelivery[]> = {};
  for (const m of movements ?? []) {
    const key = plateNorm(m.plate);
    if (!key) continue;
    const row: VehicleDelivery = {
      id: String(m.id),
      created_at: String(m.created_at),
      item_name: nameOf(String(m.item_sku)),
      qty: Number(m.qty),
      worker_name: String(m.worker_name ?? "Sin responsable"),
      outcome: (m.outcome as string | null) ?? null,
      note: (m.note as string | null) ?? null,
      user_name: String(m.user_name ?? "Bodega"),
    };
    deliveries[key] = deliveries[key] ? [...deliveries[key], row] : [row];
  }

  return (
    <>
      <PageHead
        eyebrow="Compras"
        title="Santiago"
        lead="Solo la planilla de Santiago, por mes. El stock de RG MOTORS y Unidades Chile está en Patio."
      />
      <div className="patio-stack">
        <div className="card patio-board">
          {compras.length === 0 ? (
            <p className="muted">Aún no hay compras cargadas. Lee la planilla de Santiago para traer las pestañas por mes.</p>
          ) : (
            <ComprasBoard vehicles={compras} deliveries={deliveries} />
          )}
        </div>
        <div className="card patio-tools">
          <p className="muted">
            {lastSync?.synced_at
              ? `Última lectura: ${when(lastSync.synced_at)}. ${lastSync.detail?.updated ?? 0} actualizadas, ${lastSync.detail?.inserted ?? 0} nuevas.`
              : "Aún no hay una lectura de compras registrada."}
          </p>
          <SyncVehiclesButton
            endpoint="/api/compras/sync"
            idleLabel="Leer compras de Santiago"
            busyLabel="Leyendo compras…"
          />
        </div>
      </div>
    </>
  );
}
