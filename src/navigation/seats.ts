export type SeatAnchor={x:number;z:number;standX:number;standZ:number};
export const SEATS:readonly SeatAnchor[]=[
  {x:-8,z:-10,standX:-8,standZ:-6.5},
  {x:0,z:-97,standX:0,standZ:-94}
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
