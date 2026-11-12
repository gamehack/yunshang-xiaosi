import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { buildGarden } from '../world/garden';
import { TEAHOUSE } from '../world/layout';
import { addBambooGrove } from '../world/bamboo';
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

export async function previewTeahouse(scene: THREE.Scene, garden: ReturnType<typeof buildGarden>,
  renderer: THREE.WebGLRenderer) {
  const { scene: asset } = await new GLTFLoader().loadAsync('/dev/art-preview/generated/teahouse.glb');
  const bounds = new THREE.Box3().setFromObject(asset);
  if (bounds.isEmpty() || !asset.getObjectByName('TiledRoof') || !asset.getObjectByName('TimberFrame')) {
    throw new Error('茶室 GLB 缺少屋面或木构');
  }
  asset.name = 'BlenderTeahouse';
  asset.position.set(TEAHOUSE.x, 0, TEAHOUSE.z);
  const shadowCasters = new Set(['TiledRoof', 'TimberFrame', 'Rockery']);
  const shadowReceivers = new Set(['Paving', 'Lattice', 'Plaster', 'Furniture']);
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
  addBambooGrove(scene, garden.bambooPositions, true);
  addCourtyardPaving(scene);
  addPondEdge(scene);
  garden.water.color.set('#527d72');
  garden.water.roughness = 0.29;
  garden.water.normalMap = makeWaterNormal();
  garden.water.normalScale.set(.45, .45);
  garden.ground.material.color.set('#ffffff');
  garden.ground.material.map = makeGroundMap();

  const sun = scene.children.find(object => object instanceof THREE.DirectionalLight);
  const sky = scene.children.find(object => object instanceof THREE.HemisphereLight);
  if (sun && sky) {
    const center = new THREE.Vector3(TEAHOUSE.x + 3, 0, TEAHOUSE.z + 3);
    sun.target.position.copy(center);
    sun.position.copy(center).add(new THREE.Vector3(-9, 17, 8));
    sun.shadow.camera.left = sun.shadow.camera.bottom = -14;
    sun.shadow.camera.right = sun.shadow.camera.top = 14;
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
    sky.intensity = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene.add(sun.target);
    garden.ground.receiveShadow = true;
  }
}
