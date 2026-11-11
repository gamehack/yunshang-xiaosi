import { readGuestSave, writeGuestSave } from './persistence/guest-save';
import { buildExterior } from './world/exterior';
import { buildGarden } from './world/garden';
import { WalkController } from './navigation/walk-controller';
import * as THREE from 'three';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
root.innerHTML = '<div id="hud"><strong>半日闲 · M0.4 漫步路线白模</strong><span>电脑：WASD 移动 · 拖动旋转 · 滚轮缩放<br>手机：轻点行走 · 拖动旋转视角</span><span id="metrics">初始化中…</span><button id="seat" type="button" hidden>坐下</button></div><div id="scene"></div>';
const mount = document.querySelector<HTMLDivElement>('#scene')!;
const metrics = document.querySelector<HTMLSpanElement>('#metrics')!;
const seatButton = document.querySelector<HTMLButtonElement>('#seat')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#c9d9d7');
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 300);
camera.position.set(14, 13, 20);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight('#ffffff', '#829185', 2));
const sun = new THREE.DirectionalLight('#fff1d8', 2.5);
sun.position.set(-12, 25, 8);
scene.add(sun);
buildGarden(scene);
buildExterior(scene);
const marker = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.05, 4, 8), new THREE.MeshStandardMaterial({ color: '#617e76' }));
marker.position.set(0, 1, 8);
scene.add(marker);

const walking = new WalkController(marker, camera, renderer);
const saved=readGuestSave();
let seated=false;
const seatSpots=[{x:-8,z:-10,standX:-8,standZ:-6.5},{x:0,z:-97,standX:0,standZ:-94}];
if(saved){marker.position.set(saved.x,1,saved.z);walking.restoreViewState(saved);}
function nearbySeat(){return seatSpots.find(s=>Math.hypot(marker.position.x-s.standX,marker.position.z-s.standZ)<2.4);}
function persist(){const v=walking.getViewState();writeGuestSave({version:1,x:marker.position.x,z:marker.position.z,seated,yaw:v.yaw,pitch:v.pitch,distance:v.distance,savedAt:Date.now()});}
seatButton.addEventListener('click',()=>{
  const spot=nearbySeat();
  if(!spot && !seated)return;
  seated=!seated;
  walking.setSeated(seated);
  marker.scale.y=seated?.72:1;
  persist();
});
const saveInterval=window.setInterval(persist,5000);
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
  const spot=nearbySeat();
  seatButton.hidden=!seated&&!spot;
  seatButton.textContent=seated?'起身':'坐下';
  renderer.render(scene, camera);
  frame++;
  if (now - last >= 1000) {
    metrics.textContent = `FPS ≈ ${Math.round(frame * 1000 / (now - last))} · Draw calls ${renderer.info.render.calls}`;
    last = now;
    frame = 0;
  }
}
raf = requestAnimationFrame(tick);
window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); window.clearInterval(saveInterval); persist(); walking.dispose(); renderer.dispose(); }, { once: true });
