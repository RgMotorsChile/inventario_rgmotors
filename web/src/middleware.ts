import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isApiPath, isPublicPath } from "@/lib/token";
import { mustChangePassword } from "@/lib/login-id";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/client";

async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = isPublicPath(path);

  if (!data.user && !isPublic && !isApiPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const forceChange = mustChangePassword(data.user?.user_metadata as Record<string, unknown> | undefined);
  if (data.user && forceChange && path !== "/cambiar-clave" && !isApiPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/cambiar-clave";
    return NextResponse.redirect(url);
  }

  return response;
}

export async function middleware(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|sw.js|manifest.webmanifest|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
