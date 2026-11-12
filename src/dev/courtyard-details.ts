import * as THREE from 'three';
import { BRIDGE, PONDS, TEAHOUSE } from '../world/layout';

function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function flagstone() {
  const shape = new THREE.Shape();
  shape.moveTo(-.44, -.5);
  shape.lineTo(.37, -.49);
  shape.lineTo(.5, -.35);
  shape.lineTo(.48, .40);
  shape.lineTo(.36, .5);
  shape.lineTo(-.48, .47);
  shape.lineTo(-.5, -.36);
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function addCourtyardPaving(scene: THREE.Scene) {
  const random = randomSource(116);
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  const slabs = new THREE.InstancedMesh(flagstone(), new THREE.MeshStandardMaterial({ roughness: .97 }), 3 * 49 + 11);
  let index = 0;
  function place(x: number, z: number, width: number, depth: number, angle: number) {
    transform.position.set(x, .024, z);
    transform.rotation.y = angle;
    transform.scale.set(width, 1, depth);
    transform.updateMatrix();
    slabs.setMatrixAt(index, transform.matrix);
    color.set('#a9a18f').multiplyScalar(.76 + random() * .29);
    slabs.setColorAt(index++, color);
  }
  for (let row = 0; row < 49; row++) {
    const first = -1.75 + .88 + random() * .32;
    const second = .40 + random() * .44;
    const edges = [-1.75, first, second, 1.75];
    for (let column = 0; column < 3; column++) {
      place((edges[column] + edges[column + 1]) / 2,
        -15.7 + row * .69 + (random() - .5) * .035,
        edges[column + 1] - edges[column] - .025, .665, (random() - .5) * .035);
    }
  }
  for (let i = 0; i < 11; i++) {
    const x = TEAHOUSE.x + i * .56;
    place(x, -6.72 + .23 * Math.sin(i * .34), .50, .75 + random() * .29, (random() - .5) * .23);
  }
  slabs.receiveShadow = true;
  scene.add(slabs);
}

export function addPondEdge(scene: THREE.Scene) {
  const random = randomSource(814);
  const positions = PONDS.flatMap(pond => Array.from({ length: 40 }, (_, index) => {
    const a = (index + (random() - .5) * .45) * Math.PI * 2 / 40;
    const x = pond.x + Math.cos(a) * (pond.radiusX + .05);
    const z = pond.z + Math.sin(a) * (pond.radiusZ + .06);
    return { x, z, a, pond };
  })).filter(({ x, z, pond }) => (
    Math.abs(z - BRIDGE.z) > BRIDGE.plankWidth / 2 + .25
    && !PONDS.some(other => other !== pond
      && ((x - other.x) / other.radiusX) ** 2 + ((z - other.z) / other.radiusZ) ** 2 < 1.04)
  ));

  const stone = new THREE.IcosahedronGeometry(1, 1);
  const vertices = stone.attributes.position;
  for (let index = 0; index < vertices.count; index++) {
    const x = vertices.getX(index), y = vertices.getY(index), z = vertices.getZ(index);
    const erosion = 1 + .17 * Math.sin(5 * x + 4 * z) * Math.cos(5 * y - 2 * z);
    vertices.setXYZ(index, x * erosion, y * erosion, z * erosion);
  }
  stone.computeVertexNormals();
  const stones = new THREE.InstancedMesh(stone, new THREE.MeshStandardMaterial({ roughness: .96 }), positions.length);
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  positions.forEach(({ x, z, a }, index) => {
    const width = .19 + random() * .31;
    transform.position.set(x, .036, z);
    transform.rotation.set(.12 * random(), -a + random() * .45, .35 * (random() - .5));
    transform.scale.set(width, .10 + random() * .12, width * (.55 + random() * .21));
    transform.updateMatrix();
    stones.setMatrixAt(index, transform.matrix);
    color.set(index % 4 === 0 ? '#747b61' : '#8c8a7e').multiplyScalar(.79 + random() * .35);
    stones.setColorAt(index, color);
  });
  scene.add(stones);

  const clusters = positions.filter((_, index) => index % 5 === 1 || index % 11 === 4);
  const blade = new THREE.BufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([
    -.025,0,0, .026,0,0, .024,.22,.056,
    -.025,0,0, .024,.22,.056, -.017,.21,.057,
    -.017,.21,.057, .024,.22,.056, .02,.37,.16,
  ], 3));
  blade.computeVertexNormals();
  const sedge = new THREE.InstancedMesh(blade,
    new THREE.MeshStandardMaterial({ roughness: .98, side: THREE.DoubleSide }), clusters.length * 12);
  clusters.forEach(({ x, z, a }, cluster) => {
    for (let index = 0; index < 12; index++) {
      transform.position.set(
        x + .23 * Math.cos(a) + (random() - .5) * .40, .027,
        z + .23 * Math.sin(a) + (random() - .5) * .36,
      );
      transform.rotation.set((random() - .5) * .18, random() * Math.PI * 2, 0);
      transform.scale.set(.7 + random() * .6, .55 + random() * .8, 1);
      transform.updateMatrix();
      sedge.setMatrixAt(cluster * 12 + index, transform.matrix);
      color.set(index % 4 === 0 ? '#8a8c4d' : '#67774c').multiplyScalar(.75 + random() * .48);
      sedge.setColorAt(cluster * 12 + index, color);
    }
  });
  scene.add(sedge);
}
