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
  const geometry = new THREE.IcosahedronGeometry(1, 1);
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

function leafSprayMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const brush = canvas.getContext('2d');
  if (!brush) throw new Error('无法生成树冠叶片贴图');
  let seed = 2872;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let sprig = 0; sprig < 17; sprig++) {
    const angle = sprig * 2.39996;
    const reach = .65 + .35 * random();
    const dx = Math.cos(angle) * 104 * reach;
    const dy = Math.sin(angle) * 76 * reach;
    const rootX = 128 + 15 * Math.sin(sprig);
    const rootY = 96 + 8 * Math.cos(sprig * 2);
    brush.strokeStyle = '#8b8b8b';
    brush.lineWidth = 1.4;
    brush.beginPath();
    brush.moveTo(rootX, rootY);
    brush.lineTo(rootX + dx, rootY + dy);
    brush.stroke();
    for (let leaf = 0; leaf < 11; leaf++) {
      const along = .20 + leaf * .077;
      const sign = leaf % 2 ? 1 : -1;
      const length = (9 + random() * 18) * (1.18 - along * .43);
      const width = length * (.20 + random() * .14);
      const shade = Math.round(178 + 67 * random());
      brush.save();
      brush.translate(rootX + along * dx, rootY + along * dy);
      brush.rotate(angle + sign * (.35 + random() * .86));
      brush.fillStyle = `rgb(${shade},${shade},${shade})`;
      brush.beginPath();
      brush.moveTo(0, 0);
      brush.quadraticCurveTo(length * .5, -width * 1.34, length, -.7);
      brush.quadraticCurveTo(length * .58, width * 1.1, 0, 0);
      brush.fill();
      brush.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
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
  const cardsPerCrown = 4;
  const crowns = new THREE.InstancedMesh(crownGeometry(),
    new THREE.MeshLambertMaterial({ vertexColors: true }), trees.length * (tipsPerTree + 1));
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 1.5), new THREE.MeshLambertMaterial({
    map: leafSprayMap(), alphaTest: .42, side: THREE.DoubleSide,
  }), trees.length * (tipsPerTree + 1) * cardsPerCrown);
  const branches = new THREE.InstancedMesh(new THREE.CylinderGeometry(.52, 1, 1, 6),
    new THREE.MeshStandardMaterial({ color: '#625244', roughness: .98 }), trees.length * (tipsPerTree + 1));
  const transform = new THREE.Object3D();
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  const litLeaves = new THREE.Color('#9ea976');
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
      transform.scale.set(size * .65, size * .34, size * .56);
      transform.rotation.set(.1, angle, -.13);
      transform.updateMatrix();
      crowns.setMatrixAt(crown, transform.matrix);
      crowns.setColorAt(crown, color.set(base).multiplyScalar(tone));
      for (let card = 0; card < cardsPerCrown; card++) {
        const yaw = angle + card * Math.PI / 2;
        transform.position.set(cx + Math.sin(yaw) * size * .38, cy + (card - 1.2) * size * .16,
          cz + Math.cos(yaw) * size * .38);
        transform.scale.set(size * (1.02 + .10 * (card % 2)), size * .95, 1);
        transform.rotation.set((card - 1.5) * .35, yaw, -.19 + card * .15);
        transform.updateMatrix();
        leaves.setMatrixAt(crown * cardsPerCrown + card, transform.matrix);
        leaves.setColorAt(crown * cardsPerCrown + card, color.set(base).lerp(litLeaves, .19 + card * .07).multiplyScalar(tone));
      }
      crown++;
    };
    addCrown(to.x, h * .94, to.z, spread * .58, index, 1.13);
    for (let tip = 0; tip < tipsPerTree; tip++) {
      const angle = index * 1.7 + tip * 2.39996;
      const reach = spread * (.43 + .08 * (tip % 3));
      from.set(x, h * (.42 + .04 * tip), z + .14);
      to.set(x + Math.cos(angle) * reach, h * (.68 + .05 * (tip % 4)), z + Math.sin(angle) * reach);
      addBranch(.097 - .008 * tip);
      addCrown(to.x, to.y, to.z, spread * (.51 + .035 * (tip % 3)), angle, .84 + .063 * tip);
    }
  });
  scene.add(branches, crowns, leaves);
}
