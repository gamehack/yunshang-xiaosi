import * as THREE from 'three';
import {installFoliageView} from './foliage-view';

/** Lightweight bamboo: segmented culms and thin lanceolate leaves, shared across garden/exterior. */
export function addBambooGrove(scene: THREE.Scene, positions: Array<{x:number;z:number;h:number}>, natural = false): void {
  if (positions.length === 0) return;
  // Partition long forests into camera-local batches; fading one batch must not hide all bamboo.
  const cellSize=9;
  const cells=new Map<string, typeof positions>();
  for(const p of positions){
    const key=`${Math.floor(p.x/cellSize)}:${Math.floor(p.z/cellSize)}`;
    const cell=cells.get(key)??[];
    cell.push(p);
    cells.set(key,cell);
  }
  for(const cell of cells.values()) addBambooCell(scene,cell,natural);
}

function addBambooCell(scene: THREE.Scene, positions: Array<{x:number;z:number;h:number}>, natural: boolean): void {
  const stemMaterial=new THREE.MeshStandardMaterial({color:'#66896a',roughness:1});
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#547e62',roughness:1,side:THREE.DoubleSide,flatShading:true});
  const nodeMaterial=new THREE.MeshStandardMaterial({color:'#426d50',roughness:1});
  for(const material of [stemMaterial,leafMaterial,nodeMaterial])installFoliageView(material);
  const stemGeometry=new THREE.CylinderGeometry(natural ? .023 : .055,natural ? .052 : .075,1,6);
  const nodeGeometry=new THREE.CylinderGeometry(.083,.083,.035,6);
  const leafGeometry=new THREE.BufferGeometry();
  const blade = natural ? [
    0,0,0, -.065,.04,-.15, 0,.055,-.36,
    0,0,0, 0,.055,-.36, .067,.027,-.18,
    -.065,.04,-.15, -.025,-.06,-.65, 0,.055,-.36,
    0,.055,-.36, -.025,-.06,-.65, .067,.027,-.18,
  ] : [
    0,0,0, -.20,.06,-.12, -.06,.02,-.85,
    0,0,0, -.06,.02,-.85, .20,.06,-.12,
  ];
  leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute(blade,3));
  leafGeometry.computeVertexNormals();
  const stems=new THREE.InstancedMesh(stemGeometry,stemMaterial,positions.length);
  const nodes=new THREE.InstancedMesh(nodeGeometry,nodeMaterial,positions.length*5);
  const leavesPerStem = natural ? 54 : 72;
  const leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,positions.length*leavesPerStem);
  const branches = natural ? new THREE.InstancedMesh(
    new THREE.CylinderGeometry(.003, .009, 1, 4, 1, true), nodeMaterial, positions.length * 6,
  ) : undefined;
  const minX=Math.min(...positions.map(p=>p.x)),maxX=Math.max(...positions.map(p=>p.x));
  const minZ=Math.min(...positions.map(p=>p.z)),maxZ=Math.max(...positions.map(p=>p.z));
  const center=new THREE.Vector3((minX+maxX)/2,0,(minZ+maxZ)/2);
  const radius=Math.hypot(maxX-minX,maxZ-minZ)/2;
  leaves.userData.cameraFoliage=true;
  leaves.userData.groveCenter=center;
  leaves.userData.groveRadius=radius;
  const transform=new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const twig = new THREE.Vector3();
  const color = new THREE.Color();
  positions.forEach(({x,z,h},i)=>{
    transform.position.set(x,h/2,z);transform.rotation.set(0,0,0);transform.scale.set(1,h,1);transform.updateMatrix();stems.setMatrixAt(i,transform.matrix);
    for(let j=0;j<5;j++){
      const radius = natural ? .60 - j * .056 : 1;
      transform.position.set(x,h*(j+1)/6,z);transform.rotation.set(0,0,0);transform.scale.set(radius,1,radius);transform.updateMatrix();nodes.setMatrixAt(i*5+j,transform.matrix);
    }
    // Stagger the branches and give each cluster nine drooping leaves.
    // Vertical variation breaks the previous horizontal, tiered silhouette.
    for(let j=0;j<leavesPerStem;j++){
      const cluster=Math.floor(j/9),leaf=j%9;
      const angle=cluster*2.39996+(i%7)*.41;
      const branchHeight=h*(natural ? .42+cluster*.094+Math.sin(i+cluster)*.041 : .42+cluster*.068);
      const spread=natural ? .10+leaf*.087 : .14+(leaf%3)*.21;
      const direction=angle+(leaf-4)*(natural ? .09 : .17);
      if (branches && leaf === 0) {
        twig.set(Math.cos(angle)*.86, -.23, Math.sin(angle)*.86);
        transform.position.set(x+twig.x/2,branchHeight+twig.y/2,z+twig.z/2);
        transform.scale.set(1,twig.length(),1);
        transform.quaternion.setFromUnitVectors(up,twig.normalize());
        transform.updateMatrix();
        branches.setMatrixAt(i*6+cluster,transform.matrix);
      }
      transform.position.set(
        x+Math.cos(direction)*spread,
        branchHeight+(leaf%3)*.075-(natural ? leaf*.034 : 0),
        z+Math.sin(direction)*spread
      );
      transform.rotation.set(-.40-(leaf%3)*.13,natural ? -direction-Math.PI/2+(leaf%2-.5)*.66 : direction,(leaf%2===0?1:-1)*.24);
      transform.scale.set(.75+(leaf%3)*.14,1,.72+(cluster%3)*.12);
      transform.updateMatrix();leaves.setMatrixAt(i*leavesPerStem+j,transform.matrix);
      if(natural)leaves.setColorAt(i*leavesPerStem+j,color.setHSL(.24+(i%5)*.013,.25,.54+(j%5)*.065));
    }
  });
  stems.instanceMatrix.needsUpdate=true;nodes.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;
  scene.add(stems,nodes,leaves);
  if (branches) scene.add(branches);
}
