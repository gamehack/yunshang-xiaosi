import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { addBambooGrove } from './bamboo';

describe('addBambooGrove', () => {
  it('builds three instanced draw groups for bamboo in the same spatial cell', () => {
    const scene = new THREE.Scene();
    addBambooGrove(scene, [{x:2,z:-3,h:4},{x:3,z:-2,h:5}]);
    expect(scene.children).toHaveLength(3);
    const meshes=scene.children as THREE.InstancedMesh[];
    expect(meshes.every(mesh=>mesh.isInstancedMesh)).toBe(true);
    expect(meshes.map(mesh=>mesh.count)).toEqual([2,10,144]);
    const stem=new THREE.Matrix4();
    meshes[0].getMatrixAt(0,stem);
    const p=new THREE.Vector3().setFromMatrixPosition(stem);
    expect([p.x,p.y,p.z]).toEqual([2,2,-3]);
  });

  it('partitions distant groves so each leaf batch can fade independently', () => {
    const scene=new THREE.Scene();
    addBambooGrove(scene,[{x:2,z:-3,h:4},{x:-5,z:7,h:5}]);
    expect(scene.children).toHaveLength(6);
    const leaves=scene.children.filter(o=>o.userData.cameraFoliage) as THREE.InstancedMesh[];
    expect(leaves).toHaveLength(2);
    expect(leaves.map(o=>o.count)).toEqual([72,72]);
    expect(leaves[0].material).not.toBe(leaves[1].material);
    expect(leaves.every(o=>o.userData.groveCenter instanceof THREE.Vector3)).toBe(true);
  });

  it('handles an empty grove without adding invalid meshes', () => {
    const scene=new THREE.Scene();
    addBambooGrove(scene,[]);
    expect(scene.children).toHaveLength(0);
  });
});
