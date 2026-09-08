export const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function when(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function itemStatus(stock: number, min: number) {
  if (stock <= 0) return { label: "Sin stock", tone: "bad" as const };
  if (stock <= min) return { label: "Stock bajo", tone: "warn" as const };
  return { label: "En nivel", tone: "ok" as const };
}
