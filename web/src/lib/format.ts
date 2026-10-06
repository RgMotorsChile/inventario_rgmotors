export const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const chile = { timeZone: "America/Santiago" } as const;

export function plateNorm(value: string | null | undefined) {
  return (value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function when(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
    ...chile,
  });
}

export function whenDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...chile,
  }).format(new Date(value));
}

export function whenTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...chile,
  }).format(new Date(value));
}

export const CORRECT_PLATE_HOURS = 24;

export function canCorrectDeliveryPlate(createdAt: string | null | undefined, now = Date.now()) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return now - created <= CORRECT_PLATE_HOURS * 60 * 60 * 1000;
}

export function itemStatus(stock: number, min: number) {
  if (stock <= 0) return { label: "Sin stock", tone: "bad" as const };
  if (stock <= min) return { label: "Stock bajo", tone: "warn" as const };
  return { label: "En nivel", tone: "ok" as const };
}

/**
 * Excel no guarda zona horaria: devolvemos una fecha cuyos campos UTC son la hora de Chile,
 * para que la planilla muestre la misma hora que el panel.
 */
export function chileWallClock(value: string | Date): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      ...chile,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .map((p) => [p.type, p.value]),
  );
  return new Date(
    Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second),
  );
}
