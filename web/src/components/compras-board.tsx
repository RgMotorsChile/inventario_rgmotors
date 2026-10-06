"use client";

import { useMemo, useState } from "react";
import { VehicleTable } from "@/components/vehicle-table";
import { sortPurchaseLots } from "@/lib/santiago-lots";
import type { VehicleDelivery, VehicleRow } from "@/lib/types";

export function ComprasBoard({
  vehicles,
  deliveries,
}: {
  vehicles: VehicleRow[];
  deliveries?: Record<string, VehicleDelivery[]>;
}) {
  const lots = useMemo(
    () => sortPurchaseLots(vehicles.map((vehicle) => vehicle.purchase_lot ?? "")),
    [vehicles],
  );
  const [lot, setLot] = useState(
    [...lots].reverse().find((name) => name !== "Ofertas pendientes") ?? lots[0] ?? "",
  );
  const visible = useMemo(
    () => (lot ? vehicles.filter((vehicle) => (vehicle.purchase_lot ?? "") === lot) : vehicles),
    [vehicles, lot],
  );

  return (
    <>
      <div className="compras-lots" role="tablist" aria-label="Mes de compra">
        <button
          type="button"
          role="tab"
          aria-selected={!lot}
          className={!lot ? "active" : undefined}
          onClick={() => setLot("")}
        >
          Todas
        </button>
        {lots.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={lot === name}
            className={lot === name ? "active" : undefined}
            onClick={() => setLot(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <VehicleTable vehicles={visible} deliveries={deliveries} showPurchaseLot />
    </>
  );
}
