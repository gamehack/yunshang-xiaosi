import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Object3D, PerspectiveCamera, Vector3, type WebGLRenderer } from 'three';
import { WalkController, isWalkable } from '../src/navigation/walk-controller';

class Canvas extends EventTarget {
  style = { touchAction: '' };
  private captures = new Set<number>();
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 800 }; }
  setPointerCapture(id: number) { this.captures.add(id); }
  hasPointerCapture(id: number) { return this.captures.has(id); }
  releasePointerCapture(id: number) { this.captures.delete(id); }
}
function event(type: string, properties: Record<string, unknown>) {
  const result = new Event(type, { cancelable: true });
  Object.assign(result, properties);
  return result;
}

describe('G1 walking input and collision safety', () => {
  let canvas: Canvas, avatar: Object3D, camera: PerspectiveCamera, walking: WalkController;
  beforeEach(() => {
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('HTMLElement', Canvas);
    canvas = new Canvas();
    avatar = new Object3D(); avatar.position.set(0, 1, 8);
    camera = new PerspectiveCamera(62, 1, .1, 300);
    camera.position.set(0, 40, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    walking = new WalkController(avatar, camera, { domElement: canvas } as unknown as WebGLRenderer);
  });
  afterEach(() => { walking.dispose(); vi.unstubAllGlobals(); });
  function pointer(type: string, x: number, z: number, pointerType = 'mouse') {
    camera.updateMatrixWorld();
    const projected = new Vector3(x, 0, z).project(camera);
    canvas.dispatchEvent(event(type, { pointerId: 1, pointerType, button: 0, clientX: (projected.x + 1) * 400, clientY: (1 - projected.y) * 400 }));
  }
  function click(x: number, z: number, pointerType = 'mouse') {
    pointer('pointerdown', x, z, pointerType); pointer('pointerup', x, z, pointerType);
  }
  function key(type: string, value: string) {
    window.dispatchEvent(event(type, { key: value, altKey: false, ctrlKey: false, metaKey: false }));
  }
  it('keeps a valid route after an invalid pond click', () => {
    click(0, -10); expect(walking.isMoving).toBe(true);
    click(9, 1.51); expect(walking.isMoving).toBe(true);
    walking.update(1 / 60); expect(avatar.position.z).toBeLessThan(8);
  });
  it('keeps a valid route after a nearby invalid target at ground height', () => {
    avatar.position.set(9, 0, 2);
    click(18, 2); expect(walking.isMoving).toBe(true);
    click(9, 1.51); expect(walking.isMoving).toBe(true);
  });
  it('cancels an unfinished tap when stopping', () => {
    pointer('pointerdown', 0, -10, 'touch');
    walking.stop();
    pointer('pointerup', 0, -10, 'touch');
    expect(walking.isMoving).toBe(false);
  });
  it('cancels auto walking as soon as manual input starts', () => {
    click(0, -10); expect(walking.isMoving).toBe(true);
    key('keydown', 'd'); expect(walking.isMoving).toBe(false);
    walking.update(1 / 60); expect(avatar.position.x).toBeGreaterThan(0);
  });
  it('never resumes a pending tap or keyboard move after seating and standing', () => {
    pointer('pointerdown', 0, -10, 'touch');
    key('keydown', 'w'); walking.setSeated(true);
    pointer('pointerup', 0, -10, 'touch'); walking.update(1 / 60);
    expect(avatar.position.toArray()).toEqual([0, 1, 8]);
    walking.setSeated(false); walking.update(1 / 60);
    expect(avatar.position.toArray()).toEqual([0, 1, 8]);
    expect(walking.isMoving).toBe(false);
  });
  it('does not tunnel across a gate column during a long frame', () => {
    avatar.position.set(-4, 1, 15.6); key('keydown', 'd'); walking.update(2.5);
    expect(avatar.position.x).toBeLessThan(-3.7);
    expect(isWalkable(avatar.position.x, avatar.position.z)).toBe(true);
  });
  it.each([NaN, Infinity, -1])('ignores an invalid frame duration %s', dt => {
    key('keydown', 'w'); walking.update(dt);
    expect(avatar.position.toArray()).toEqual([0, 1, 8]);
    expect(camera.position.toArray().every(Number.isFinite)).toBe(true);
  });
  it.each([[NaN, 1, 8], [25, 1, 8], [0, NaN, 8]])('recovers an invalid standing position (%s, %s, %s) at the entrance', (x, y, z) => {
    avatar.position.set(x, y, z); walking.update(1 / 60);
    expect(avatar.position.toArray()).toEqual([0, 1, 8]);
    expect(camera.position.toArray().every(Number.isFinite)).toBe(true);
  });
  it('clears both route and manual input on blur', () => {
    click(0, -10); key('keydown', 'w'); window.dispatchEvent(new Event('blur'));
    walking.update(1 / 60);
    expect(walking.isMoving).toBe(false); expect(avatar.position.toArray()).toEqual([0, 1, 8]);
  });
  it('walks the bridge to the clicked bank without stalling', () => {
    avatar.position.set(0, 1, 2); click(18, 2);
    for (let i = 0; i < 900; i++) {
      walking.update(1 / 60);
      expect(isWalkable(avatar.position.x, avatar.position.z)).toBe(true);
    }
    expect(walking.isMoving).toBe(false);
    expect(avatar.position.x).toBeCloseTo(18, 1);
    expect(avatar.position.z).toBeCloseTo(2, 1);
  });
});
