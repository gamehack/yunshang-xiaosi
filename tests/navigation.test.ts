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
    expect(isWalkable(-8,-10)).toBe(true);
    const route=findPath(new Vector3(0,1,-6),new Vector3(-8,0,-10));
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
