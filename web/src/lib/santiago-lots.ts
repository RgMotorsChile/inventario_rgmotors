/** Pestañas del Excel de compras Santiago, en el orden de la planilla. */
export const SANTIAGO_TABS = [
  "07/26",
  "08/26",
  "09/26",
  "Copia de 09/26",
  "10/26",
  "11/26",
  "12/26",
  "Ofertas pendientes",
] as const;

const LOT_FROM_PLATE: Record<string, string> = {
  LXPJ27: "07/26",
  SFWD31: "07/26",
  RFBG93: "07/26",
  THSR65: "07/26",
  KFLS48: "07/26",
  PTFC69: "07/26",
  RZWV49: "07/26",
  SRCK33: "07/26",
  SSDD57: "07/26",
  SVFD42: "07/26",
  SVFB26: "07/26",
  SCGV34: "07/26",
  SDJT43: "07/26",
  THZG51: "07/26",
  SWZJ94: "07/26",
  SFYB23: "07/26",
  SBGW69: "07/26",
  SRCP22: "07/26",
  JYYV84: "08/26",
  SGYL33: "08/26",
  PHYY25: "08/26",
  PSKJ78: "08/26",
  RZVK91: "08/26",
  RZVL18: "08/26",
  SGVH14: "08/26",
  SGCV26: "08/26",
  RRXY75: "08/26",
  SRCP18: "08/26",
  THLV62: "08/26",
  RLVR63: "08/26",
  SBZC70: "08/26",
  SLGD85: "08/26",
  TSXK53: "08/26",
  LXTX71: "08/26",
  SSDY34: "08/26",
  SXSL40: "08/26",
  SFYB24: "08/26",
  RLVR75: "08/26",
  SXKK11: "08/26",
  RZTG13: "08/26",
  RZJR40: "08/26",
  RPSH61: "08/26",
  RLRG95: "08/26",
  SGVH42: "08/26",
  SKPW20: "08/26",
  PHYG44: "08/26",
  PLLD15: "08/26",
  RPSH32: "08/26",
  RGZK10: "08/26",
  SKFW91: "08/26",
  TBGC18: "09/26",
  RTXJ21: "09/26",
  SPKC75: "09/26",
  RXFK24: "09/26",
  SXDW38: "09/26",
  PJBL79: "09/26",
  RYYS68: "09/26",
  RRYJ47: "09/26",
  RPSH53: "09/26",
  RJHT24: "09/26",
  PRKK70: "09/26",
  PSFK52: "09/26",
  PRHK11: "09/26",
  HVHS94: "09/26",
  HYGH38: "09/26",
  SVFB28: "09/26",
  RPSV20: "09/26",
  JKCX98: "09/26",
  KHFG83: "09/26",
  LPCG80: "09/26",
  SBZG55: "09/26",
  KTRF49: "09/26",
  RTXJ64: "09/26",
  RPSH56: "09/26",
  RPSH28: "09/26",
  GWXJ47: "10/26",
  SLBH24: "Ofertas pendientes",
};

export function lotFromPurchaseDate(raw: string): string {
  const match = raw.trim().match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return "";
  const month = String(Number(match[2])).padStart(2, "0");
  const year = match[3].length === 4 ? match[3].slice(2) : match[3];
  if (Number(month) < 1 || Number(month) > 12) return "";
  return `${month}/${year}`;
}

export function lotForPlate(plate: string, fallback = ""): string {
  const key = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return LOT_FROM_PLATE[key] || fallback;
}

export function preferPurchaseLot(prev: string, next: string): string {
  if (!next) return prev;
  if (!prev) return next;
  if (/^copia\s*de\s*/i.test(next) && !/^copia\s*de\s*/i.test(prev)) return prev;
  return lotRank(next) >= lotRank(prev) ? next : prev;
}

export function isPurchaseLotTab(name: string): boolean {
  const n = name.trim();
  if (/^ofertas\s+pendientes$/i.test(n)) return true;
  return /^(copia\s+de\s+)?\d{1,2}\s*[/-]\s*\d{2,4}$/i.test(n);
}

export function canonicalPurchaseLot(name: string): string {
  const trimmed = name.trim();
  const copy = /^(copia\s+de\s+)/i.test(trimmed);
  const rest = trimmed.replace(/^(copia\s+de\s+)/i, "");
  const match = rest.match(/^(\d{1,2})\s*[/-]\s*(\d{2,4})$/);
  if (!match) return trimmed;
  const month = String(Number(match[1])).padStart(2, "0");
  const year = match[2].length === 4 ? match[2].slice(2) : match[2];
  const lot = `${month}/${year}`;
  return copy ? `Copia de ${lot}` : lot;
}

/** Meses del año anterior, actual y siguiente, más copias recientes. */
export function dateTabCandidates(now = new Date()): string[] {
  const year = now.getFullYear();
  const names: string[] = [];
  for (let y = year - 1; y <= year + 1; y += 1) {
    const yy = String(y).slice(2);
    for (let month = 1; month <= 12; month += 1) {
      names.push(`${String(month).padStart(2, "0")}/${yy}`);
    }
  }
  for (let offset = 0; offset < 4; offset += 1) {
    const date = new Date(year, now.getMonth() - offset, 1);
    names.push(`Copia de ${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(2)}`);
  }
  names.push("Ofertas pendientes");
  return sortPurchaseLots(names);
}

export function mergePurchaseTabs(listed: string[], extra: readonly string[] = SANTIAGO_TABS): string[] {
  const found = new Map<string, string>();
  for (const name of [...extra, ...listed]) {
    if (!isPurchaseLotTab(name)) continue;
    const key = canonicalPurchaseLot(name);
    if (!found.has(key)) found.set(key, name);
  }
  return sortPurchaseLots([...found.keys()]).map((key) => found.get(key) ?? key);
}

export function sortPurchaseLots(lots: string[]): string[] {
  return [...new Set(lots.filter(Boolean))].sort((a, b) => lotRank(a) - lotRank(b));
}

function lotRank(name: string): number {
  const copy = /^copia\s*de\s*/i.test(name);
  const match = name.match(/(\d{1,2})\s*\/\s*(\d{2,4})/);
  if (!match) return 100_000 + name.localeCompare("Ofertas", "es");
  const month = Number(match[1]);
  const year = Number(match[2].length === 2 ? `20${match[2]}` : match[2]);
  return year * 12 + month + (copy ? 0.5 : 0);
}
