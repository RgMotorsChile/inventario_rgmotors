export type InstallKind = "standalone" | "ios" | "android" | "desktop";

export const INSTALL_HINT_KEY = "rg.install.hint";

export function isStandaloneDisplay(input: {
  standalone?: boolean;
  displayModeStandalone?: boolean;
}): boolean {
  return input.standalone === true || input.displayModeStandalone === true;
}

export function isInAppBrowser(ua: string) {
  return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|WhatsApp|CriOS|FxiOS/i.test(ua);
}

export function detectInstallKind(input: {
  ua: string;
  standalone?: boolean;
  displayModeStandalone?: boolean;
  macTouch?: boolean;
}): InstallKind {
  if (isStandaloneDisplay(input)) return "standalone";
  const ua = input.ua;
  const ios = /iPhone|iPad|iPod/i.test(ua) || Boolean(input.macTouch);
  if (ios) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isPublicInstallAsset(path: string) {
  return (
    path === "/manifest.webmanifest" ||
    path === "/sw.js" ||
    path === "/apple-touch-icon.png" ||
    path === "/favicon.png" ||
    path.startsWith("/icons/")
  );
}
