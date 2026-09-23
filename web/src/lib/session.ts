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
