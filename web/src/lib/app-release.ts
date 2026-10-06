export const APP_RELEASES_BUCKET = "app-releases";
export const APP_RELEASE_MAX_BYTES = 157286400;

export function isNewerAppRelease(currentCode: number, latestCode: number) {
  return Number.isFinite(currentCode) && Number.isFinite(latestCode) && latestCode > currentCode;
}

export function parseAppVersionLabel(raw: string) {
  const value = raw.trim();
  const plus = value.match(/^(\d+\.\d+\.\d+)\+(\d+)$/);
  if (plus) return { versionName: plus[1], versionCode: Number(plus[2]) };
  const nameOnly = value.match(/^(\d+\.\d+\.\d+)$/);
  if (nameOnly) return { versionName: nameOnly[1], versionCode: null as number | null };
  return { versionName: value, versionCode: null as number | null };
}

export function assertApkUpload(file: { name: string; size: number; type?: string | null }) {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".apk")) {
    throw new Error("Sube el archivo .apk de Inventario RG");
  }
  if (file.size < 1024) {
    throw new Error("Ese archivo está vacío o no es una APK");
  }
  if (file.size > APP_RELEASE_MAX_BYTES) {
    throw new Error("La APK no puede pesar más de 150 MB");
  }
}
