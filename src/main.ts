import { buildGarden } from './world/garden';
import { WalkController } from './navigation/walk-controller';
import * as THREE from 'three';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
root.innerHTML = '<div id="hud"><strong>半日闲 · M0.3 白模</strong><span>WASD / 方向键移动 · 点击地面寻路（网格原型）</span><span id="metrics">初始化中…</span></div><div id="scene"></div>';
const mount = document.querySelector<HTMLDivElement>('#scene')!;
const metrics = document.querySelector<HTMLSpanElement>('#metrics')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#c9d9d7');
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
camera.position.set(14, 13, 20);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight('#ffffff', '#829185', 2));
const sun = new THREE.DirectionalLight('#fff1d8', 2.5);
sun.position.set(-12, 25, 8);
scene.add(sun);
buildGarden(scene);
const marker = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.05, 4, 8), new THREE.MeshStandardMaterial({ color: '#617e76' }));
marker.position.set(0, 1, 8);
scene.add(marker);

const walking = new WalkController(marker, camera, renderer);
const clock = new THREE.Clock();
let frame = 0;
let last = performance.now();
let raf = 0;
function resize() {
  const width = Math.max(1, mount.clientWidth);
  const height = Math.max(1, mount.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
resize();
function tick(now: number) {
  raf = requestAnimationFrame(tick);
  walking.update(Math.min(clock.getDelta(), 0.05));
  renderer.render(scene, camera);
  frame++;
  if (now - last >= 1000) {
    metrics.textContent = `FPS ≈ ${Math.round(frame * 1000 / (now - last))} · Draw calls ${renderer.info.render.calls}`;
    last = now;
    frame = 0;
  }
}
raf = requestAnimationFrame(tick);
window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); walking.dispose(); renderer.dispose(); }, { once: true });
