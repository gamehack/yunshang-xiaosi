import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const status = document.querySelector<HTMLElement>('#status')!;
const viewport = document.querySelector<HTMLDivElement>('#viewport')!;
const expectedSize = new THREE.Vector3(2, 1.8, 0.8);
const tolerance = 0.001;

function checkMaterial(object: THREE.Object3D | undefined, name: string, rgb: [number, number, number],
  roughness: number, metalness: number) {
  const material = object instanceof THREE.Mesh ? object.material : undefined;
  const near = (actual: number, expected: number) => Math.abs(actual - expected) < tolerance;
  if (!(material instanceof THREE.MeshStandardMaterial) || material.name !== name
    || !material.color.toArray().every((value, index) => near(value, rgb[index]))
    || !near(material.roughness, roughness) || !near(material.metalness, metalness)) {
    throw new Error(`PBR 材质校验失败（${name}）`);
  }
}

async function showFixture() {
  const url = new URL('./generated/pipeline-fixture.glb', location.href);
  const { scene: model } = await new GLTFLoader().loadAsync(url.href);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  if (size.distanceTo(expectedSize) > tolerance || Math.abs(bounds.min.y) > tolerance) {
    throw new Error('模型尺寸或底面高度不符');
  }

  const body = model.getObjectByName('TestBody');
  const marker = model.getObjectByName('TestFrontMarker');
  checkMaterial(body, 'TestMatte', [0.035, 0.32, 0.31], 0.78, 0);
  checkMaterial(marker, 'TestMetal', [0.82, 0.32, 0.045], 0.32, 0.65);
  const markerPosition = marker!.getWorldPosition(new THREE.Vector3());
  if (markerPosition.distanceTo(new THREE.Vector3(0.6, 1.65, 0.25)) > tolerance) {
    throw new Error('方向标记坐标不符');
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewport.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#242e2c');
  scene.add(model, new THREE.GridHelper(8, 16, '#6d827b', '#3b504a'));
  scene.add(new THREE.HemisphereLight('#f2fcff', '#a08b73', 2.6));
  const key = new THREE.DirectionalLight('#fff3dc', 3);
  key.position.set(3, 6, 4);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  camera.position.set(3.8, 2.9, 5.4);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 0.85, 0);
  orbit.update();
  const render = () => renderer.render(scene, camera);
  orbit.addEventListener('change', render);
  const resize = () => {
    camera.aspect = viewport.clientWidth / Math.max(1, viewport.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  resize();
  if (renderer.info.render.triangles === 0) throw new Error('WebGL 未绘制任何模型三角面');
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    orbit.dispose();
    renderer.dispose();
  }, { once: true });

  const dimensions = size.toArray().map(value => value.toFixed(2)).join(' × ');
  status.textContent = `GLB 已渲染 · X/Y/Z ${dimensions} 米 · Y 向上、+Z 正面 · 两种 PBR 材质通过校验`;
  status.dataset.state = 'ready';
}

void showFixture().catch((error: unknown) => {
  status.dataset.state = 'error';
  status.textContent = '验证失败。请在项目根目录运行 node scripts/blender/export.mjs 后刷新，并查看浏览器控制台。';
  console.error('Blender smoke test failed', error);
});
