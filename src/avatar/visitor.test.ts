import { describe, expect, it } from 'vitest';
import { Box3, Vector3 } from 'three';
import { createVisitor, animateVisitor, turnVisitor } from './visitor';
import { SEATS } from '../navigation/seats';
import { walkSurfaceHeight } from '../world/layout';

function footBottom(visitor: ReturnType<typeof createVisitor>, side: 'left' | 'right') {
  expect(visitor.userData.limbs[`${side}Foot`]).toBeDefined();
  visitor.updateMatrixWorld(true);
  return new Box3().setFromObject(visitor.userData.limbs[`${side}Foot`]).min.y;
}
function settle(visitor: ReturnType<typeof createVisitor>, seated: boolean, seat = SEATS[0], fps = 60) {
  for (let i = 0; i < fps * 2; i++) animateVisitor(visitor, i / fps, false, seated, 1 / fps, seat);
}

describe('procedural visitor on real surfaces', () => {
  it('builds separate hip, knee and foot joints', () => {
    const visitor = createVisitor();
    const limbs = visitor.userData.limbs;
    expect(limbs.leftKnee).toBeDefined();
    expect(limbs.leftKnee.parent).toBe(limbs.leftLeg);
    expect(limbs.rightKnee.parent).toBe(limbs.rightLeg);
    expect(limbs.leftFoot.parent).toBe(limbs.leftKnee);
    expect(limbs.rightFoot.parent).toBe(limbs.rightKnee);
  });
  it.each([[0, 8, 0], [9, 2, .18], [-10, -10, .245], [0, -94, .3]])('keeps standing soles on the surface at %s,%s', (x, z, surface) => {
    const visitor = createVisitor(); visitor.position.set(x, 1, z);
    animateVisitor(visitor, 0, false, false);
    expect(typeof walkSurfaceHeight).toBe('function');
    expect(walkSurfaceHeight(x, z)).toBeCloseTo(surface, 6);
    expect(footBottom(visitor, 'left')).toBeCloseTo(surface, 5);
    expect(footBottom(visitor, 'right')).toBeCloseTo(surface, 5);
  });
  for (const [index, seat] of SEATS.entries()) {
    it(`sits on the real seat ${index} without burying hips or feet`, () => {
      const visitor = createVisitor(); visitor.position.set(seat.x, 1, seat.z);
      settle(visitor, true, seat);
      visitor.updateMatrixWorld(true);
      expect(visitor.userData.limbs.pelvis).toBeDefined();
      const pelvis = new Box3().setFromObject(visitor.userData.limbs.pelvis);
      expect(pelvis.min.y).toBeCloseTo(index === 0 ? .59 : .875, 4);
      for (const side of ['left', 'right'] as const) {
        const limbs = visitor.userData.limbs;
        const hip = limbs[`${side}Leg`], knee = limbs[`${side}Knee`];
        const h = hip.getWorldPosition(new Vector3()), k = knee.getWorldPosition(new Vector3());
        expect(k.z - h.z).toBeGreaterThan(.4);
        expect(hip.rotation.x + knee.rotation.x).toBeCloseTo(0, 5);
        expect(footBottom(visitor, side)).toBeGreaterThanOrEqual(walkSurfaceHeight(seat.x, seat.z) - 1e-6);
      }
    });
    it(`keeps feet above the floor throughout seat ${index} sit and stand transitions`, () => {
      const visitor = createVisitor(); visitor.position.set(seat.x, 1, seat.z);
      animateVisitor(visitor, 0, false, false);
      for (const seated of [true, false]) for (let i = 0; i < 90; i++) {
        animateVisitor(visitor, i / 60, false, seated, 1 / 60, seat);
        expect(footBottom(visitor, 'left')).toBeGreaterThanOrEqual(walkSurfaceHeight(seat.x, seat.z) - 1e-6);
        expect(footBottom(visitor, 'right')).toBeGreaterThanOrEqual(walkSurfaceHeight(seat.x, seat.z) - 1e-6);
      }
    });
  }
  it('produces equivalent seated and standing transitions at 30 and 60 FPS', () => {
    const at30 = createVisitor(), at60 = createVisitor();
    for (const visitor of [at30, at60]) { visitor.position.set(-8, 1, -8.3); animateVisitor(visitor, 0, false, false); }
    for (const seated of [true, false]) {
      for (let i = 0; i < 9; i++) animateVisitor(at30, i / 30, false, seated, 1 / 30, SEATS[0]);
      for (let i = 0; i < 18; i++) animateVisitor(at60, i / 60, false, seated, 1 / 60, SEATS[0]);
      expect(at30.position.y).toBeCloseTo(at60.position.y, 5);
      expect(at30.userData.limbs.leftLeg.rotation.x).toBeCloseTo(at60.userData.limbs.leftLeg.rotation.x, 5);
    }
  });
  it('animates gait while keeping soles above ground and preserving body scale', () => {
    const visitor = createVisitor(); visitor.position.set(0, 1, 8);
    for (let i = 0; i < 120; i++) {
      animateVisitor(visitor, i / 60, true, false, 1 / 60);
      expect(footBottom(visitor, 'left')).toBeGreaterThanOrEqual(-1e-6);
      expect(footBottom(visitor, 'right')).toBeGreaterThanOrEqual(-1e-6);
    }
    expect(visitor.scale.y).toBe(1);
    expect(visitor.userData.limbs.leftLeg.rotation.x).not.toBe(0);
  });
  it('smoothly turns toward movement with matching 30 and 60 FPS results', () => {
    const at30 = createVisitor(), at60 = createVisitor();
    expect(typeof turnVisitor).toBe('function');
    turnVisitor(at30, Math.PI / 2, 1 / 30);
    expect(at30.rotation.y).toBeGreaterThan(0); expect(at30.rotation.y).toBeLessThan(Math.PI / 2);
    for (let i = 1; i < 15; i++) turnVisitor(at30, Math.PI / 2, 1 / 30);
    for (let i = 0; i < 30; i++) turnVisitor(at60, Math.PI / 2, 1 / 60);
    expect(at30.rotation.y).toBeCloseTo(at60.rotation.y, 6);
  });
  it('turns across the angle seam by the short arc', () => {
    const visitor = createVisitor(); visitor.rotation.y = Math.PI - .05;
    expect(typeof turnVisitor).toBe('function');
    turnVisitor(visitor, -Math.PI + .05, 1 / 60);
    expect(visitor.rotation.y).toBeGreaterThan(Math.PI - .05);
    expect(visitor.rotation.y).toBeLessThan(Math.PI + .05);
  });
});
