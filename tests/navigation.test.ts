import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { findPath, isWalkable } from '../src/navigation/walk-controller';

describe('M0 prototype navigation', () => {
  it('rejects pond and building interiors', () => {
    expect(isWalkable(9, 0)).toBe(false);
    expect(isWalkable(-8, -10)).toBe(false);
  });
  it('keeps the entrance walkable', () => {
    expect(isWalkable(0, 8)).toBe(true);
  });
  it('rejects unreachable clicked destinations', () => {
    expect(findPath(new Vector3(0, 1, 8), new Vector3(9, 0, 0))).toEqual([]);
  });
  it('routes around the pond on walkable cells', () => {
    const route = findPath(new Vector3(0, 1, 8), new Vector3(18, 0, 8));
    expect(route.length).toBeGreaterThan(0);
    expect(route.every(p => isWalkable(p.x,p.z))).toBe(true);
    expect(route.at(-1)?.x).toBe(18);
  });
  it('returns empty path when already at destination', () => {
    expect(findPath(new Vector3(0, 1, 8), new Vector3(0, 0, 8))).toEqual([]);
  });
});
