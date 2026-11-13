import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { buildGarden } from '../world/garden';
import { PAVILION, TEAHOUSE } from '../world/layout';
import { addBambooGrove } from '../world/bamboo';
import { addCourtyardCanopies, dressCourtyardWalls } from './courtyard-backdrop';
import { addCourtyardPaving, addPondEdge } from './courtyard-details';

function makeWaterNormal() {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x * Math.PI * 2 / size;
      const v = y * Math.PI * 2 / size;
      const offset = (y * size + x) * 4;
      pixels[offset] = 128 + 23 * Math.cos(u + 3 * v) + 12 * Math.sin(2 * u - 5 * v);
      pixels[offset + 1] = 128 + 29 * Math.cos(u + 3 * v) - 18 * Math.sin(2 * u - 5 * v);
      pixels[offset + 2] = 247;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeGroundMap() {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  const sample = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const noise = (x: number, y: number, frequency: number) => {
    const u = x * frequency / size;
    const v = y * frequency / size;
    const i = Math.floor(u);
    const j = Math.floor(v);
    const nextI = (i + 1) % frequency;
    const nextJ = (j + 1) % frequency;
    const fx = THREE.MathUtils.smoothstep(u - i, 0, 1);
    const fy = THREE.MathUtils.smoothstep(v - j, 0, 1);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(sample(i, j), sample(nextI, j), fx),
      THREE.MathUtils.lerp(sample(i, nextJ), sample(nextI, nextJ), fx),
      fy,
    );
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const patch = .72 * noise(x, y, 5) + .28 * noise(x, y, 19);
      const grit = 9 * (sample(x, y) - .5);
      const offset = (y * size + x) * 4;
      pixels[offset] = 122 + 36 * patch + grit;
      pixels[offset + 1] = 131 + 23 * patch + grit;
      pixels[offset + 2] = 98 + 25 * patch + grit;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

async function loadPavilion(loader: GLTFLoader) {
  try {
    const { scene } = await loader.loadAsync('/art-preview/generated/pavilion.glb');
    const bounds = new THREE.Box3().setFromObject(scene);
    const size = bounds.getSize(new THREE.Vector3());
    if (!scene.getObjectByName('PavilionRoof') || !scene.getObjectByName('PavilionTimber')
      || Math.abs(bounds.min.y) > .02 || size.x < 5 || size.x > 5.6
      || size.z < 5 || size.z > 5.4 || size.y < 4 || size.y > 4.5) {
      throw new Error('池亭 GLB 的构件或尺寸不符合预览约定');
    }
    scene.position.set(PAVILION.x, 0, PAVILION.z);
    return scene;
  } catch (error) {
    console.warn('池亭 GLB 未加载，保留原亭子', error);
    return null;
  }
}

function pavilionGroundShade() {
  const size = 48;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = Math.max(Math.abs(2 * x / (size - 1) - 1), Math.abs(2 * y / (size - 1) - 1));
      const alpha = 255 * (1 - THREE.MathUtils.smoothstep(edge, .62, 1));
      pixels.set([255, 255, 255, alpha], (y * size + x) * 4);
    }
  }
  const map = new THREE.DataTexture(pixels, size, size);
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(5.9, 5.4), new THREE.MeshBasicMaterial({
    color: '#333a30', map, opacity: .24, transparent: true, depthWrite: false,
  }));
  shade.rotation.x = -Math.PI / 2;
  shade.position.set(PAVILION.x + .85, .012, PAVILION.z - .60);
  return shade;
}

export async function previewTeahouse(scene: THREE.Scene, garden: ReturnType<typeof buildGarden>,
  renderer: THREE.WebGLRenderer) {
  const loader = new GLTFLoader();
  const [{ scene: asset }, pavilion] = await Promise.all([
    loader.loadAsync('/art-preview/generated/teahouse.glb'),
    loadPavilion(loader),
  ]);
  const bounds = new THREE.Box3().setFromObject(asset);
  if (bounds.isEmpty() || !asset.getObjectByName('TiledRoof') || !asset.getObjectByName('TimberFrame')) {
    throw new Error('茶室 GLB 缺少屋面或木构');
  }
  asset.name = 'BlenderTeahouse';
  asset.position.set(TEAHOUSE.x, 0, TEAHOUSE.z);
  const shadowCasters = new Set(['TiledRoof', 'TimberFrame', 'Rockery']);
  const shadowReceivers = new Set(['Paving', 'Lattice', 'Plaster', 'Furniture', 'TimberFrame', 'Masonry', 'Rafters']);
  for (const part of asset.children) {
    part.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = shadowCasters.has(part.name);
        object.receiveShadow = shadowReceivers.has(part.name);
      }
    });
  }

  // Keep the original invisible meshes as camera raycast proxies.
  for (const visual of [...garden.teahouseVisuals, ...garden.rockeryVisuals, ...garden.centerWalk,
    ...garden.bambooVisuals, garden.bank]) visual.visible = false;
  scene.add(asset);
  if (pavilion) {
    for (const visual of garden.pavilionVisuals) visual.visible = false;
    scene.add(pavilion, pavilionGroundShade());
  }
  addBambooGrove(scene, garden.bambooPositions, true);
  addCourtyardPaving(scene);
  addPondEdge(scene);
  dressCourtyardWalls(scene, garden.wallVisuals);
  addCourtyardCanopies(scene);
  garden.water.color.set('#527d72');
  garden.water.roughness = .36;
  garden.water.normalMap = makeWaterNormal();
  garden.water.normalScale.set(.34, .34);
  garden.ground.material.color.set('#ffffff');
  garden.ground.material.map = makeGroundMap();

  const sun = scene.children.find(object => object instanceof THREE.DirectionalLight);
  const sky = scene.children.find(object => object instanceof THREE.HemisphereLight);
  if (sun && sky) {
    const center = new THREE.Vector3(TEAHOUSE.x + 3, 0, TEAHOUSE.z + 3);
    sun.target.position.copy(center);
    sun.position.copy(center).add(new THREE.Vector3(-11, 12, 7));
    sun.color.set('#fff0d8');
    sun.shadow.camera.left = sun.shadow.camera.bottom = -12;
    sun.shadow.camera.right = sun.shadow.camera.top = 12;
    sun.shadow.camera.far = 45;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.normalBias = .035;
    sun.shadow.autoUpdate = false;
    sun.shadow.needsUpdate = true;
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      sun.shadow.needsUpdate = true;
    });
    sun.castShadow = true;
    sky.color.set('#e9f1ff');
    sky.groundColor.set('#ad9c84');
    sky.intensity = 1.28;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene.add(sun.target);
    garden.ground.receiveShadow = true;
  }
  return pavilion ? 'loaded' : 'fallback';
}
