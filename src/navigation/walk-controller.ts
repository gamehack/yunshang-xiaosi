import * as THREE from 'three';
import {shouldHandleMovementKey,shouldStopWalking} from './keyboard';

type Cell = { x: number; z: number };
const STEP = 1;
const HALF_X = 20;
const MIN_Z = -101;
const MAX_Z = 17;
const walls = [
  [-20.5,-10,.35,12],[-20.5,10,.35,12],[20.5,-10,.35,12],[20.5,10,.35,12],
  [-12,-16.5,16,.35],[12,-16.5,16,.35],[-12,16.5,16,.35],[12,16.5,16,.35],
  [-2.7,15.6,1.1,.7],[2.7,15.6,1.1,.7]
] as const;
const KEY = (c: Cell) => c.x + ',' + c.z;
// Bridge deck has collision priority over the pond surface, not over walls.
const onBridge=(x:number,z:number)=>x>=1.1&&x<=17.9&&z>=1.1&&z<=2.9;
const blocked = (x: number, z: number): boolean =>
  Math.abs(x) > HALF_X || z < MIN_Z || z > MAX_Z ||
  (z < -17 && Math.abs(x) > 2.1 && z > -90) ||
  (z <= -90 && Math.abs(x) > 5.5) ||
  (!onBridge(x,z) && (((x-9)/8.3)**2 + (z/5.2)**2 < 1)) || // main pond
  (!onBridge(x,z) && (((x-7)/3.5)**2 + ((z+4)/3.1)**2 < 1)) || // northern bay
  // The tea table is a solid obstacle, while the eastern frontage stays open.
  (Math.abs(x+8)<.6 && Math.abs(z+10)<.6) ||
  // Teahouse has open east frontage; block only its rear wall and support posts.
  (x > -12 && x < -4 && z > -12.6 && z < -12.25) ||
  ([-11.7,-4.3].some(cx=>[-12.2,-7.8].some(cz=>Math.abs(x-cx)<.13&&Math.abs(z-cz)<.13))) ||
  walls.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2 && Math.abs(z-cz)<d/2);

export function isWalkable(x: number, z: number): boolean {
  const radius = 0.48;
  return ![[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius],[0,0]]
    .some(([dx,dz]) => blocked(x+dx,z+dz));
}
function toCell(v: THREE.Vector3): Cell { return { x: Math.round(v.x / STEP), z: Math.round(v.z / STEP) }; }
function center(c: Cell): THREE.Vector3 { return new THREE.Vector3(c.x*STEP,0,c.z*STEP); }
export function findPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  const start = toCell(from), goal = toCell(to);
  if (!isWalkable(start.x,start.z) || !isWalkable(goal.x,goal.z)) return [];
  const open: Cell[] = [start];
  const visited = new Set<string>();
  const cost = new Map<string,number>([[KEY(start),0]]);
  const parent = new Map<string,string>();
  const nodes = new Map<string,Cell>([[KEY(start),start]]);
  const heuristic = (c: Cell) => Math.abs(c.x-goal.x)+Math.abs(c.z-goal.z);
  while(open.length) {
    open.sort((a,b)=>(cost.get(KEY(a))!+heuristic(a))-(cost.get(KEY(b))!+heuristic(b)));
    const current = open.shift()!;
    const id = KEY(current);
    if(visited.has(id)) continue;
    visited.add(id);
    if(id===KEY(goal)) {
      const route: THREE.Vector3[] = [];
      let at=id;
      while(at!==KEY(start)) {
        route.push(center(nodes.get(at)!));
        at=parent.get(at)!;
      }
      return route.reverse();
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const next={x:current.x+dx,z:current.z+dz};
      if(!isWalkable(next.x,next.z)) continue;
      const nid=KEY(next), candidate=cost.get(id)!+1;
      if(candidate<(cost.get(nid)??Infinity)) {
        cost.set(nid,candidate); parent.set(nid,id);nodes.set(nid,next);open.push(next);
      }
    }
  }
  return [];
}

export class WalkController {
  private keys = new Set<string>();
  private seated = false;
  setSeated(value: boolean) { this.seated = value; this.stop(); }
  getViewState() { return { yaw:this.yaw, pitch:this.pitch, distance:this.distance }; }
  restoreViewState(v:{yaw:number;pitch:number;distance:number}) {
    if(Number.isFinite(v.yaw)) this.yaw=v.yaw;
    if(Number.isFinite(v.pitch)) this.pitch=THREE.MathUtils.clamp(v.pitch,.12,1.1);
    if(Number.isFinite(v.distance)) this.distance=THREE.MathUtils.clamp(v.distance,5,19);
  }
  private route: THREE.Vector3[] = [];
  get isMoving(): boolean { return this.route.length > 0; }
  stop(): void { this.route = []; this.keys.clear(); }
  private raycaster = new THREE.Raycaster();
  private cameraRaycaster = new THREE.Raycaster();
  private cameraOccluders: THREE.Object3D[] = [];
  private foliage: THREE.InstancedMesh[] = [];
  private readonly foliageFadeDistance = 3.2;
  private pointer = new THREE.Vector2();
  private ground = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  private target = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0.43;
  private distance = 11;
  private pointerStart: {id:number;x:number;y:number;lastX:number;lastY:number;dragged:boolean}|null = null;
  private keyboardOptions(e: KeyboardEvent) {
    return {altKey:e.altKey,ctrlKey:e.ctrlKey,metaKey:e.metaKey,
      inControl:e.target instanceof HTMLElement && e.target.closest('button, input, textarea, select, [contenteditable="true"]') !== null};
  }
  private readonly onDown = (e: KeyboardEvent) => {
    const options=this.keyboardOptions(e);
    if(shouldStopWalking(e.key,options)){this.stop();return;}
    if(!shouldHandleMovementKey(e.key,options))return;
    if(e.key.startsWith('Arrow'))e.preventDefault();
    this.keys.add(e.key.toLowerCase());
  };
  private readonly onUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };
  private readonly onBlur = () => { this.stop(); this.pointerStart=null; this.activePointers.clear(); this.pinchDistance=null; };
  private activePointers = new Map<number,{x:number;y:number}>();
  private pinchDistance: number | null = null;
  private readonly onPointerDown = (e: PointerEvent) => {
    if(e.target!==this.renderer.domElement || (e.pointerType==='mouse' && e.button!==0)) return;
    this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.activePointers.size===1)this.pointerStart={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,dragged:false};
    else {this.pointerStart=null;this.pinchDistance=null;}
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };
  private readonly onPointerMove = (e: PointerEvent) => {
    if(this.activePointers.has(e.pointerId))this.activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.activePointers.size===2){
      const [a,b]=[...this.activePointers.values()];
      const d=Math.hypot(a.x-b.x,a.y-b.y);
      if(this.pinchDistance!==null)this.distance=THREE.MathUtils.clamp(this.distance*this.pinchDistance/Math.max(1,d),5,19);
      this.pinchDistance=d;
      return;
    }
    const p=this.pointerStart;
    if(!p || p.id!==e.pointerId)return;
    const dx=e.clientX-p.lastX,dy=e.clientY-p.lastY;
    if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)p.dragged=true;
    if(p.dragged){
      this.yaw-=dx*.006;
      this.pitch=THREE.MathUtils.clamp(this.pitch+dy*.004,0.12,1.1);
    }
    p.lastX=e.clientX;p.lastY=e.clientY;
  };
  private readonly onPointerUp = (e: PointerEvent) => {
    const p=this.pointerStart;
    this.activePointers.delete(e.pointerId);
    if(this.activePointers.size<2)this.pinchDistance=null;
    if(this.renderer.domElement.hasPointerCapture(e.pointerId))this.renderer.domElement.releasePointerCapture(e.pointerId);
    if(!p || p.id!==e.pointerId)return;
    this.pointerStart=null;
    if(p.dragged || e.type==='pointercancel' || this.seated)return;
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    if(this.raycaster.ray.intersectPlane(this.ground,this.target)){
      this.route=findPath(this.avatar.position,this.target);
    }
  };
  private readonly onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.distance=THREE.MathUtils.clamp(this.distance+Math.sign(e.deltaY)*.8,5,19);
  };
  constructor(private avatar: THREE.Object3D, private camera: THREE.PerspectiveCamera, private renderer: THREE.WebGLRenderer, scene?: THREE.Scene) {
    if(scene)scene.traverse(o=>{
      if(o.userData.cameraOccluder)this.cameraOccluders.push(o);
      if(o instanceof THREE.InstancedMesh && o.userData.cameraFoliage)this.foliage.push(o);
    });
    window.addEventListener('keydown',this.onDown);
    window.addEventListener('keyup',this.onUp);
    window.addEventListener('blur',this.onBlur);
    const canvas=renderer.domElement;
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',this.onPointerDown);
    canvas.addEventListener('pointermove',this.onPointerMove);
    canvas.addEventListener('pointerup',this.onPointerUp);
    canvas.addEventListener('pointercancel',this.onPointerUp);
    canvas.addEventListener('wheel',this.onWheel,{passive:false});
  }
  update(dt: number) {
    const dx=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
    const dz=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
    const speed=3.3;
    const manual=new THREE.Vector3(dx,0,dz);
    if(this.seated) { this.route=[]; }
    else if(manual.lengthSq()>0){
      this.route=[];
      manual.normalize();
      const forward=new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw));
      const right=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
      this.move(right.multiplyScalar(manual.x*speed*dt).addScaledVector(forward,-manual.z*speed*dt));
    } else if(this.route.length){
      const target=this.route[0],delta=target.clone().sub(this.avatar.position);delta.y=0;
      if(delta.length()<0.14)this.route.shift();
      else this.move(delta.normalize().multiplyScalar(Math.min(speed*dt,delta.length())));
    }
    const offset=new THREE.Vector3(
      Math.sin(this.yaw)*Math.cos(this.pitch)*this.distance,
      Math.sin(this.pitch)*this.distance+1.1,
      Math.cos(this.yaw)*Math.cos(this.pitch)*this.distance
    );
    const focus=this.avatar.position.clone().add(new THREE.Vector3(0,.8,0));
    const desired=this.avatar.position.clone().add(offset);
    const direction=desired.clone().sub(focus);
    const fullDistance=direction.length();
    if(fullDistance>0 && this.cameraOccluders.length){
      this.cameraRaycaster.set(focus,direction.normalize());
      this.cameraRaycaster.near=.1;
      this.cameraRaycaster.far=fullDistance;
      const hit=this.cameraRaycaster.intersectObjects(this.cameraOccluders,false)[0];
      if(hit){
        const safeDistance=Math.max(.65,hit.distance-.35);
        desired.copy(focus).addScaledVector(direction,safeDistance);
      }
    }
    // Snap inward to avoid passing through a wall during interpolation; ease outward.
    const inward=desired.distanceTo(focus)<this.camera.position.distanceTo(focus);
    this.camera.position.lerp(desired,inward?1:Math.min(1,dt*7));
    this.camera.lookAt(focus);
    // Fade nearby bamboo leaves only when the camera approaches their grove.
    // Materials are unique to each grove and not shared with structural geometry.
    for(const grove of this.foliage){
      const material=grove.material;
      if(!(material instanceof THREE.MeshStandardMaterial))continue;
      const center=grove.userData.groveCenter as THREE.Vector3 | undefined;
      const radius=grove.userData.groveRadius as number | undefined;
      if(!center || radius===undefined)continue;
      const horizontal=Math.hypot(this.camera.position.x-center.x,this.camera.position.z-center.z);
      const proximity=Math.max(0,horizontal-radius);
      // Large groves share one material, so fading them would erase the whole forest.
      const opacity=radius>8?1:THREE.MathUtils.smoothstep(proximity,0,this.foliageFadeDistance);
      material.transparent=opacity<.995;
      material.opacity=Math.max(.18,opacity);
      material.depthWrite=opacity>=.995;
    }
  }
  private move(delta: THREE.Vector3) {
    const p=this.avatar.position;
    if(isWalkable(p.x+delta.x,p.z))p.x+=delta.x;
    if(isWalkable(p.x,p.z+delta.z))p.z+=delta.z;
  }
  dispose(){
    window.removeEventListener('keydown',this.onDown);
    window.removeEventListener('keyup',this.onUp);
    window.removeEventListener('blur',this.onBlur);
    this.activePointers.clear();
    const canvas=this.renderer.domElement;
    canvas.removeEventListener('pointerdown',this.onPointerDown);
    canvas.removeEventListener('pointermove',this.onPointerMove);
    canvas.removeEventListener('pointerup',this.onPointerUp);
    canvas.removeEventListener('pointercancel',this.onPointerUp);
    canvas.removeEventListener('wheel',this.onWheel);
  }
}
