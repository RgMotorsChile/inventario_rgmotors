import { updateSession } from "@insforge/sdk/ssr/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/token";

export async function updateInsforgeSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const configured =
    (process.env.NEXT_PUBLIC_INSFORGE_URL ?? "").startsWith("https://") &&
    (process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? "").length > 10;

  const path = request.nextUrl.pathname;
  const isPublic = isPublicPath(path);

  if (configured) {
    try {
      await updateSession({
        requestCookies: request.cookies,
        responseCookies: response.cookies,
      });
    } catch {
      /* sin proyecto InsForge todavía: se muestra el login */
    }
  }

  const token = request.cookies.get("insforge_access_token")?.value;
  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
