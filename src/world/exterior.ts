import * as THREE from 'three';

/** M0.4 first exterior whitebox: continuous north exit to bamboo path and lake lookout. */
export function buildExterior(scene: THREE.Scene): void {
  const soil=new THREE.MeshStandardMaterial({color:'#9da991',roughness:1});
  const trail=new THREE.MeshStandardMaterial({color:'#c5b99e',roughness:1});
  const lake=new THREE.MeshStandardMaterial({color:'#7bacae',roughness:.7});
  const bamboo=new THREE.MeshStandardMaterial({color:'#688c6b',roughness:1});
  const leaves=new THREE.MeshStandardMaterial({color:'#54765e',roughness:1});
  const rock=new THREE.MeshStandardMaterial({color:'#9da29a',roughness:1});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(45,85),soil);
  ground.rotation.x=-Math.PI/2;ground.position.z=-60;scene.add(ground);
  const path=new THREE.Mesh(new THREE.PlaneGeometry(3.2,78),trail);
  path.rotation.x=-Math.PI/2;path.position.set(0,.025,-56);scene.add(path);
  const lookout=new THREE.Mesh(new THREE.CylinderGeometry(6,6,.3,16),rock);
  lookout.position.set(0,.15,-94);scene.add(lookout);
  const bench=new THREE.Mesh(new THREE.BoxGeometry(2.8,.45,.85),rock);
  bench.position.set(0,.65,-97);scene.add(bench);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(280,180),lake);
  water.rotation.x=-Math.PI/2;water.position.set(0,-.2,-189);scene.add(water);
  // Instanced low-poly vegetation keeps draw calls stable as the route expands.
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.11,4.8,5),bamboo,150);
  // Two staggered leaf tiers soften the silhouette without creating a mesh per tree.
  const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(.76,2.0,7),leaves,150);
  const upperLeaves=new THREE.MeshStandardMaterial({color:'#739477',roughness:1,flatShading:true});
  const upperCrowns=new THREE.InstancedMesh(new THREE.ConeGeometry(.51,1.65,7),upperLeaves,150);
  const m=new THREE.Matrix4();
  let n=0;
  for(let i=0;i<150;i++){
    const side=i%2===0?-1:1;
    const x=side*(3.5+(i*17%18)*.82);
    const z=-20-(i*23%70);
    if(z<-89 && Math.abs(x)<7)continue;
    const height=4.1+(i%7)*.28;
    m.makeScale(1,height/4.8,1);m.setPosition(x,height/2,z);stems.setMatrixAt(n,m);
    m.makeScale(1,1,1);m.setPosition(x,height+.25,z);crowns.setMatrixAt(n,m);
    m.makeScale(1,1,1);m.setPosition(x,height+1.28,z);upperCrowns.setMatrixAt(n,m);
    n++;
  }
  stems.count=n;crowns.count=n;upperCrowns.count=n;
  stems.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;upperCrowns.instanceMatrix.needsUpdate=true;
  scene.add(stems,crowns,upperCrowns);
}
