import * as THREE from 'three';
import {SEATS} from './seats';
import {shouldHandleMovementKey,shouldStopWalking} from './keyboard';

import { BRIDGE, EXTERIOR, GARDEN, GATE_COLUMNS, NAVIGATION, PONDS, TEAHOUSE, WALLS, SEAT_GEOMETRY, type Footprint } from '../world/layout';

type Cell = { x: number; z: number };
const STEP = NAVIGATION.step;
const KEY = (c: Cell) => c.x + ',' + c.z;
const obstacles: readonly Footprint[] = [
  ...WALLS, ...GATE_COLUMNS, TEAHOUSE.table, TEAHOUSE.rearWall,
  ...SEATS.map((seat,i)=>({x:seat.x,z:seat.z,width:i===0?SEAT_GEOMETRY.tea.width:SEAT_GEOMETRY.lake.width,depth:i===0?SEAT_GEOMETRY.tea.depth:SEAT_GEOMETRY.lake.depth})),
  ...TEAHOUSE.postXs.flatMap(x=>TEAHOUSE.postZs.map(z=>({x,z,width:TEAHOUSE.postWidth,depth:TEAHOUSE.postWidth})))
];
const onBridge=(x:number,z:number)=>x>=BRIDGE.minX&&x<=BRIDGE.maxX&&Math.abs(z-BRIDGE.z)<=BRIDGE.walkWidth/2;
const outsideGround=(x:number,z:number)=>
  Math.abs(x)>GARDEN.halfWalkWidth || z<EXTERIOR.minZ || z>GARDEN.southLimitZ ||
  (z<GARDEN.northExitZ && z>EXTERIOR.trailEndZ && Math.abs(x)>EXTERIOR.trailHalfWidth) ||
  (z<=EXTERIOR.trailEndZ && Math.hypot(x-EXTERIOR.lookout.x,z-EXTERIOR.lookout.z)>EXTERIOR.lookout.radius*Math.cos(Math.PI/16));

export function isWalkable(x: number, z: number): boolean {
  if(!Number.isFinite(x) || !Number.isFinite(z))return false;
  const radius=NAVIGATION.radius;
  // Test the complete visitor footprint against thin walls and support posts.
  if(obstacles.some(o=>Math.abs(x-o.x)<o.width/2+radius && Math.abs(z-o.z)<o.depth/2+radius))return false;
  return ![[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius],[0,0]]
    .some(([dx,dz])=>{
      const px=x+dx,pz=z+dz;
      return outsideGround(px,pz) || (!onBridge(px,pz) && PONDS.some(p=>((px-p.x)/p.radiusX)**2+((pz-p.z)/p.radiusZ)**2<1));
    });
}
function safeSegment(from: THREE.Vector3, to: THREE.Vector3): boolean {
  const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/NAVIGATION.segmentStep));
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    if(!isWalkable(from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t))return false;
  }
  return true;
}
function toCell(v: THREE.Vector3): Cell { return { x: Math.round(v.x / STEP), z: Math.round(v.z / STEP) }; }
function center(c: Cell): THREE.Vector3 { return new THREE.Vector3(c.x*STEP,0,c.z*STEP); }
export function findPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  if(![from.x,from.y,from.z,to.x,to.y,to.z].every(Number.isFinite) ||
    !isWalkable(from.x,from.z) || !isWalkable(to.x,to.z))return [];
  const start = toCell(from), goal = toCell(to);
  if (!isWalkable(start.x,start.z) || !isWalkable(goal.x,goal.z)) return [];
  if(!safeSegment(from,center(start)) || !safeSegment(center(goal),to))return [];
  if(from.x===to.x && from.z===to.z)return [];
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
      route.reverse();
      const startCenter=center(start);
      if(from.x!==startCenter.x || from.z!==startCenter.z)route.unshift(startCenter);
      const destination=new THREE.Vector3(to.x,0,to.z);
      if(!route.length || !route[route.length-1].equals(destination))route.push(destination);
      return route;
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const next={x:current.x+dx,z:current.z+dz};
      if(!isWalkable(next.x,next.z) || !safeSegment(center(current),center(next))) continue;
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
  stop(): void {
    this.route=[];this.keys.clear();this.pointerStart=null;
    this.activePointers.clear();this.pinchDistance=null;
  }
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
    if(this.seated)return;
    this.route=[];this.pointerStart=null;
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
    if(p.dragged || e.type==='pointercancel' || this.seated || this.activePointers.size>0)return;
    const rect=this.renderer.domElement.getBoundingClientRect();
    if(rect.width<=0 || rect.height<=0)return;
    this.pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    if(this.raycaster.ray.intersectPlane(this.ground,this.target)){
      const next=findPath(this.avatar.position,this.target);
      // Invalid targets must not unexpectedly cancel an existing route.
      if(next.length || (isWalkable(this.target.x,this.target.z) &&
        Math.hypot(this.avatar.position.x-this.target.x,this.avatar.position.z-this.target.z)<.001))this.route=next;
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
    if(!Number.isFinite(dt) || dt<0)return;
    dt=Math.min(dt,.1);
    const position=this.avatar.position;
    if(![position.x,position.y,position.z].every(Number.isFinite) ||
      (!this.seated && !isWalkable(position.x,position.z))){
      this.stop();
      position.set(NAVIGATION.entry.x,NAVIGATION.entry.y,NAVIGATION.entry.z);
    }
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
      const remaining=delta.length();
      if(remaining<=speed*dt){
        this.move(delta);
        if(Math.hypot(target.x-position.x,target.z-position.z)<.001)this.route.shift();
        else this.route=[];
      }else this.move(delta.multiplyScalar(speed*dt/remaining));
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
      // Each 9m spatial batch owns its leaf material; only the nearby batch fades.
      const opacity=THREE.MathUtils.smoothstep(proximity,0,this.foliageFadeDistance);
      const transparent=opacity<.995;
      // Changing transparency changes shader variants; only flag recompilation on transitions.
      if(material.transparent!==transparent){
        material.transparent=transparent;
        material.depthWrite=!transparent;
        material.needsUpdate=true;
      }
      material.opacity=Math.max(.18,opacity);
    }
  }
  private move(delta: THREE.Vector3) {
    const p=this.avatar.position;
    if(![delta.x,delta.z].every(Number.isFinite))return;
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(delta.x),Math.abs(delta.z))/NAVIGATION.segmentStep));
    const dx=delta.x/steps,dz=delta.z/steps;
    for(let i=0;i<steps;i++){
      if(isWalkable(p.x+dx,p.z))p.x+=dx;
      if(isWalkable(p.x,p.z+dz))p.z+=dz;
    }
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
