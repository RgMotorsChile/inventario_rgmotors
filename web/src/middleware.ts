import { type NextRequest } from "next/server";
import { updateInsforgeSession } from "@/lib/insforge/middleware";

export async function middleware(request: NextRequest) {
  return updateInsforgeSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|sw.js|manifest.webmanifest|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
