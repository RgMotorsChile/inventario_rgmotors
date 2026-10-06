import { afterEach, describe, expect, it } from "vitest";
import { cronAllowed } from "@/lib/cron-auth";

describe("cron de planillas", () => {
  const previous = process.env.CRON_SECRET;
  afterEach(() => {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  });

  it("la cabecera x-vercel-cron sola no alcanza", () => {
    delete process.env.CRON_SECRET;
    expect(cronAllowed(new Request("https://x/api/cron/sync-sheets", { headers: { "x-vercel-cron": "1" } }))).toBe(false);
  });

  it("acepta solo el Bearer con CRON_SECRET", () => {
    process.env.CRON_SECRET = "s3creto";
    expect(cronAllowed(new Request("https://x", { headers: { authorization: "Bearer s3creto" } }))).toBe(true);
    expect(cronAllowed(new Request("https://x", { headers: { authorization: "Bearer otro" } }))).toBe(false);
  });
});
