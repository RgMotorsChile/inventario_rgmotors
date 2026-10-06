export function isSantiagoSource(source?: string | null) {
  return /^santiago/i.test((source ?? "").trim());
}

/** Hojas de stock patio: RG MOTORS, Unidades Chile, Salgado y Preparación. */
export function isPatioSheetSource(source?: string | null) {
  return /rg motors|unidades chile|salgado|preparacion/i.test((source ?? "").trim());
}

export function isComprasVehicle(vehicle: {
  source?: string | null;
  purchase_lot?: string | null;
}) {
  if (isPatioSheetSource(vehicle.source)) return false;
  return Boolean(vehicle.purchase_lot?.trim()) || isSantiagoSource(vehicle.source);
}

const PATIO_HINT =
  /cardonal|patio|taller|salgado|don rudy|unidades chile|uni chile|preparac|consignad/i;

export function isPatioVehicle(vehicle: {
  source?: string | null;
  location?: string | null;
  status?: string | null;
  purchase_lot?: string | null;
}) {
  if (isPatioSheetSource(vehicle.source)) return true;
  const hint = `${vehicle.location ?? ""} ${vehicle.status ?? ""}`;
  if (PATIO_HINT.test(hint)) return true;
  if (isSantiagoSource(vehicle.source)) return false;
  return true;
}
