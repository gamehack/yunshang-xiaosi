import * as THREE from 'three';
import { addBambooGrove } from './bamboo';

/** M0.3 conceptual whitebox: garden footprint 42 x 36m, not the final 70 x 55m plan. */
export function buildGarden(scene: THREE.Scene): void {
  const white = new THREE.MeshStandardMaterial({color:'#e9e7df',roughness:1});
  const roof = new THREE.MeshStandardMaterial({color:'#4e5653',roughness:1});
  const stone = new THREE.MeshStandardMaterial({color:'#c7bda9',roughness:1});
  const timber = new THREE.MeshStandardMaterial({color:'#765d48',roughness:1});
  const water = new THREE.MeshStandardMaterial({color:'#729f9b',roughness:0.45,metalness:.04});
  const waterHighlight=new THREE.MeshBasicMaterial({color:'#b7d5c7',transparent:true,opacity:.38,depthWrite:false});
  const earth = new THREE.MeshStandardMaterial({color:'#b3bea7',roughness:1});
  const paving=new THREE.MeshStandardMaterial({color:'#d5cbb8',roughness:1});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(42,36),earth);
  floor.rotation.x=-Math.PI/2;scene.add(floor);
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o;
  };
  const walk=(x:number,z:number,w:number,d:number)=>box(w,.035,d,x,.025,z,stone);
  // South entrance and the three court sequence; routes are deliberately open for M0 grid navigation.
  walk(0,12,3.5,12);walk(0,1,3.5,12);walk(0,-11,3.5,10);
  walk(-12,0,2.5,27);walk(18,0,2.5,27);
  walk(-6,-14,13,2.6);walk(7,-14,15,2.6);
  walk(-6,11,13,2);walk(7,11,15,2);
  // Inset paving stones break up the uninterrupted walkway without altering collisions.
  const tile=new THREE.BoxGeometry(.88,.018,.72);
  const stones=new THREE.InstancedMesh(tile,paving,48);
  const tileMatrix=new THREE.Matrix4();
  for(let i=0;i<48;i++){
    const col=i%2,row=Math.floor(i/2);
    const offset=(row%3-1)*.14;
    tileMatrix.makeRotationY(((row*7+col*3)%5-2)*.035);
    tileMatrix.setPosition(-.54+col*1.08+offset,.055,15-row*1.18+(col%2)*.09);
    stones.setMatrixAt(i,tileMatrix);
  }
  stones.instanceMatrix.needsUpdate=true;scene.add(stones);
  // White walls with gaps; these are visual-only until mesh-derived collision is implemented.
  for(const z of [-16.5,16.5]){
    box(16,2.8,.35,-12,1.4,z,white);box(16,2.8,.35,12,1.4,z,white);
    box(16,.22,.75,-12,2.9,z,roof);box(16,.22,.75,12,2.9,z,roof);
  }
  for(const x of [-20.5,20.5]){
    box(.35,2.8,12,x,1.4,-10,white);box(.35,2.8,12,x,1.4,10,white);
    box(.75,.22,12,x,2.9,-10,roof);box(.75,.22,12,x,2.9,10,roof);
  }
  // Garden gate and the named entrance lintel.
  box(1.1,3.1,.7,-2.7,1.55,15.6,white);box(1.1,3.1,.7,2.7,1.55,15.6,white);
  box(6.6,.55,1.4,0,3.3,15.6,roof);box(4.2,.6,.15,0,2.75,15.15,timber);
  // Teahouse in north-west, with open doorway facing central garden.
  box(8,.25,5,-8,.12,-10,stone);
  for(const x of [-11.7,-4.3])for(const z of [-12.2,-7.8])box(.26,3,.26,x,1.6,z,timber);
  box(9,.48,6,-8,3.35,-10,roof);
  // Layered eaves and ridge hint at a Suzhou-style roof while retaining low geometry cost.
  box(9.6,.16,6.6,-8,3.1,-10,roof);
  box(9.1,.18,.26,-8,3.68,-10,roof);
  // Two shallow sloping roof planes with a visible ridge; purely decorative.
  const roofPlane=new THREE.BoxGeometry(4.8,.13,6.7);
  for(const side of [-1,1]){
    const slope=new THREE.Mesh(roofPlane,roof);
    slope.rotation.z=side*.19;
    slope.position.set(-8+side*2.35,3.68,-10);
    scene.add(slope);
  }
  // Front facade retains the original doorway and adds fine lattice bays.
  for(const x of [-11.4,-10.8,-5.2,-4.6])box(.065,1.35,.08,x,1.55,-12.43,timber);
  const lattice=new THREE.MeshStandardMaterial({color:'#92765b',roughness:1});
  for(const x of [-11.2,-10.3,-9.4,-8.5,-7.6,-6.7,-5.8])box(.055,1.65,.07,x,1.65,-12.35,lattice);
  box(6.6,.065,.08,-8,2.45,-12.35,lattice);
  box(6.6,.065,.08,-8,1.45,-12.35,lattice);
  box(5,2.4,.2,-8,1.45,-12.5,white);
  box(1.2,.8,1.2,-8,.55,-10,timber);
  // Central winding pond with two bays; shore is approximate, no bridge crossing in this iteration.
  const pond=new THREE.Mesh(new THREE.CircleGeometry(1,64),water);
  pond.rotation.x=-Math.PI/2;pond.scale.set(8.3,5.2,1);pond.position.set(9,.045,0);scene.add(pond);
  const bay=new THREE.Mesh(new THREE.CircleGeometry(1,48),water);
  bay.rotation.x=-Math.PI/2;bay.scale.set(3.5,3.1,1);bay.position.set(7,.046,-4);scene.add(bay);
  // Irregular shoreline stones stay decorative and outside the existing path/collision logic.
  const bankStone=new THREE.MeshStandardMaterial({color:'#a6a99b',roughness:1,flatShading:true});
  const bankGeometry=new THREE.DodecahedronGeometry(1,0);
  const bank=new THREE.InstancedMesh(bankGeometry,bankStone,24);
  const bankMatrix=new THREE.Matrix4();
  const bankTransform=new THREE.Object3D();
  for(let i=0;i<24;i++){
    const a=i*Math.PI*2/24;
    bankTransform.position.set(9+Math.cos(a)*8.4,.02,Math.sin(a)*5.35);
    bankTransform.rotation.set(0,a,0);
    bankTransform.scale.set(.35+(i%3)*.08,.13,.24+(i%4)*.04);
    bankTransform.updateMatrix();bank.setMatrixAt(i,bankTransform.matrix);
  }
  bank.instanceMatrix.needsUpdate=true;scene.add(bank);
  // Thin static ripples are decorative and do not alter pond collision boundaries.
  const rippleGeometry=new THREE.RingGeometry(.52,.55,32);
  for(const [x,z,s] of [[5,-1,1],[11,-2,1.35],[13,3,.85],[6,-4,.6]]){
    const ripple=new THREE.Mesh(rippleGeometry,waterHighlight);
    ripple.rotation.x=-Math.PI/2;ripple.position.set(x,.065,z);ripple.scale.setScalar(s);scene.add(ripple);
  }
  // M0.6 low crossing over the pond at z=2, with a clear 1.8m walking deck.
  const bridgeWood=new THREE.MeshStandardMaterial({color:'#9b8062',roughness:1});
  const plankPositions: number[] = [];
  for(let x=1.5;x<=17.5;x+=.65)plankPositions.push(x);
  const plankGeometry=new THREE.BoxGeometry(.58,.12,1.9);
  const planks=new THREE.InstancedMesh(plankGeometry,bridgeWood,plankPositions.length);
  const transform=new THREE.Object3D();
  plankPositions.forEach((x,i)=>{transform.position.set(x,.12,2);transform.updateMatrix();planks.setMatrixAt(i,transform.matrix);});
  planks.instanceMatrix.needsUpdate=true;
  scene.add(planks);
  const postPositions: Array<[number,number]> = [];
  for(const z of [.82,3.18]){
    for(const x of [2,5,8,11,14,17])postPositions.push([x,z]);
    box(15.2,.14,.12,9.5,.73,z,timber);
  }
  const railPosts=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.6,.12),timber,postPositions.length);
  postPositions.forEach(([x,z],i)=>{transform.position.set(x,.42,z);transform.updateMatrix();railPosts.setMatrixAt(i,transform.matrix);});
  railPosts.instanceMatrix.needsUpdate=true;
  scene.add(railPosts);
  // Rockery on west side, pavilion beside pond.
  const rockmat=new THREE.MeshStandardMaterial({color:'#919b91',roughness:1,flatShading:true});
  for(const [x,z,s] of [[-16,-5,1.7],[-14,-3,2.3],[-16,-1,1.5],[-15,2,1.1]]){
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),rockmat);
    rock.position.set(x,s*.55,z);rock.rotation.y=x*.3;scene.add(rock);
  }
  const pavilion=box(4,.2,4,16,.15,-11,stone);
  void pavilion;
  for(const x of [14.2,17.8])for(const z of [-12.8,-9.2])box(.22,2.8,.22,x,1.5,z,timber);
  box(5.1,.45,5.1,16,3.1,-11,roof);
  box(5.6,.12,5.6,16,2.91,-11,roof);
  box(5.0,.17,.22,16,3.43,-11,roof);
  // Bamboo stand-in, placed outside the main north/south corridor.
  const bambooPositions: Array<{x:number;z:number;h:number}> = [];
  for(let i=0;i<34;i++){
    const x=-18+(i*7%13),z=-13+(i*11%25);
    if(x>-12 && x<-4 && z<-7)continue;
    bambooPositions.push({x,z,h:3.5+(i%5)*.45});
  }
  addBambooGrove(scene,bambooPositions);
}
