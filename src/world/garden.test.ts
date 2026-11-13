import {it,expect} from 'vitest';
import * as THREE from 'three';
import {buildGarden} from './garden';
it('aligns the tea roof ridge with the intersection of both roof slopes',()=>{
 const scene=new THREE.Scene();buildGarden(scene);
 // The ridge sits at the highest roof level; its long axis must follow z.
 const ridge=scene.children.find(o=>o instanceof THREE.Mesh && o.geometry instanceof THREE.BoxGeometry && Math.abs(o.position.y-3.94)<.01) as THREE.Mesh<THREE.BoxGeometry>;
 expect(ridge.geometry.parameters.depth).toBeGreaterThan(6);
 expect(ridge.geometry.parameters.width).toBeLessThan(.3);
});
