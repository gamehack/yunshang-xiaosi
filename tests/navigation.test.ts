import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { findPath, isWalkable } from '../src/navigation/walk-controller';

describe('M0 prototype navigation', () => {
  it('rejects pond and building interiors', () => {
    expect(isWalkable(9, 0)).toBe(false);
    expect(isWalkable(-8, -12.5)).toBe(false);
  });
  it('blocks visible wall geometry and gate columns', () => {
    expect(isWalkable(-20.5, -10)).toBe(false);
    expect(isWalkable(-2.7, 15.6)).toBe(false);
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
  it('connects the garden to the lake lookout through the bamboo corridor', () => {
    const route=findPath(new Vector3(0,1,8),new Vector3(0,0,-94));
    expect(route.length).toBeGreaterThan(90);
    expect(route.every(p=>isWalkable(p.x,p.z))).toBe(true);
  });
  it('blocks leaving the exterior trail into bamboo', () => {
    expect(isWalkable(9,-50)).toBe(false);
    expect(isWalkable(0,-50)).toBe(true);
  });
  it('allows the teahouse entrance standing spot and lookout seat approach', () => {
    expect(isWalkable(-8,-6.5)).toBe(true);
    expect(isWalkable(0,-94)).toBe(true);
  });
  it('allows entering the teahouse from its open eastern frontage', () => {
    expect(isWalkable(-9.5,-10)).toBe(true);
    expect(isWalkable(-8,-10)).toBe(false);
    const route=findPath(new Vector3(0,1,-6),new Vector3(-10,0,-10));
    expect(route.length).toBeGreaterThan(0);
    expect(route.every(p=>isWalkable(p.x,p.z))).toBe(true);
  });
  it('blocks the teahouse rear wall', () => {
    expect(isWalkable(-8,-12.5)).toBe(false);
  });
  it('does not start a route inside an obstacle', () => {
    expect(findPath(new Vector3(9,0,0),new Vector3(0,0,8))).toEqual([]);
  });
  it('crosses the pond on the bridge deck while water remains blocked', () => {
    expect(isWalkable(9,2)).toBe(true);
    expect(isWalkable(9,0)).toBe(false);
    expect(isWalkable(9,4)).toBe(false);
    const route=findPath(new Vector3(0,0,2),new Vector3(18,0,2));
    expect(route.length).toBeGreaterThan(0);
    expect(route.some(p=>p.x===9&&p.z===2)).toBe(true);
    expect(route.every(p=>isWalkable(p.x,p.z))).toBe(true);
  });
  it('returns empty path when already at destination', () => {
    expect(findPath(new Vector3(0, 1, 8), new Vector3(0, 0, 8))).toEqual([]);
  });
});

describe('G1 navigation safety', () => {
  it.each([[NaN, 0], [0, NaN], [Infinity, 0], [0, -Infinity]])('rejects non-finite map coordinates (%s, %s)', (x, z) => {
    expect(isWalkable(x, z)).toBe(false);
  });
  it('rejects an actual pond target even when its rounded grid cell is on the bridge', () => {
    expect(isWalkable(9, 1.51)).toBe(false);
    expect(findPath(new Vector3(0, 1, 8), new Vector3(9, 0, 1.51))).toEqual([]);
  });
  it('rejects an actual pond start even when its rounded grid cell is on the bridge', () => {
    expect(findPath(new Vector3(9, 1, 1.51), new Vector3(0, 0, 8))).toEqual([]);
  });
  it('blocks the middle of a teahouse support post within the visitor footprint', () => {
    expect(isWalkable(-11.7, -7.5)).toBe(false);
  });
  it('returns an exact safe target within the same grid cell', () => {
    const route = findPath(new Vector3(0, 1, 8), new Vector3(.3, 0, 8.2));
    expect(route.at(-1)?.toArray()).toEqual([.3, 0, 8.2]);
  });
  it('crosses the entire bridge without detouring through the garden', () => {
    const route = findPath(new Vector3(0, 1, 2), new Vector3(18, 0, 2));
    expect(route).toHaveLength(18);
    expect(route.every(point => point.z === 2)).toBe(true);
  });
  it('connects entrance, courtyard, teahouse, bamboo and lookout in both directions with safe segments', () => {
    const stops = [[0, 15], [0, 1], [-10, -10], [0, -50], [0, -94], [0, -50], [-10, -10], [0, 1], [0, 15]];
    for (let index = 1; index < stops.length; index++) {
      const [x, z] = stops[index - 1];
      const [tx, tz] = stops[index];
      let previous = new Vector3(x, 0, z);
      const route = findPath(previous, new Vector3(tx, 0, tz));
      expect(route.length).toBeGreaterThan(0);
      for (const next of route) {
        for (let fraction = 0; fraction <= 1; fraction += .1) {
          const point = previous.clone().lerp(next, fraction);
          expect(isWalkable(point.x, point.z)).toBe(true);
        }
        previous = next;
      }
      expect(previous.toArray()).toEqual([tx, 0, tz]);
    }
  });
});

describe('lookout and solid seating boundaries',()=>{
 it('blocks corners beyond the circular lookout deck',()=>{
  expect(isWalkable(5,-100)).toBe(false);expect(isWalkable(0,-100.5)).toBe(false);expect(isWalkable(0,-94)).toBe(true);
 });
 it('does not allow standing inside either solid bench',()=>{
  expect(isWalkable(-8,-8.3)).toBe(false);expect(isWalkable(0,-97)).toBe(false);
 });
});
