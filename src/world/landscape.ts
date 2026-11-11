import * as THREE from 'three';
/** Original, shared low-poly silhouettes outside visitor corridors. */
export function addLandscape(scene:THREE.Scene):void {
  const bark=new THREE.MeshStandardMaterial({color:'#6c6c55',roughness:1});
  const greens=['#6e8c78','#839c7d'].map(color=>new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));
  const locations=[[-19,-28],[-15,-42],[18,-36],[15,-58],[-17,-76],[18,-83]];
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.14,.24,3.4,7),bark,locations.length);
  const crowns=greens.map(m=>new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),m,locations.length*2));
  const transform=new THREE.Object3D();
  locations.forEach(([x,z],i)=>{
    transform.position.set(x,1.7,z);transform.scale.set(1,1,1);transform.rotation.set(0,i,0);transform.updateMatrix();trunks.setMatrixAt(i,transform.matrix);
    for(let j=0;j<4;j++){
      transform.position.set(x+Math.sin(j*2.4)*1.1,3.2+(j%2)*.7,z+Math.cos(j*2.4)*1.1);
      transform.scale.set(1.8,.9,1.6);transform.updateMatrix();crowns[j%2].setMatrixAt(i*2+Math.floor(j/2),transform.matrix);
    }
  });
  scene.add(trunks,...crowns);
  const hills=new THREE.InstancedMesh(new THREE.SphereGeometry(1,16,8),new THREE.MeshStandardMaterial({color:'#8ca69c',roughness:1}),9);
  for(let i=0;i<9;i++){
    transform.position.set(-100+i*25,-4,-183-(i%3)*9);transform.scale.set(28,12+(i%3)*6,18);transform.rotation.set(0,i,0);transform.updateMatrix();hills.setMatrixAt(i,transform.matrix);
  }
  scene.add(hills);
}
