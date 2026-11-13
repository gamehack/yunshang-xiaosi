/** Shared X/Z footprints for scene construction and visitor navigation (metres). */
export type Footprint = { readonly x: number; readonly z: number; readonly width: number; readonly depth: number };

export const GARDEN = { width: 42, depth: 36, halfWalkWidth: 20, northExitZ: -17, southLimitZ: 17 } as const;
export const WALLS: readonly Footprint[] = [
  {x:-20.5,z:-10,width:.35,depth:12}, {x:-20.5,z:10,width:.35,depth:12},
  {x:20.5,z:-10,width:.35,depth:12}, {x:20.5,z:10,width:.35,depth:12},
  {x:-12,z:-16.5,width:16,depth:.35}, {x:12,z:-16.5,width:16,depth:.35},
  {x:-12,z:16.5,width:16,depth:.35}, {x:12,z:16.5,width:16,depth:.35}
];
export const GATE_COLUMNS: readonly Footprint[] = [-2.7,2.7].map(x=>({x,z:15.6,width:1.1,depth:.7}));
export const TEAHOUSE = {
  x:-8,z:-10,width:8,depth:5,floorY:.12,floorDepth:.25,
  postXs:[-11.7,-4.3],postZs:[-12.2,-7.8],postWidth:.26,
  rearWall:{x:-8,z:-12.5,width:5,depth:.2},
  table:{x:-8,z:-10,width:1.2,depth:1.2}
} as const;
export const PAVILION = { x: 16, z: -11 } as const;
export const PONDS = [
  {x:9,z:0,radiusX:8.3,radiusZ:5.2,y:.045},
  {x:7,z:-4,radiusX:3.5,radiusZ:3.1,y:.046}
] as const;
export const BRIDGE = {minX:.5,maxX:17.9,z:2,walkWidth:1.8,plankWidth:1.9,plankDepth:.12,plankY:.12} as const;
export const EXTERIOR = {
  minZ:-101,trailHalfWidth:2.1,trailEndZ:-90,
  trail:{width:3.2,depth:78,z:-56},
  lookout:{x:0,z:-94,radius:6,walkHalfWidth:5.5,height:.3}
} as const;
export const NAVIGATION = {radius:.48,step:1,segmentStep:.1,entry:{x:0,y:1,z:8}} as const;

export const SEAT_GEOMETRY = {
  tea:{centerY:.52,height:.14,width:1.4,depth:.75},
  lake:{centerY:.65,height:.45,width:2.8,depth:.85}
} as const;

/** Top of the existing horizontal walking meshes; no artificial bridge arch. */
export function walkSurfaceHeight(x:number,z:number):number {
  if(!Number.isFinite(x) || !Number.isFinite(z))return 0;
  if(x>=BRIDGE.minX && x<=BRIDGE.maxX && Math.abs(z-BRIDGE.z)<=BRIDGE.plankWidth/2)
    return BRIDGE.plankY+BRIDGE.plankDepth/2;
  if(Math.abs(x-TEAHOUSE.x)<=TEAHOUSE.width/2 && Math.abs(z-TEAHOUSE.z)<=TEAHOUSE.depth/2)
    return TEAHOUSE.floorY+TEAHOUSE.floorDepth/2;
  if(Math.hypot(x-EXTERIOR.lookout.x,z-EXTERIOR.lookout.z)<=EXTERIOR.lookout.radius)
    return EXTERIOR.lookout.height;
  return 0;
}
