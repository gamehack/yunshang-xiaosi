declare const __APP_VERSION__: string;
import { readGuestSave, writeGuestSave } from './persistence/guest-save';
import { nextQuality, qualityPixelRatio, readQuality, writeQuality } from './performance/quality';
import { FrameStats } from './performance/frame-stats';
import { buildExterior } from './world/exterior';
import { buildGarden } from './world/garden';
import { WalkController } from './navigation/walk-controller';
import { AmbientSound } from './audio/ambient';
import { createVisitor, animateVisitor } from './avatar/visitor';
import * as THREE from 'three';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
root.innerHTML = `<div id="hud"><div class="hud-heading"><strong>半日闲 · M${__APP_VERSION__.split('.').slice(0, 2).join('.')} 园林漫游</strong><button id="hud-toggle" type="button" aria-expanded="true" aria-controls="hud-details" aria-label="收起操作面板">收起</button></div><div id="hud-details"><span>电脑：WASD / 方向键移动 · Esc 停止 · 拖动旋转 · 滚轮缩放<br>手机：轻点行走 · 停止行走按钮 · 拖动旋转 · 双指缩放</span><span id="metrics">初始化中…</span><button id="seat" type="button" hidden>坐下</button><button id="reset" type="button">回到入口</button><button id="stop" type="button" aria-label="停止当前自动行走" hidden>停止行走</button><button id="quality" type="button">画质：均衡</button><button id="ambient" type="button" aria-pressed="false">风声：关闭</button></div></div><div id="scene"></div>`;
const mount = document.querySelector<HTMLDivElement>('#scene')!;
const metrics = document.querySelector<HTMLSpanElement>('#metrics')!;
const seatButton = document.querySelector<HTMLButtonElement>('#seat')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!;
const qualityButton = document.querySelector<HTMLButtonElement>('#quality')!;
const ambientButton = document.querySelector<HTMLButtonElement>('#ambient')!;
const ambient = new AmbientSound();
ambientButton.addEventListener('click',async()=>{
  ambientButton.disabled=true;
  try {
    const playing=await ambient.toggle();
    ambientButton.textContent=playing?'风声：开启':'风声：关闭';
    ambientButton.setAttribute('aria-pressed',String(playing));
  } catch {
    ambientButton.textContent='风声不可用';
  } finally { ambientButton.disabled=false; }
});
const hudToggle = document.querySelector<HTMLButtonElement>('#hud-toggle')!;
const hudDetails = document.querySelector<HTMLDivElement>('#hud-details')!;
let hudCollapsed = window.matchMedia('(max-width: 600px)').matches;
function updateHud(){
  hudDetails.hidden=hudCollapsed;
  hudToggle.textContent=hudCollapsed?'展开':'收起';
  hudToggle.setAttribute('aria-expanded',String(!hudCollapsed));
  hudToggle.setAttribute('aria-label',hudCollapsed?'展开操作面板':'收起操作面板');
}
hudToggle.addEventListener('click',()=>{hudCollapsed=!hudCollapsed;updateHud();});
updateHud();
function safeStorage(): Storage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}
let quality = readQuality(safeStorage());
function applyQuality(){
  renderer.setPixelRatio(qualityPixelRatio(quality, window.devicePixelRatio));
  qualityButton.textContent=`画质：${quality}`;
  resize();
}
qualityButton.addEventListener('click',()=>{
  quality=nextQuality(quality);
  writeQuality(quality, safeStorage());
  applyQuality();
});
let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
} catch {
  mount.innerHTML = '<div class="scene-error" role="alert">当前浏览器无法启动 3D 场景。请开启硬件加速，或使用新版 Chrome / Safari。</div>';
  throw new Error('WebGL initialization failed');
}
renderer.setPixelRatio(qualityPixelRatio(quality, window.devicePixelRatio));
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
const waterRipples: Array<{mesh:THREE.Mesh;baseScale:number;phase:number}> = [];
scene.traverse(object=>{
  const ripple=object.userData.waterRipple as {baseScale:number;phase:number}|undefined;
  if(ripple && object instanceof THREE.Mesh)waterRipples.push({mesh:object,baseScale:ripple.baseScale,phase:ripple.phase});
});
const marker = createVisitor();
marker.position.set(0, 1, 8);
scene.add(marker);

const walking = new WalkController(marker, camera, renderer, scene);
stopButton.addEventListener('click',()=>walking.stop());
const saved=readGuestSave();
let seated=false;
const seatSpots=[{x:-8,z:-10,standX:-8,standZ:-6.5},{x:0,z:-97,standX:0,standZ:-94}];
if(saved){
  marker.position.set(saved.x,1,saved.z);
  walking.restoreViewState(saved);
  seated=saved.seated;
  walking.setSeated(seated);
  animateVisitor(marker,0,false,seated);
}
function nearbySeat(){return seatSpots.find(s=>Math.hypot(marker.position.x-s.standX,marker.position.z-s.standZ)<2.4);}
function persist(){const v=walking.getViewState();writeGuestSave({version:1,x:marker.position.x,z:marker.position.z,seated,yaw:v.yaw,pitch:v.pitch,distance:v.distance,savedAt:Date.now()});}
seatButton.addEventListener('click',()=>{
  const spot=nearbySeat();
  if(!spot && !seated)return;
  seated=!seated;
  walking.setSeated(seated);
  animateVisitor(marker,0,false,seated);
  persist();
});
resetButton.addEventListener('click',()=>{
  walking.stop();
  seated=false;
  walking.setSeated(false);
  animateVisitor(marker,0,false,false);
  marker.position.set(0,1,8);
  walking.restoreViewState({yaw:0,pitch:0.43,distance:11});
  persist();
});
const saveInterval=window.setInterval(persist,5000);
const onVisibilityChange=()=>{
  if(document.visibilityState==='hidden'){persist();void ambient.pause();ambientButton.textContent='风声：关闭';ambientButton.setAttribute('aria-pressed','false');}
  previousFrame=0;
  frameStats.clear();
  frame=0;
  last=performance.now();
};
document.addEventListener('visibilitychange',onVisibilityChange);
const clock = new THREE.Clock();
let frame = 0;
let last = performance.now();
const frameStats = new FrameStats(180);
let previousFrame = 0;
let raf = 0;
let contextLost = false;
const onContextLost = (event: Event) => {
  event.preventDefault();
  contextLost = true;
  metrics.textContent = '图形设备暂时不可用，正在等待恢复…';
};
const onContextRestored = () => {
  contextLost = false;
  previousFrame = 0;
  frameStats.clear();
  applyQuality();
};
renderer.domElement.addEventListener('webglcontextlost', onContextLost);
renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
function resize() {
  const width = Math.max(1, mount.clientWidth);
  const height = Math.max(1, mount.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
resize();
applyQuality();
function tick(now: number) {
  raf = requestAnimationFrame(tick);
  if(previousFrame>0){
    const delta=now-previousFrame;
    if(delta>1000){frameStats.clear();frame=0;last=now;}
    else frameStats.record(delta);
  }
  previousFrame=now;
  const dt = Math.min(clock.getDelta(), 0.05);
  if (document.hidden || contextLost) return;
  const oldX=marker.position.x,oldZ=marker.position.z;
  walking.update(dt);
  const dx=marker.position.x-oldX,dz=marker.position.z-oldZ;
  const moving=dx*dx+dz*dz>0.000001;
  if(moving)marker.rotation.y=Math.atan2(-dx,-dz);
  animateVisitor(marker,now*.001,moving,seated);
  // Low-cost, deterministic water motion: no textures or per-frame geometry allocation.
  const t=now*.00045;
  for(const {mesh,baseScale,phase} of waterRipples){
    const cycle=(t+phase)%1;
    mesh.scale.setScalar(baseScale*(.85+.4*cycle));
  }
  const spot=nearbySeat();
  stopButton.hidden=!walking.isMoving;
  seatButton.hidden=!seated&&!spot;
  seatButton.textContent=seated?'起身':'坐下';
  renderer.render(scene, camera);
  frame++;
  if (now - last >= 1000) {
    const stats=frameStats.snapshot();
    metrics.textContent = `FPS ≈ ${Math.round(frame * 1000 / (now - last))} · P95 ${stats.p95Ms.toFixed(1)}ms · Draw calls ${renderer.info.render.calls} · 三角形 ${renderer.info.render.triangles}`;
    last = now;
    frame = 0;
  }
}
raf = requestAnimationFrame(tick);
window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); window.clearInterval(saveInterval); document.removeEventListener('visibilitychange',onVisibilityChange); persist(); walking.dispose(); void ambient.dispose(); renderer.domElement.removeEventListener('webglcontextlost',onContextLost); renderer.domElement.removeEventListener('webglcontextrestored',onContextRestored); renderer.dispose(); }, { once: true });
