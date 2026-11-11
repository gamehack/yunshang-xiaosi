import * as THREE from 'three';

/** Lightweight bamboo: segmented culms and thin lanceolate leaves, shared across garden/exterior. */
export function addBambooGrove(scene: THREE.Scene, positions: Array<{x:number;z:number;h:number}>): void {
  const stemMaterial=new THREE.MeshStandardMaterial({color:'#66896a',roughness:1});
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#547e62',roughness:1,side:THREE.DoubleSide,flatShading:true});
  const nodeMaterial=new THREE.MeshStandardMaterial({color:'#426d50',roughness:1});
  const stemGeometry=new THREE.CylinderGeometry(.055,.075,1,6);
  const nodeGeometry=new THREE.CylinderGeometry(.083,.083,.035,6);
  const leafGeometry=new THREE.BufferGeometry();
  leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, -.14,.055,-.1, -.055,.02,-.65,
    0,0,0, -.055,.02,-.65, .14,.055,-.1,
  ],3));
  leafGeometry.computeVertexNormals();
  const stems=new THREE.InstancedMesh(stemGeometry,stemMaterial,positions.length);
  const nodes=new THREE.InstancedMesh(nodeGeometry,nodeMaterial,positions.length*5);
  const leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,positions.length*18);
  const transform=new THREE.Object3D();
  positions.forEach(({x,z,h},i)=>{
    transform.position.set(x,h/2,z);transform.rotation.set(0,0,0);transform.scale.set(1,h,1);transform.updateMatrix();stems.setMatrixAt(i,transform.matrix);
    for(let j=0;j<5;j++){
      transform.position.set(x,h*(j+1)/6,z);transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();nodes.setMatrixAt(i*5+j,transform.matrix);
    }
    for(let j=0;j<18;j++){
      const tier=Math.floor(j/6),angle=(j%6)*Math.PI/3+(i%7)*.37+tier*.22;
      const radius=.1+(j%3)*.07;
      transform.position.set(x+Math.cos(angle)*radius,h*(.58+tier*.14),z+Math.sin(angle)*radius);
      transform.rotation.set(0,angle,0);
      transform.scale.set(.9+(i%3)*.1,.8, .95+(j%3)*.12);
      transform.updateMatrix();leaves.setMatrixAt(i*18+j,transform.matrix);
    }
  });
  stems.instanceMatrix.needsUpdate=true;nodes.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;
  scene.add(stems,nodes,leaves);
}
