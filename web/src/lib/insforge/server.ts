import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  return createServerClient({
    cookies: await cookies(),
  });
}
