import { describe, expect, it } from "vitest";
import { assertApkUpload, isNewerAppRelease, parseAppVersionLabel } from "./app-release";

describe("isNewerAppRelease", () => {
  it("detecta una versión más nueva por build", () => {
    expect(isNewerAppRelease(3, 4)).toBe(true);
    expect(isNewerAppRelease(4, 4)).toBe(false);
    expect(isNewerAppRelease(5, 4)).toBe(false);
  });
});

describe("parseAppVersionLabel", () => {
  it("lee 1.0.3+4", () => {
    expect(parseAppVersionLabel("1.0.3+4")).toEqual({ versionName: "1.0.3", versionCode: 4 });
  });
});

describe("assertApkUpload", () => {
  it("pide un .apk con peso real", () => {
    expect(() => assertApkUpload({ name: "nota.txt", size: 4000 })).toThrow(/apk/i);
    expect(() => assertApkUpload({ name: "app.apk", size: 10 })).toThrow(/vacío/i);
    expect(() => assertApkUpload({ name: "InventarioRG.apk", size: 8_000_000 })).not.toThrow();
  });
});
