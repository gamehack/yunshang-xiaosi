import * as THREE from 'three';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
root.innerHTML = '<div id="hud"><strong>半日闲 · M0.1</strong><span>工程骨架 / 渲染基线</span><span id="metrics">初始化中…</span></div><div id="scene"></div>';
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
const ground = new THREE.Mesh(new THREE.PlaneGeometry(42, 36), new THREE.MeshStandardMaterial({ color: '#aeb9a0', roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 31), new THREE.MeshStandardMaterial({ color: '#cfc1a5', roughness: 1 }));
path.rotation.x = -Math.PI / 2;
path.position.y = 0.015;
scene.add(path);
const pond = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshStandardMaterial({ color: '#719f9d', roughness: 0.55, metalness: 0.05 }));
pond.rotation.x = -Math.PI / 2;
pond.scale.set(1.35, 0.72, 1);
pond.position.set(9, 0.025, 0);
scene.add(pond);
const stoneMaterial = new THREE.MeshStandardMaterial({ color: '#e6e3d9', roughness: 1 });
const roofMaterial = new THREE.MeshStandardMaterial({ color: '#555d5a', roughness: 1 });
function box(w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
}
box(8, 3.5, 5, -8, 1.75, -10, stoneMaterial);
box(9, 0.5, 6, -8, 3.8, -10, roofMaterial);
box(2.4, 3, 1, 0, 1.5, 14, stoneMaterial);
const marker = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.05, 4, 8), new THREE.MeshStandardMaterial({ color: '#617e76' }));
marker.position.set(0, 1, 8);
scene.add(marker);

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
  renderer.render(scene, camera);
  frame++;
  if (now - last >= 1000) {
    metrics.textContent = `FPS ≈ ${Math.round(frame * 1000 / (now - last))} · Draw calls ${renderer.info.render.calls}`;
    last = now;
    frame = 0;
  }
}
raf = requestAnimationFrame(tick);
window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); renderer.dispose(); }, { once: true });
