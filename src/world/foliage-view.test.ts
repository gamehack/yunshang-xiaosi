import {it,expect} from 'vitest';
import {Vector3} from 'three';
import {foliageVisibility} from './foliage-view';
const camera=new Vector3(0,2,10),focus=new Vector3(0,2,0);
it('clears a foreground culm directly between camera and visitor',()=>{
 expect(foliageVisibility(new Vector3(0,2,8),camera,focus)).toBeLessThan(.05);
});
it('leaves adjacent and background plants opaque instead of fading a whole grove',()=>{
 expect(foliageVisibility(new Vector3(4,2,8),camera,focus)).toBe(1);
 expect(foliageVisibility(new Vector3(0,2,-3),camera,focus)).toBe(1);
});
it('clears geometry almost touching the lens even when off the central ray',()=>{
 expect(foliageVisibility(new Vector3(.3,2,10),camera,focus)).toBeLessThan(.1);
});
