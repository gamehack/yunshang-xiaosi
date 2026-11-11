import { describe, expect, it } from 'vitest';
import { isQuality, nextQuality, qualityPixelRatio, readQuality, writeQuality, QUALITY_KEY } from '../src/performance/quality';

describe('M0.7 rendering quality', () => {
  it('cycles through all three presets', () => {
    expect(nextQuality('省电')).toBe('均衡');
    expect(nextQuality('均衡')).toBe('精细');
    expect(nextQuality('精细')).toBe('省电');
  });
  it('caps DPR without upscaling and handles invalid device ratios', () => {
    expect(qualityPixelRatio('省电', 3)).toBe(1);
    expect(qualityPixelRatio('均衡', 3)).toBe(1.5);
    expect(qualityPixelRatio('精细', 3)).toBe(2);
    expect(qualityPixelRatio('精细', 1)).toBe(1);
    expect(qualityPixelRatio('省电', NaN)).toBe(1);
  });
  it('validates persisted values', () => {
    expect(isQuality('精细')).toBe(true);
    expect(isQuality('invalid')).toBe(false);
    expect(readQuality({ getItem: () => 'invalid' })).toBe('均衡');
  });
  it('reads and writes settings', () => {
    const entries = new Map<string,string>();
    const storage = { getItem: (key:string) => entries.get(key) ?? null, setItem: (key:string, value:string) => {entries.set(key,value);} };
    writeQuality('省电', storage);
    expect(entries.get(QUALITY_KEY)).toBe('省电');
    expect(readQuality(storage)).toBe('省电');
  });
  it('survives unavailable storage', () => {
    expect(readQuality({ getItem: () => {throw Error('blocked');} })).toBe('均衡');
    expect(() => writeQuality('精细', {setItem: () => {throw Error('blocked');}})).not.toThrow();
  });
});
