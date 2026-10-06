import { afterEach, describe, expect, it } from "vitest";
import { createServerSupabase } from "@/lib/supabase/client";

describe("createServerSupabase", () => {
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous;
  });

  it("lanza si falta la service role key, aunque exista la anon key", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => createServerSupabase()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("lanza si la service role key está en blanco", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "   ";
    expect(() => createServerSupabase()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("crea el cliente cuando hay service role key", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
    expect(createServerSupabase()).toBeTruthy();
  });
});
