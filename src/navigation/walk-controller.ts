import * as THREE from 'three';

type Cell = { x: number; z: number };
const STEP = 1;
const HALF_X = 20;
const HALF_Z = 17;
const KEY = (c: Cell) => c.x + ',' + c.z;
const blocked = (x: number, z: number): boolean =>
  Math.abs(x) > HALF_X || Math.abs(z) > HALF_Z ||
  (((x-9)/8.3)**2 + (z/5.2)**2 < 1) || // main pond
  (((x-7)/3.5)**2 + ((z+4)/3.1)**2 < 1) || // northern bay
  (x > -12 && x < -4 && z > -12.5 && z < -7.5); // teahouse interior, pending doorway/NavMesh

export function isWalkable(x: number, z: number): boolean {
  const radius = 0.48;
  return ![[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius],[0,0]]
    .some(([dx,dz]) => blocked(x+dx,z+dz));
}
function toCell(v: THREE.Vector3): Cell { return { x: Math.round(v.x / STEP), z: Math.round(v.z / STEP) }; }
function center(c: Cell): THREE.Vector3 { return new THREE.Vector3(c.x*STEP,0,c.z*STEP); }
export function findPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  const start = toCell(from), goal = toCell(to);
  if (!isWalkable(goal.x,goal.z)) return [];
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
  private route: THREE.Vector3[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private ground = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  private target = new THREE.Vector3();
  private readonly onDown = (e: KeyboardEvent) => { this.keys.add(e.key.toLowerCase()); };
  private readonly onUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };
  private readonly onClick = (e: PointerEvent) => {
    if(e.button!==0 || e.target!==this.renderer.domElement) return;
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    if(this.raycaster.ray.intersectPlane(this.ground,this.target)) {
      this.route=findPath(this.avatar.position,this.target);
    }
  };
  constructor(private avatar: THREE.Object3D, private camera: THREE.PerspectiveCamera, private renderer: THREE.WebGLRenderer) {
    window.addEventListener('keydown',this.onDown);
    window.addEventListener('keyup',this.onUp);
    renderer.domElement.addEventListener('pointerup',this.onClick);
  }
  update(dt: number) {
    const dx=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
    const dz=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
    const manual=new THREE.Vector3(dx,0,dz);
    const speed=3.3;
    if(manual.lengthSq()>0) {
      this.route=[];
      manual.normalize().multiplyScalar(speed*dt);
      this.move(manual);
    } else if(this.route.length) {
      const target=this.route[0];
      const delta=target.clone().sub(this.avatar.position);delta.y=0;
      if(delta.length()<0.12) this.route.shift();
      else this.move(delta.normalize().multiplyScalar(Math.min(speed*dt,delta.length())));
    }
    const desired=this.avatar.position.clone().add(new THREE.Vector3(0,8,13));
    this.camera.position.lerp(desired,Math.min(1,dt*5));
    this.camera.lookAt(this.avatar.position.x,this.avatar.position.y+0.9,this.avatar.position.z);
  }
  private move(delta: THREE.Vector3) {
    const p=this.avatar.position;
    if(isWalkable(p.x+delta.x,p.z)) p.x+=delta.x;
    if(isWalkable(p.x,p.z+delta.z)) p.z+=delta.z;
  }
  dispose() {
    window.removeEventListener('keydown',this.onDown);
    window.removeEventListener('keyup',this.onUp);
    this.renderer.domElement.removeEventListener('pointerup',this.onClick);
  }
}
