export type Quality = '省电' | '均衡' | '精细';
export const QUALITIES: readonly Quality[] = ['省电', '均衡', '精细'];
export const QUALITY_KEY = 'banrixian.quality.v1';
export function isQuality(value: unknown): value is Quality {
  return typeof value === 'string' && QUALITIES.includes(value as Quality);
}
export function nextQuality(value: Quality): Quality {
  return QUALITIES[(QUALITIES.indexOf(value) + 1) % QUALITIES.length];
}
export function qualityPixelRatio(value: Quality, devicePixelRatio: number): number {
  const cap = value === '省电' ? 1 : value === '均衡' ? 1.5 : 2;
  return Math.min(Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1, cap);
}
export function readQuality(storage?: Pick<Storage, 'getItem'>): Quality {
  try {
    const value = storage?.getItem(QUALITY_KEY);
    return isQuality(value) ? value : '均衡';
  } catch {
    return '均衡';
  }
}
export function writeQuality(value: Quality, storage?: Pick<Storage, 'setItem'>): void {
  try { storage?.setItem(QUALITY_KEY, value); } catch { /* storage disabled */ }
}
