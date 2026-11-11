import * as THREE from 'three';
import { addBambooGrove } from './bamboo';
import { EXTERIOR, SEAT_GEOMETRY } from './layout';

/** M0.4 first exterior whitebox: continuous north exit to bamboo path and lake lookout. */
export function buildExterior(scene: THREE.Scene): void {
  const soil=new THREE.MeshStandardMaterial({color:'#9da991',roughness:1});
  const trail=new THREE.MeshStandardMaterial({color:'#c5b99e',roughness:1});
  const lake=new THREE.MeshStandardMaterial({color:'#7bacae',roughness:.52,metalness:.03});
  const shore=new THREE.MeshStandardMaterial({color:'#c3c4b0',roughness:1});
  const rock=new THREE.MeshStandardMaterial({color:'#9da29a',roughness:1});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(45,85),soil);
  ground.rotation.x=-Math.PI/2;ground.position.z=-60;scene.add(ground);
  const path=new THREE.Mesh(new THREE.PlaneGeometry(EXTERIOR.trail.width,EXTERIOR.trail.depth),trail);
  path.rotation.x=-Math.PI/2;path.position.set(0,.025,EXTERIOR.trail.z);scene.add(path);
  const lookout=new THREE.Mesh(new THREE.CylinderGeometry(EXTERIOR.lookout.radius,EXTERIOR.lookout.radius,EXTERIOR.lookout.height,16),rock);
  lookout.position.set(EXTERIOR.lookout.x,EXTERIOR.lookout.height/2,EXTERIOR.lookout.z);scene.add(lookout);
  const lakeSeat=SEAT_GEOMETRY.lake;
  const bench=new THREE.Mesh(new THREE.BoxGeometry(lakeSeat.width,lakeSeat.height,lakeSeat.depth),rock);
  bench.position.set(0,lakeSeat.centerY,-97);scene.add(bench);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(280,180),lake);
  water.rotation.x=-Math.PI/2;water.position.set(0,-.2,-189);scene.add(water);
  // Low-poly shoreline transition near the lookout, outside the walkable platform.
  const shoreline=new THREE.Mesh(new THREE.BoxGeometry(45,.11,1.6),shore);
  shoreline.position.set(0,-.055,-102.6);scene.add(shoreline);
  // Narrow bamboo foliage, segmented stems; keep the original route and collision bounds.
  const positions: Array<{x:number;z:number;h:number}>=[];
  for(let i=0;i<150;i++){
    const side=i%2===0?-1:1;
    const x=side*(3.5+(i*17%18)*.82);
    const z=-20-(i*23%70);
    if(z<-89 && Math.abs(x)<7)continue;
    positions.push({x,z,h:4.1+(i%7)*.28});
  }
  addBambooGrove(scene,positions);
}
