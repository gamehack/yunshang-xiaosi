import { describe, expect, it } from 'vitest';
import { createVisitor, animateVisitor } from './visitor';

describe('procedural visitor',()=>{
  it('builds a distinct articulated avatar',()=>{
    const visitor=createVisitor();
    expect(visitor.children.length).toBeGreaterThanOrEqual(6);
    expect(visitor.userData.limbs.leftLeg).toBeDefined();
  });
  it('animates walking without scaling the entire character',()=>{
    const visitor=createVisitor();
    animateVisitor(visitor,0.2,true,false);
    expect(visitor.scale.y).toBe(1);
    expect(visitor.userData.limbs.leftLeg.rotation.x).not.toBe(0);
  });
  it('blends smoothly into seated pose and restores standing',()=>{
    const visitor=createVisitor();
    animateVisitor(visitor,0,false,false);
    animateVisitor(visitor,0,false,true);
    expect(visitor.position.y).toBeLessThan(1);
    expect(visitor.position.y).toBeGreaterThan(.69);
    for(let i=0;i<70;i++)animateVisitor(visitor,i/60,false,true);
    expect(visitor.position.y).toBeCloseTo(.69,2);
    animateVisitor(visitor,2,false,false);
    expect(visitor.position.y).toBeGreaterThan(.69);
    for(let i=0;i<70;i++)animateVisitor(visitor,i/60,false,false);
    expect(visitor.position.y).toBeCloseTo(1,2);
    expect(visitor.scale.y).toBe(1);
  });
});
