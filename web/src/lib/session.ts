export const REMEMBER_COOKIE = "rg_remember";
export const REMEMBER_DAYS = 30;
export const REMEMBER_MAX_AGE = REMEMBER_DAYS * 24 * 60 * 60;

const persist = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: REMEMBER_MAX_AGE,
};

export function wantsRemember(value: string | undefined | null) {
  return value !== "0";
}

export function authCookieOptions(remember: boolean) {
  if (remember) {
    return {
      accessToken: { ...persist },
      refreshToken: { ...persist },
    };
  }
  return {
    accessToken: { path: "/", sameSite: "lax" as const, maxAge: undefined, expires: undefined },
    refreshToken: { path: "/", sameSite: "lax" as const, maxAge: undefined, expires: undefined },
  };
}

export function rememberCookieOptions(remember: boolean) {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? REMEMBER_MAX_AGE : 0,
  };
}

type CookieOpts = {
  [key: string]: unknown;
  maxAge?: number;
  expires?: Date | number;
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  httpOnly?: boolean;
  secure?: boolean;
};

/**
 * Ajusta las cookies de Supabase Auth según "Mantener la sesión iniciada":
 * - con recordar: 30 días (no los 400 por defecto de @supabase/ssr);
 * - sin recordar: cookie de sesión (se borra al cerrar el navegador);
 * - siempre httpOnly (el panel no usa el cliente Supabase del navegador) y
 *   secure en producción.
 * Las cookies de borrado (valor vacío o maxAge 0) se respetan tal cual.
 */
export function authCookieWriteOptions(
  value: string,
  options: CookieOpts | undefined,
  rememberCookie: string | undefined | null,
  production = process.env.NODE_ENV === "production",
): CookieOpts {
  const base: CookieOpts = { ...(options ?? {}), path: "/", sameSite: "lax", httpOnly: true };
  if (production) base.secure = true;
  const deleting = value === "" || options?.maxAge === 0;
  if (deleting) return base;
  if (wantsRemember(rememberCookie)) {
    base.maxAge = REMEMBER_MAX_AGE;
    delete base.expires;
  } else {
    delete base.maxAge;
    delete base.expires;
  }
  return base;
}
