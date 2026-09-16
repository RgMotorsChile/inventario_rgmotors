import { PageHead } from "@/components/page-head";
import { RpcForm } from "@/components/rpc-form";
import { SyncVehiclesButton } from "@/components/sync-vehicles-button";
import { VehicleTable } from "@/components/vehicle-table";
import { requireManagement } from "@/lib/auth";
import { plateNorm } from "@/lib/format";
import type { VehicleDelivery, VehicleRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type SyncStateRow = {
  synced_at: string;
  detail: { inserted?: number; updated?: number; retired?: number; source?: string };
};

function formatChileTime(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(iso));
}

export default async function UnidadesPage() {
  const { db } = await requireManagement();
  const [{ data: vehicles }, { data: sync }, { data: movements }, { data: items }] = await Promise.all([
    db.from("vehicles").select("*").order("brand"),
    db.from("sync_state").select("synced_at,detail").eq("key", "rg_motors_vehicles").limit(1),
    db
      .from("movements")
      .select("id,type,item_sku,qty,plate,worker_name,note,outcome,user_name,created_at")
      .in("type", ["uso", "dano"])
      .order("created_at", { ascending: false })
      .limit(800),
    db.from("items").select("sku,name"),
  ]);
  const lastSync = ((sync ?? [])[0] ?? null) as SyncStateRow | null;
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
        eyebrow="Unidades"
        title="Patio"
        lead="Expediente de cada patente. Bodega entrega sobre estas unidades. La hoja RG MOTORS se lee todos los días a las 9:00."
      />
      <div className="card">
        <p className="muted">
          {lastSync?.synced_at
            ? `Última lectura: ${formatChileTime(lastSync.synced_at)}. ${lastSync.detail?.updated ?? 0} actualizadas, ${lastSync.detail?.inserted ?? 0} nuevas.`
            : "Aún no hay una lectura automática registrada."}
        </p>
        <SyncVehiclesButton />
      </div>
      <div className="card">
        <RpcForm
          fn="upsert_vehicle"
          submit="Guardar unidad"
          fields={[
            { name: "p_plate", label: "Patente", required: true, placeholder: "THZF 75" },
            { name: "p_brand", label: "Marca", required: true },
            { name: "p_model", label: "Modelo", required: true },
            { name: "p_year", label: "Año", type: "number", required: true },
            { name: "p_color", label: "Color", required: true },
            { name: "p_status", label: "Estado", placeholder: "Disponible" },
          ]}
        />
      </div>
      <div className="card">
        <VehicleTable vehicles={(vehicles ?? []) as VehicleRow[]} deliveries={deliveries} />
      </div>
    </>
  );
}
