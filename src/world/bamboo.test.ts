import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { addBambooGrove } from './bamboo';

describe('addBambooGrove', () => {
  it('builds only three instanced draw groups for a grove', () => {
    const scene = new THREE.Scene();
    addBambooGrove(scene, [
      { x: 2, z: -3, h: 4 },
      { x: -5, z: 7, h: 5 },
    ]);
    expect(scene.children).toHaveLength(3);
    const meshes = scene.children as THREE.InstancedMesh[];
    expect(meshes.every((mesh) => mesh.isInstancedMesh)).toBe(true);
    expect(meshes.map((mesh) => mesh.count)).toEqual([2, 10, 144]);
    const stem = new THREE.Matrix4();
    meshes[0].getMatrixAt(0, stem);
    const p = new THREE.Vector3().setFromMatrixPosition(stem);
    expect(p.x).toBe(2);
    expect(p.y).toBe(2);
    expect(p.z).toBe(-3);
  });

  it('handles an empty grove without adding invalid meshes', () => {
    const scene = new THREE.Scene();
    addBambooGrove(scene, []);
    expect(scene.children).toHaveLength(0);
  });
});
