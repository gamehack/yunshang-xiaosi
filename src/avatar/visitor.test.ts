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
  it('uses elapsed time rather than render frame count for pose transitions',()=>{
    const at30=createVisitor(),at60=createVisitor();
    animateVisitor(at30,0,false,false);
    animateVisitor(at60,0,false,false);
    for(let i=0;i<30;i++)animateVisitor(at30,i/30,false,true,1/30);
    for(let i=0;i<60;i++)animateVisitor(at60,i/60,false,true,1/60);
    expect(at30.position.y).toBeCloseTo(at60.position.y,3);
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
