import * as THREE from 'three';
import type { Footprint } from '../world/layout';

type WallVisual = {
  footprint: Footprint;
  body: THREE.Mesh<THREE.BoxGeometry>;
  cap: THREE.Mesh;
};

function limewashMap() {
  const width = 128;
  const height = 96;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const heightRatio = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x * 2 * Math.PI / width;
      const v = heightRatio * Math.PI;
      const mottling = 3.4 * Math.sin(3 * u + v) * Math.cos(4 * v - u)
        + 2.1 * Math.sin(11 * u - 9 * v) * Math.sin(7 * v + u);
      const grain = ((Math.imul(x + 71, y + 41) ^ Math.imul(x + y, 1129)) & 15) / 4;
      const damp = (1 - THREE.MathUtils.smoothstep(heightRatio, 0, .25)) * (15 + 5 * Math.sin(5 * u));
      const runoff = Math.max(0, Math.sin(9 * u) + .42 * Math.sin(17 * u)) ** 2
        * THREE.MathUtils.smoothstep(heightRatio, .34, .93) * 3.2;
      const tone = mottling + grain - damp - runoff;
      pixels.set([216 + tone, 213 + tone, 200 + tone * 1.2, 255], (y * width + x) * 4);
    }
  }
  const map = new THREE.DataTexture(pixels, width, height);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  return map;
}

function copingGeometry() {
  // Extrude the cross section along the wall, with a dark ridge and rounded drip edges.
  const section = new THREE.Shape();
  const profile = [[-.36, 0], [-.37, .052], [-.29, .082], [-.19, .11],
    [-.072, .179], [-.041, .218], [.041, .218], [.072, .179],
    [.19, .11], [.29, .082], [.37, .052], [.36, 0]];
  profile.forEach(([x, y], i) => i === 0 ? section.moveTo(x, y) : section.lineTo(x, y));
  section.closePath();
  const geometry = new THREE.ExtrudeGeometry(section, { depth: 1, bevelEnabled: false });
  geometry.translate(0, 0, -.5);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

export function dressCourtyardWalls(scene: THREE.Scene, walls: readonly WallVisual[]) {
  const limewash = limewashMap();
  const plaster = new THREE.MeshStandardMaterial({ map: limewash, bumpMap: limewash, bumpScale: .014, roughness: .98 });
  const caps = new THREE.InstancedMesh(copingGeometry(),
    new THREE.MeshStandardMaterial({ roughness: .87 }), walls.length);
  const plinths = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .25, .45),
    new THREE.MeshStandardMaterial({ roughness: .98 }), walls.length);
  const transform = new THREE.Object3D();
  walls.forEach(({ footprint, body, cap }, index) => {
    const alongX = footprint.width > footprint.depth;
    const length = alongX ? footprint.width : footprint.depth;
    const { position, normal, uv } = body.geometry.attributes;
    for (let i = 0; i < uv.count; i++) {
      const alongWall = alongX ? Math.abs(normal.getZ(i)) > .5 : Math.abs(normal.getX(i)) > .5;
      if (alongWall) uv.setX(i, (alongX ? position.getX(i) : position.getZ(i)) / 3.4);
    }
    body.material = plaster;
    body.receiveShadow = true;
    // Keep the cap mesh registered as an occluder at the original footprint.
    cap.visible = false;
    transform.rotation.y = alongX ? 0 : Math.PI / 2;
    transform.position.set(footprint.x, 2.79, footprint.z);
    transform.scale.x = length + .09;
    transform.updateMatrix();
    caps.setMatrixAt(index, transform.matrix);
    caps.setColorAt(index, new THREE.Color(index % 2 === 0 ? '#494e4b' : '#525952'));
    transform.position.y = .125;
    transform.scale.x = length;
    transform.updateMatrix();
    plinths.setMatrixAt(index, transform.matrix);
    plinths.setColorAt(index, new THREE.Color(index % 2 === 0 ? '#8b8a7c' : '#98978b'));
  });
  caps.receiveShadow = plinths.receiveShadow = true;
  scene.add(caps, plinths);
}

function crownGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const { position, normal } = geometry.attributes;
  const colors = [];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const detail = Math.sin(10 * x + 8 * z) * Math.cos(8 * y - 4 * z);
    const lobes = Math.sin(5 * x - 3 * z) * Math.cos(6 * y + 3 * z);
    const radius = 1 + .09 * detail + .12 * lobes;
    position.setXYZ(i, radius * x, radius * y, radius * z);
    normal.setXYZ(i, x, y, z);
    const tone = .82 + .13 * y + .12 * detail + .06 * lobes;
    colors.push(tone, tone, tone);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function canopyMap() {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x * Math.PI * 2 / size;
      const v = y * Math.PI * 2 / size;
      const speckle = (Math.imul(x + 23, y + 31) ^ Math.imul(x + y, 2093)) & 15;
      const dapple = Math.sin(u * 13 + v * 9) * Math.cos(v * 19 - u * 7);
      const shade = 230 + 9 * dapple + speckle;
      pixels.set([shade, shade, shade, 255], (y * size + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function addCourtyardCanopies(scene: THREE.Scene) {
  // Outside the enclosure. Leave the north exit and the view over the far bank open.
  const trees = [
    { x: -22, z: -7, h: 5.7, spread: 2.9, color: '#536c46' },
    { x: -21.8, z: -13.8, h: 6.6, spread: 3.2, color: '#3e5841' },
    { x: -16.5, z: -18.8, h: 5.5, spread: 2.8, color: '#6b794e' },
    { x: -12, z: -20.6, h: 7.8, spread: 3.6, color: '#466044' },
    { x: -6.3, z: -18.7, h: 5.6, spread: 2.8, color: '#5b7046' },
    { x: 6.9, z: -19.3, h: 7.2, spread: 3.4, color: '#4a6046' },
    { x: 14.8, z: -18.3, h: 5.8, spread: 2.8, color: '#6d7851' },
    { x: 22, z: -8, h: 6.6, spread: 3.5, color: '#596d49' },
    { x: 22, z: 4.8, h: 5.5, spread: 3, color: '#68794d' },
  ];
  const tipsPerTree = 5;
  const crowns = new THREE.InstancedMesh(crownGeometry(),
    new THREE.MeshStandardMaterial({ map: canopyMap(), roughness: .97, vertexColors: true }),
    trees.length * (tipsPerTree * 2 + 1));
  const branches = new THREE.InstancedMesh(new THREE.CylinderGeometry(.52, 1, 1, 6),
    new THREE.MeshStandardMaterial({ color: '#625244', roughness: .98 }), trees.length * (tipsPerTree + 1));
  const transform = new THREE.Object3D();
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  let branch = 0;
  let crown = 0;
  const addBranch = (radius: number) => {
    direction.subVectors(to, from);
    transform.position.copy(from).lerp(to, .5);
    transform.scale.set(radius, direction.length(), radius);
    transform.quaternion.setFromUnitVectors(up, direction.normalize());
    transform.updateMatrix();
    branches.setMatrixAt(branch++, transform.matrix);
  };
  trees.forEach(({ x, z, h, spread, color: base }, index) => {
    from.set(x, 0, z);
    to.set(x + .28 * Math.sin(index), h * .78, z + .31);
    addBranch(.22);
    const addCrown = (cx: number, cy: number, cz: number, size: number, angle: number, tone: number) => {
      transform.position.set(cx, cy, cz);
      transform.scale.set(size, size * .54, size * .88);
      transform.rotation.set(.1, angle, -.13);
      transform.updateMatrix();
      crowns.setMatrixAt(crown, transform.matrix);
      crowns.setColorAt(crown++, color.set(base).multiplyScalar(tone));
    };
    addCrown(to.x, h * .94, to.z, spread * .58, index, 1.13);
    for (let tip = 0; tip < tipsPerTree; tip++) {
      const angle = index * 1.7 + tip * 2.39996;
      const reach = spread * (.43 + .08 * (tip % 3));
      from.set(x, h * (.42 + .04 * tip), z + .14);
      to.set(x + Math.cos(angle) * reach, h * (.68 + .05 * (tip % 4)), z + Math.sin(angle) * reach);
      addBranch(.097 - .008 * tip);
      addCrown(to.x, to.y, to.z, spread * (.43 + .035 * (tip % 3)), angle, .83 + .066 * tip);
      addCrown(to.x + .57 * Math.cos(angle), to.y + .37, to.z + .57 * Math.sin(angle),
        spread * .30, angle + .7, 1.04 + .045 * (tip % 3));
    }
  });
  scene.add(branches, crowns);
}
