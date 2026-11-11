import { SEAT_GEOMETRY } from '../world/layout';
export type SeatAnchor={x:number;z:number;standX:number;standZ:number;surfaceY?:number;yaw?:number};
export const SEATS:readonly SeatAnchor[]=[
  {x:-8,z:-8.3,standX:-8,standZ:-6.5,yaw:Math.PI,surfaceY:SEAT_GEOMETRY.tea.centerY+SEAT_GEOMETRY.tea.height/2},
  {x:0,z:-97,standX:0,standZ:-94,yaw:Math.PI,surfaceY:SEAT_GEOMETRY.lake.centerY+SEAT_GEOMETRY.lake.height/2}
];
/** Find the closest seat by its walkable approach or its seated center. */
export function findNearbySeat(seats:readonly SeatAnchor[],x:number,z:number,range=2.4):SeatAnchor|null {
  let nearest:SeatAnchor|null=null;
  let distance=range;
  for(const seat of seats){
    const approach=Math.hypot(x-seat.standX,z-seat.standZ);
    const center=Math.hypot(x-seat.x,z-seat.z);
    const candidate=Math.min(approach,center);
    if(candidate<distance){distance=candidate;nearest=seat;}
  }
  return nearest;
}
