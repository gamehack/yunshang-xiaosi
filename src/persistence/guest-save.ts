import { SEATS, findNearbySeat } from '../navigation/seats';
import { isWalkable } from '../navigation/walk-controller';

export type GuestSave = {
  version: 1;
  x: number;
  z: number;
  seated: boolean;
  yaw: number;
  pitch: number;
  distance: number;
  savedAt: number;
};
const KEY='banrixian.guest.v1';
export function readGuestSave(): GuestSave | null {
  try {
    const raw=localStorage.getItem(KEY);
    if(!raw)return null;
    const s:unknown=JSON.parse(raw);
    if(!s || typeof s!=='object')return null;
    const v=s as Partial<GuestSave>;
    if(v.version!==1 || ![v.x,v.z,v.yaw,v.pitch,v.distance].every(n=>typeof n==='number'&&Number.isFinite(n)))return null;
    const exactSeat=SEATS.some(seat=>Math.hypot(v.x!-seat.x,v.z!-seat.z)<.15);
    if(!isWalkable(v.x!,v.z!) && !(v.seated===true && exactSeat))return null;
    // Seated state is only valid beside a known seat; never restore mid-animation.
    const seatNearby = findNearbySeat(SEATS,v.x!,v.z!) !== null;
    return {version:1,x:v.x!,z:v.z!,seated:v.seated===true && seatNearby,yaw:v.yaw!,pitch:v.pitch!,distance:v.distance!,savedAt:typeof v.savedAt==='number'?v.savedAt:0};
  }catch{return null;}
}
export function writeGuestSave(save: GuestSave): void {
  try {localStorage.setItem(KEY,JSON.stringify(save));}catch{/* storage unavailable or full: guest play remains available */}
}
