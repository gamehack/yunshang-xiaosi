import * as THREE from 'three';
import { addBambooGrove } from './bamboo';
import { BRIDGE, GARDEN, GATE_COLUMNS, PONDS, TEAHOUSE, WALLS } from './layout';

/** M0.3 conceptual whitebox: garden footprint 42 x 36m, not the final 70 x 55m plan. */
export function buildGarden(scene: THREE.Scene) {
  const white = new THREE.MeshStandardMaterial({color:'#e9e7df',roughness:1});
  const roof = new THREE.MeshStandardMaterial({color:'#4e5653',roughness:1});
  const stone = new THREE.MeshStandardMaterial({color:'#c7bda9',roughness:1});
  const timber = new THREE.MeshStandardMaterial({color:'#765d48',roughness:1});
  const water = new THREE.MeshStandardMaterial({color:'#729f9b',roughness:0.45,metalness:.04});
  const waterHighlight=new THREE.MeshBasicMaterial({color:'#b7d5c7',transparent:true,opacity:.38,depthWrite:false});
  const earth = new THREE.MeshStandardMaterial({color:'#b3bea7',roughness:1});
  const paving=new THREE.MeshStandardMaterial({color:'#d5cbb8',roughness:1});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(GARDEN.width,GARDEN.depth),earth);
  floor.rotation.x=-Math.PI/2;scene.add(floor);
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(m===white||m===roof)o.userData.cameraOccluder=true;scene.add(o);return o;
  };
  const walk=(x:number,z:number,w:number,d:number)=>box(w,.035,d,x,.025,z,stone);
  // South entrance and the three court sequence; routes are deliberately open for M0 grid navigation.
  const centerWalk: THREE.Object3D[] = [walk(0,12,3.5,12), walk(0,1,3.5,12), walk(0,-11,3.5,10)];
  walk(-12,0,2.5,27);walk(18,0,2.5,27);
  walk(-6,-14,13,2.6);walk(7,-14,15,2.6);
  walk(-6,11,13,2);walk(7,11,15,2);
  // Inset paving stones break up the uninterrupted walkway without altering collisions.
  // Uneven polygonal stepping stones, split into two instanced shapes.
  const stoneShapes=[
    [[-.48,-.28],[.42,-.34],[.49,.24],[-.35,.37]],
    [[-.41,-.35],[.47,-.23],[.33,.34],[-.46,.29]]
  ];
  stoneShapes.forEach((points,shapeIndex)=>{
    const shape=new THREE.Shape();
    points.forEach(([x,z],j)=>j===0?shape.moveTo(x,z):shape.lineTo(x,z));
    shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI/2);
    const tiles=new THREE.InstancedMesh(geometry,paving,24);
    const stoneTransform=new THREE.Object3D();
    for(let k=0;k<24;k++){
      const row=k, col=shapeIndex;
      stoneTransform.position.set(-.54+col*1.08+(row%3-1)*.14,.057,15-row*1.18+(col%2)*.09);
      stoneTransform.rotation.set(0,((row*7+col*3)%7-3)*.075,0);
      stoneTransform.scale.set(.85+(row%4)*.07,1,.87+(row%3)*.06);
      stoneTransform.updateMatrix();tiles.setMatrixAt(k,stoneTransform.matrix);
    }
    tiles.instanceMatrix.needsUpdate=true;scene.add(tiles);
    centerWalk.push(tiles);
  });
  // Shared footprints keep the visible walls and visitor collision aligned.
  for(const wall of WALLS){
    box(wall.width,2.8,wall.depth,wall.x,1.4,wall.z,white);
    box(wall.width===.35?.75:wall.width,.22,wall.depth===.35?.75:wall.depth,wall.x,2.9,wall.z,roof);
  }
  for(const column of GATE_COLUMNS)box(column.width,3.1,column.depth,column.x,1.55,column.z,white);
  box(6.6,.55,1.4,0,3.3,15.6,roof);box(4.2,.6,.15,0,2.75,15.15,timber);
  // Teahouse in north-west, with open doorway facing central garden.
  box(TEAHOUSE.width,TEAHOUSE.floorDepth,TEAHOUSE.depth,TEAHOUSE.x,TEAHOUSE.floorY,TEAHOUSE.z,stone);
  const teahouseStart = scene.children.length;
  for(const x of TEAHOUSE.postXs)for(const z of TEAHOUSE.postZs)box(TEAHOUSE.postWidth,3,TEAHOUSE.postWidth,x,1.6,z,timber);
  // Clean double-pitched roof: no overlapping horizontal slab beneath the slopes.
  const roofPlane=new THREE.BoxGeometry(4.9,.16,6.6);
  for(const side of [-1,1]){
    const slope=new THREE.Mesh(roofPlane,roof);
    slope.rotation.z=-side*.19;
    slope.position.set(-8+side*2.4,3.48,-10);
    slope.userData.cameraOccluder=true;
    scene.add(slope);
  }
  box(.16,.10,6.6,-8,3.94,-10,roof);
  // Raised roof battens suggest tile courses without high-cost individual tiles.
  const roofRibs=new THREE.InstancedMesh(new THREE.BoxGeometry(.055,.045,6.45),roof,18);
  const ribTransform=new THREE.Object3D();
  for(let i=0;i<18;i++){
    const side=i<9?-1:1,step=i%9;
    ribTransform.position.set(-8+side*(.45+step*.53),3.48+(2.4-(.45+step*.53))*.19,-10);
    ribTransform.rotation.set(0,0,-side*.19);
    ribTransform.updateMatrix();roofRibs.setMatrixAt(i,ribTransform.matrix);
  }
  roofRibs.instanceMatrix.needsUpdate=true;scene.add(roofRibs);
  for(const x of [-12.75,-3.25])box(.15,.12,6.7,x,3.03,-10,roof);
  // M1.5: restrained ridge caps and end finials add roof silhouette without extra assets.
  const ridgeCap=new THREE.MeshStandardMaterial({color:'#394441',roughness:1});
  for(const z of [-13.3,-6.7]){
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.3,8),ridgeCap);
    cap.rotation.x=Math.PI/2;
    cap.position.set(-8,3.95,z);
    scene.add(cap);
  }
  // Fine horizontal timber ties beneath the eaves, deliberately clear of the entrance.
  for(const z of [-12.3,-7.7]){
    box(7.6,.11,.12,-8,2.92,z,timber);
  }
  // Layered pavilion fascia improves the silhouette without a costly tile mesh.
  // Front facade retains the original doorway and adds fine lattice bays.
  for(const x of [-11.4,-10.8,-5.2,-4.6])box(.065,1.35,.08,x,1.55,-12.43,timber);
  const lattice=new THREE.MeshStandardMaterial({color:'#92765b',roughness:1});
  for(const x of [-11.2,-10.3,-9.4,-8.5,-7.6,-6.7,-5.8])box(.055,1.65,.07,x,1.65,-12.35,lattice);
  box(6.6,.065,.08,-8,2.45,-12.35,lattice);
  box(6.6,.065,.08,-8,1.45,-12.35,lattice);
  const rear=TEAHOUSE.rearWall,table=TEAHOUSE.table;
  box(rear.width,2.4,rear.depth,rear.x,1.45,rear.z,white);
  box(table.width,.8,table.depth,table.x,.55,table.z,timber);
  const teahouseVisuals = scene.children.slice(teahouseStart);
  // Water footprints are also used by navigation; only the bridge deck permits crossing.
  for(const pond of PONDS){
    const surface=new THREE.Mesh(new THREE.CircleGeometry(1,64),water);
    surface.rotation.x=-Math.PI/2;
    surface.scale.set(pond.radiusX,pond.radiusZ,1);
    surface.position.set(pond.x,pond.y,pond.z);scene.add(surface);
  }
  // Irregular shoreline stones stay decorative and outside the existing path/collision logic.
  const bankStone=new THREE.MeshStandardMaterial({color:'#a6a99b',roughness:1,flatShading:true});
  const bankGeometry=new THREE.DodecahedronGeometry(1,0);
  const bank=new THREE.InstancedMesh(bankGeometry,bankStone,24);
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
    ripple.rotation.x=-Math.PI/2;ripple.position.set(x,.065,z);ripple.scale.setScalar(s);
    ripple.userData.waterRipple={baseScale:s,phase:scene.children.length*.71};
    scene.add(ripple);
  }
  // M0.6 low crossing over the pond at z=2, with a clear 1.8m walking deck.
  const bridgeWood=new THREE.MeshStandardMaterial({color:'#9b8062',roughness:1});
  const plankPositions: number[] = [];
  for(let x=BRIDGE.minX+.29;x<=BRIDGE.maxX-.29;x+=.58)plankPositions.push(x);
  const plankGeometry=new THREE.BoxGeometry(.58,BRIDGE.plankDepth,BRIDGE.plankWidth);
  const planks=new THREE.InstancedMesh(plankGeometry,bridgeWood,plankPositions.length);
  const transform=new THREE.Object3D();
  plankPositions.forEach((x,i)=>{transform.position.set(x,BRIDGE.plankY,BRIDGE.z);transform.updateMatrix();planks.setMatrixAt(i,transform.matrix);});
  planks.instanceMatrix.needsUpdate=true;
  scene.add(planks);
  const postPositions: Array<[number,number]> = [];
  for(const z of [BRIDGE.z-1.18,BRIDGE.z+1.18]){
    for(const x of [2,5,8,11,14,17])postPositions.push([x,z]);
    box(15.2,.14,.12,9.5,.73,z,timber);
  }
  const railPosts=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.6,.12),timber,postPositions.length);
  postPositions.forEach(([x,z],i)=>{transform.position.set(x,.42,z);transform.updateMatrix();railPosts.setMatrixAt(i,transform.matrix);});
  railPosts.instanceMatrix.needsUpdate=true;
  scene.add(railPosts);
  // Rockery on west side, pavilion beside pond.
  const rockmat=new THREE.MeshStandardMaterial({color:'#919b91',roughness:1,flatShading:true});
  const rockeryStart = scene.children.length;
  for(const [x,z,s] of [[-16,-5,1.7],[-14,-3,2.3],[-16,-1,1.5],[-15,2,1.1]]){
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),rockmat);
    rock.position.set(x,s*.55,z);rock.rotation.y=x*.3;scene.add(rock);
  }
  const rockeryVisuals = scene.children.slice(rockeryStart);
  const pavilion=box(4,.2,4,16,.15,-11,stone);
  void pavilion;
  for(const x of [14.2,17.8])for(const z of [-12.8,-9.2])box(.22,2.8,.22,x,1.5,z,timber);
  box(5.1,.45,5.1,16,3.1,-11,roof);
  box(5.6,.12,5.6,16,2.91,-11,roof);
  box(5.0,.17,.22,16,3.43,-11,roof);
  // Pavilion roof trim and beam lattice, kept above the walkable deck.
  for(const z of [-13.45,-8.55])box(5.35,.12,.12,16,2.82,z,timber);
  for(const x of [13.55,18.45])box(.12,.12,5.35,x,2.82,-11,timber);
  for(const x of [14.2,17.8])for(const z of [-12.8,-9.2]){
    box(.42,.12,.42,x,2.96,z,roof);
  }
  // Small low shrubs soften the otherwise empty courtyard; purely visual and off the central path.
  const shrubMaterial=new THREE.MeshStandardMaterial({color:'#759575',roughness:1,flatShading:true});
  const shrubGeometry=new THREE.IcosahedronGeometry(.55,0);
  const shrubLocations: Array<[number,number,number]>=[
    [-17,7,.8],[-15,9,.7],[-14,6,.65],[-17,-10,.75],
    [12,9,.8],[14,8,.65],[16,6,.7],[19,-5,.6]
  ];
  const shrubs=new THREE.InstancedMesh(shrubGeometry,shrubMaterial,shrubLocations.length);
  const shrubTransform=new THREE.Object3D();
  shrubLocations.forEach(([x,z,s],i)=>{
    shrubTransform.position.set(x,s*.5,z);
    shrubTransform.scale.set(s, s*.8, s);
    shrubTransform.rotation.set(0,i*.71,0);
    shrubTransform.updateMatrix();shrubs.setMatrixAt(i,shrubTransform.matrix);
  });
  shrubs.instanceMatrix.needsUpdate=true;scene.add(shrubs);
  // Compact planted islands break up empty lawns without entering the walkable corridor.
  const plantingSoil=new THREE.MeshStandardMaterial({color:'#9da98e',roughness:1});
  const plantingGeometry=new THREE.CylinderGeometry(1,1,.055,10);
  const plantingCenters: Array<[number,number,number,number]>=[
    [-16,8,2.2,1.3],[-16,-8,1.7,1.2],[14,9,1.8,1.3],[17,-5,1.45,1.1]
  ];
  const planting=new THREE.InstancedMesh(plantingGeometry,plantingSoil,plantingCenters.length);
  const plantingTransform=new THREE.Object3D();
  plantingCenters.forEach(([x,z,sx,sz],i)=>{
    plantingTransform.position.set(x,.04,z);
    plantingTransform.rotation.set(0,i*.39,0);
    plantingTransform.scale.set(sx,1,sz);
    plantingTransform.updateMatrix();planting.setMatrixAt(i,plantingTransform.matrix);
  });
  planting.instanceMatrix.needsUpdate=true;scene.add(planting);
  // A few upright ornamental rocks beside the plantings, not in the central walkway.
  const scholarStone=new THREE.MeshStandardMaterial({color:'#88958b',roughness:1,flatShading:true});
  const scholarGeometry=new THREE.DodecahedronGeometry(1,1);
  const scholarLocations: Array<[number,number,number]>=[[-16.5,8.4,1.2],[-15.5,-8.5,1.05],[14.8,9.2,1.15],[17.4,-5.2,.9]];
  const scholarRocks=new THREE.InstancedMesh(scholarGeometry,scholarStone,scholarLocations.length);
  const scholarTransform=new THREE.Object3D();
  scholarLocations.forEach(([x,z,s],i)=>{
    scholarTransform.position.set(x,s*.55,z);
    scholarTransform.rotation.set(.12*i,i*.78,.15);
    scholarTransform.scale.set(s*.5,s,s*.43);
    scholarTransform.updateMatrix();scholarRocks.setMatrixAt(i,scholarTransform.matrix);
  });
  scholarRocks.instanceMatrix.needsUpdate=true;scene.add(scholarRocks);
  // Bamboo stand-in, placed outside the main north/south corridor.
  const bambooPositions: Array<{x:number;z:number;h:number}> = [];
  for(let i=0;i<34;i++){
    const x=-18+(i*7%13),z=-13+(i*11%25);
    if(x>-12 && x<-4 && z<-7)continue;
    bambooPositions.push({x,z,h:3.5+(i%5)*.45});
  }
  const bambooStart = scene.children.length;
  addBambooGrove(scene,bambooPositions);
  return { teahouseVisuals, rockeryVisuals, water, ground: floor, centerWalk, bank,
    bambooPositions, bambooVisuals: scene.children.slice(bambooStart) };
}
