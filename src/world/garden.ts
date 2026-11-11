import * as THREE from 'three';

/** M0.3 conceptual whitebox: garden footprint 42 x 36m, not the final 70 x 55m plan. */
export function buildGarden(scene: THREE.Scene): void {
  const white = new THREE.MeshStandardMaterial({color:'#e9e7df',roughness:1});
  const roof = new THREE.MeshStandardMaterial({color:'#4e5653',roughness:1});
  const stone = new THREE.MeshStandardMaterial({color:'#c7bda9',roughness:1});
  const timber = new THREE.MeshStandardMaterial({color:'#765d48',roughness:1});
  const leaf = new THREE.MeshStandardMaterial({color:'#668477',roughness:1});
  const water = new THREE.MeshStandardMaterial({color:'#729f9b',roughness:0.45});
  const earth = new THREE.MeshStandardMaterial({color:'#b3bea7',roughness:1});
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
  box(5,2.4,.2,-8,1.45,-12.5,white);
  box(1.2,.8,1.2,-8,.55,-10,timber);
  // Central winding pond with two bays; shore is approximate, no bridge crossing in this iteration.
  const pond=new THREE.Mesh(new THREE.CircleGeometry(1,64),water);
  pond.rotation.x=-Math.PI/2;pond.scale.set(8.3,5.2,1);pond.position.set(9,.045,0);scene.add(pond);
  const bay=new THREE.Mesh(new THREE.CircleGeometry(1,48),water);
  bay.rotation.x=-Math.PI/2;bay.scale.set(3.5,3.1,1);bay.position.set(7,.046,-4);scene.add(bay);
  // M0.6 low crossing over the pond at z=2, with a clear 1.8m walking deck.
  const bridgeWood=new THREE.MeshStandardMaterial({color:'#9b8062',roughness:1});
  for(let x=1.5;x<=17.5;x+=.65)box(.58,.12,1.9,x,.12,2,bridgeWood);
  for(const z of [.82,3.18]){
    for(const x of [2,5,8,11,14,17])box(.12,.6,.12,x,.42,z,timber);
    box(15.2,.14,.12,9.5,.73,z,timber);
  }
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
  // Bamboo stand-in, placed outside the main north/south corridor.
  const trunk=new THREE.MeshStandardMaterial({color:'#7c9475'});
  for(let i=0;i<34;i++){
    const x=-18+(i*7%13),z=-13+(i*11%25);
    if(x>-12 && x<-4 && z<-7)continue;
    const h=3.5+(i%5)*.45;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,h,6),trunk);
    stem.position.set(x,h/2,z);scene.add(stem);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(.8,2.4,5),leaf);
    crown.position.set(x,h+.6,z);scene.add(crown);
  }
}
