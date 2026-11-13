import * as THREE from 'three';
import {SEATS} from '../navigation/seats';
import {SEAT_GEOMETRY} from './layout';
/** Shared anchors place visible seats and interaction in the same world space. */
export function addSeats(scene:THREE.Scene):void {
  const tea=SEAT_GEOMETRY.tea;
  const wood=new THREE.MeshStandardMaterial({color:'#765d48',roughness:1});
  for(const seat of SEATS){
    // The lakeside stone bench is built by exterior.ts; tea stool was missing.
    if(seat===SEATS[1])continue;
    const top=new THREE.Mesh(new THREE.BoxGeometry(tea.width,tea.height,tea.depth),wood);
    top.position.set(seat.x,tea.centerY,seat.z);scene.add(top);
    const legGeometry=new THREE.BoxGeometry(.12,.45,.12);
    for(const x of [-.55,.55])for(const z of [-.23,.23]){
      const leg=new THREE.Mesh(legGeometry,wood);leg.position.set(seat.x+x,.225,seat.z+z);scene.add(leg);
    }
  }
}
