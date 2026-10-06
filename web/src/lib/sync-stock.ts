import { createServerSupabase } from "@/lib/supabase/client";
import { RG_MOTORS_TENANT_ID } from "@/lib/db";
import { fetchPatioSheetVehicles } from "@/lib/sheet-vehicles";
import { fetchSantiagoSheetVehicles } from "@/lib/santiago-vehicles";

const PATIO_KEY = "rg_motors_vehicles";
const COMPRAS_KEY = "rg_motors_compras";

export async function syncPatioIfStale(maxAgeMs = 20_000) {
  if (await isFresh(PATIO_KEY, maxAgeMs)) {
    return { skipped: true as const };
  }
  return syncPatioNow();
}

export async function syncComprasIfStale(maxAgeMs = 60_000) {
  if (await isFresh(COMPRAS_KEY, maxAgeMs)) {
    return { skipped: true as const };
  }
  return syncComprasNow();
}

export async function syncPatioNow() {
  const { vehicles, sources } = await fetchPatioSheetVehicles();
  if (vehicles.length === 0) {
    throw new Error("Las hojas de stock no trajeron patentes");
  }
  const sb = createServerSupabase();
  const { data, error } = await sb.rpc("sync_vehicles_from_sheet", { p_rows: vehicles });
  if (error) throw new Error(error.message);
  return { ok: true as const, sources, read: vehicles.length, result: data };
}

export async function syncComprasNow() {
  const { vehicles, sources } = await fetchSantiagoSheetVehicles();
  if (vehicles.length === 0) {
    throw new Error("La planilla de Santiago no trajo patentes");
  }
  const sb = createServerSupabase();
  const { data, error } = await sb.rpc("sync_vehicles_from_sheet", {
    p_rows: vehicles,
    p_sync_key: COMPRAS_KEY,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const, sources, read: vehicles.length, result: data };
}

async function isFresh(key: string, maxAgeMs: number) {
  const sb = createServerSupabase();
  const { data } = await sb
    .from("sync_state")
    .select("synced_at")
    .eq("tenant_id", RG_MOTORS_TENANT_ID)
    .eq("key", key)
    .limit(1)
    .maybeSingle();
  const last = data?.synced_at ? new Date(String(data.synced_at)).getTime() : 0;
  return last > 0 && Date.now() - last < maxAgeMs;
}
