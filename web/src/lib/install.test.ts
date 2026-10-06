import { describe, expect, it } from "vitest";
import { detectInstallKind, isInAppBrowser, isPublicInstallAsset, isStandaloneDisplay } from "./install";

describe("detectInstallKind", () => {
  it("detecta iPhone y iPad táctil", () => {
    expect(detectInstallKind({ ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" })).toBe("ios");
    expect(detectInstallKind({ ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", macTouch: true })).toBe("ios");
  });

  it("detecta Android, escritorio y app ya instalada", () => {
    expect(detectInstallKind({ ua: "Mozilla/5.0 (Linux; Android 14)" })).toBe("android");
    expect(detectInstallKind({ ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" })).toBe("desktop");
    expect(detectInstallKind({ ua: "Mozilla/5.0 (iPhone)", standalone: true })).toBe("standalone");
    expect(isStandaloneDisplay({ displayModeStandalone: true })).toBe(true);
  });

  it("marca navegadores embebidos de iPhone", () => {
    expect(isInAppBrowser("Mozilla/5.0 (iPhone) AppleWebKit Mobile WhatsApp")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (iPhone) CriOS/128.0")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (iPhone) Version/17.0 Safari")).toBe(false);
  });

  it("marca el navegador interno de WhatsApp en Android y no Chrome normal", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; SM-A546E; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36",
      ),
    ).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36 WhatsApp/2.24")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36")).toBe(false);
  });
});

describe("isPublicInstallAsset", () => {
  it("deja públicos manifest, service worker e íconos", () => {
    expect(isPublicInstallAsset("/manifest.webmanifest")).toBe(true);
    expect(isPublicInstallAsset("/sw.js")).toBe(true);
    expect(isPublicInstallAsset("/icons/icon-192.png")).toBe(true);
    expect(isPublicInstallAsset("/inventario")).toBe(false);
  });
});
