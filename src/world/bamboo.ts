import * as THREE from 'three';

/** Lightweight bamboo: segmented culms and thin lanceolate leaves, shared across garden/exterior. */
export function addBambooGrove(scene: THREE.Scene, positions: Array<{x:number;z:number;h:number}>): void {
  if (positions.length === 0) return;
  const stemMaterial=new THREE.MeshStandardMaterial({color:'#66896a',roughness:1});
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#547e62',roughness:1,side:THREE.DoubleSide,flatShading:true});
  const nodeMaterial=new THREE.MeshStandardMaterial({color:'#426d50',roughness:1});
  const stemGeometry=new THREE.CylinderGeometry(.055,.075,1,6);
  const nodeGeometry=new THREE.CylinderGeometry(.083,.083,.035,6);
  const leafGeometry=new THREE.BufferGeometry();
  leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, -.20,.06,-.12, -.06,.02,-.85,
    0,0,0, -.06,.02,-.85, .20,.06,-.12,
  ],3));
  leafGeometry.computeVertexNormals();
  const stems=new THREE.InstancedMesh(stemGeometry,stemMaterial,positions.length);
  const nodes=new THREE.InstancedMesh(nodeGeometry,nodeMaterial,positions.length*5);
  const leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,positions.length*72);
  const transform=new THREE.Object3D();
  positions.forEach(({x,z,h},i)=>{
    transform.position.set(x,h/2,z);transform.rotation.set(0,0,0);transform.scale.set(1,h,1);transform.updateMatrix();stems.setMatrixAt(i,transform.matrix);
    for(let j=0;j<5;j++){
      transform.position.set(x,h*(j+1)/6,z);transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();nodes.setMatrixAt(i*5+j,transform.matrix);
    }
    for(let j=0;j<72;j++){
      const tier=Math.floor(j/18),angle=(j%18)*Math.PI/9+(i%7)*.37+tier*.22;
      const radius=.18+(j%4)*.13;
      transform.position.set(x+Math.cos(angle)*radius,h*(.62+tier*.095),z+Math.sin(angle)*radius);
      transform.rotation.set(-.18+(j%3)*.14,angle,(j%2===0?1:-1)*.16);
      transform.scale.set(1.1+(i%3)*.12,1,1.05+(j%3)*.12);
      transform.updateMatrix();leaves.setMatrixAt(i*72+j,transform.matrix);
    }
  });
  stems.instanceMatrix.needsUpdate=true;nodes.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;
  scene.add(stems,nodes,leaves);
}
