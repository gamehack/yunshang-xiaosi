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
    // Eight staggered branch clusters, with nine drooping leaves per cluster.
    // Vertical variation breaks the previous horizontal, tiered silhouette.
    for(let j=0;j<72;j++){
      const cluster=Math.floor(j/9),leaf=j%9;
      const angle=cluster*2.39996+(i%7)*.41;
      const branchHeight=h*(.42+cluster*.068);
      const spread=.14+(leaf%3)*.21;
      const direction=angle+(leaf-4)*.17;
      transform.position.set(
        x+Math.cos(direction)*spread,
        branchHeight+(leaf%3)*.075,
        z+Math.sin(direction)*spread
      );
      transform.rotation.set(-.40-(leaf%3)*.13,direction,(leaf%2===0?1:-1)*.24);
      transform.scale.set(.75+(leaf%3)*.14,1,.72+(cluster%3)*.12);
      transform.updateMatrix();leaves.setMatrixAt(i*72+j,transform.matrix);
    }
  });
  stems.instanceMatrix.needsUpdate=true;nodes.instanceMatrix.needsUpdate=true;leaves.instanceMatrix.needsUpdate=true;
  scene.add(stems,nodes,leaves);
}
