import * as THREE from 'three';
import { findNearbySeat, SEATS, type SeatAnchor } from '../navigation/seats';
import { walkSurfaceHeight } from '../world/layout';

const HIP_Y=-.08, UPPER_LEG=.42, LOWER_LEG=.42, FOOT_HEIGHT=.08;
const PELVIS_HALF_HEIGHT=.1;
const SEAT_ROOT_OFFSET=-HIP_Y+PELVIS_HALF_HEIGHT;
type Limbs={leftLeg:THREE.Group;rightLeg:THREE.Group;leftKnee:THREE.Group;rightKnee:THREE.Group;leftFoot:THREE.Mesh;rightFoot:THREE.Mesh;leftArm:THREE.Mesh;rightArm:THREE.Mesh;body:THREE.Mesh;pelvis:THREE.Mesh};

/** Lightweight stylized visitor. Local +Z is the face and seated knee direction. */
export function createVisitor(): THREE.Group {
  const visitor=new THREE.Group();
  const coat=new THREE.MeshStandardMaterial({color:'#627f76',roughness:1});
  const trousers=new THREE.MeshStandardMaterial({color:'#465b55',roughness:1});
  const skin=new THREE.MeshStandardMaterial({color:'#d8b49b',roughness:1});
  const hair=new THREE.MeshStandardMaterial({color:'#353a37',roughness:1});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.42,4,8),coat);
  body.position.y=.32;visitor.add(body);
  const pelvis=new THREE.Mesh(new THREE.BoxGeometry(.42,PELVIS_HALF_HEIGHT*2,.3),trousers);
  pelvis.position.y=HIP_Y;visitor.add(pelvis);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),skin);
  head.position.y=.88;visitor.add(head);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.245,10,6,0,Math.PI*2,0,Math.PI*.48),hair);
  cap.position.y=.9;visitor.add(cap);
  const upperGeometry=new THREE.CapsuleGeometry(.085,UPPER_LEG-.17,3,6);
  const lowerGeometry=new THREE.CapsuleGeometry(.075,LOWER_LEG-.15,3,6);
  const footGeometry=new THREE.BoxGeometry(.18,FOOT_HEIGHT,.28);
  const leg=(x:number)=>{
    const hip=new THREE.Group(),knee=new THREE.Group();
    hip.position.set(x,HIP_Y,0);visitor.add(hip);
    const thigh=new THREE.Mesh(upperGeometry,trousers);thigh.position.y=-UPPER_LEG/2;hip.add(thigh);
    knee.position.y=-UPPER_LEG;hip.add(knee);
    const shin=new THREE.Mesh(lowerGeometry,trousers);shin.position.y=-LOWER_LEG/2;knee.add(shin);
    const foot=new THREE.Mesh(footGeometry,trousers);foot.position.set(0,-LOWER_LEG-FOOT_HEIGHT/2,.05);knee.add(foot);
    return {hip,knee,foot};
  };
  const left=leg(-.17),right=leg(.17);
  const armGeometry=new THREE.CapsuleGeometry(.085,.38,3,6);
  const leftArm=new THREE.Mesh(armGeometry,coat),rightArm=new THREE.Mesh(armGeometry,coat);
  leftArm.position.set(-.4,.2,0);rightArm.position.set(.4,.2,0);visitor.add(leftArm,rightArm);
  visitor.userData.limbs={leftLeg:left.hip,rightLeg:right.hip,leftKnee:left.knee,rightKnee:right.knee,leftFoot:left.foot,rightFoot:right.foot,leftArm,rightArm,body,pelvis} satisfies Limbs;
  visitor.userData.seatBlend=0;
  return visitor;
}

/** Exponential turn damping uses the shortest angular arc and elapsed seconds. */
export function turnVisitor(visitor:THREE.Group,targetYaw:number,dt:number):void {
  if(!Number.isFinite(targetYaw) || !Number.isFinite(dt) || dt<=0)return;
  const delta=Math.atan2(Math.sin(targetYaw-visitor.rotation.y),Math.cos(targetYaw-visitor.rotation.y));
  visitor.rotation.y+=delta*(1-Math.exp(-12*Math.min(dt,.1)));
}

export function animateVisitor(visitor:THREE.Group,time:number,moving:boolean,seated:boolean,dt=1/60,seat?:SeatAnchor|null):void {
  const limbs=visitor.userData.limbs as Limbs;
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;
  const swing=moving&&!seated&&Number.isFinite(time)?Math.sin(time*9)*.4:0;
  const blend=(visitor.userData.seatBlend as number|undefined)??0;
  const next=THREE.MathUtils.lerp(blend,seated?1:0,1-Math.exp(-seconds*10.46));
  const seatedBlend=Math.abs(next-(seated?1:0))<.00001?(seated?1:0):next;
  visitor.userData.seatBlend=seatedBlend;
  const surface=walkSurfaceHeight(visitor.position.x,visitor.position.z);
  const anchor=seat??findNearbySeat(SEATS,visitor.position.x,visitor.position.z);
  const seatTop=anchor?.surfaceY??surface+.45;
  const seatedRoot=seatTop+SEAT_ROOT_OFFSET;
  // Raise low-seat knees slightly while leaving the lower legs vertical.
  const kneeRaise=Math.max(0,surface+LOWER_LEG+FOOT_HEIGHT-(seatedRoot+HIP_Y));
  const seatedHip=-Math.acos(THREE.MathUtils.clamp(-kneeRaise/UPPER_LEG,-1,1));
  let lowestSole=0;
  for(const [hip,knee,foot,gait] of [
    [limbs.leftLeg,limbs.leftKnee,limbs.leftFoot,swing],
    [limbs.rightLeg,limbs.rightKnee,limbs.rightFoot,-swing]
  ] as const){
    hip.rotation.x=THREE.MathUtils.lerp(gait,seatedHip,seatedBlend);
    knee.rotation.x=THREE.MathUtils.lerp(Math.max(0,-gait)*.5,-seatedHip,seatedBlend);
    // Counter-rotate shoes to stay horizontal during gait and seat transitions.
    foot.rotation.x=-hip.rotation.x-knee.rotation.x;
    const shinAngle=hip.rotation.x+knee.rotation.x;
    const sole=HIP_Y-UPPER_LEG*Math.cos(hip.rotation.x)-(LOWER_LEG+FOOT_HEIGHT/2)*Math.cos(shinAngle)-foot.position.z*Math.sin(shinAngle)-FOOT_HEIGHT/2;
    lowestSole=Math.min(lowestSole,sole);
  }
  limbs.leftArm.rotation.x=THREE.MathUtils.lerp(-swing*.65,-.3,seatedBlend);
  limbs.rightArm.rotation.x=THREE.MathUtils.lerp(swing*.65,-.3,seatedBlend);
  const breathing=Number.isFinite(time)?Math.sin(time*1.5)*.009:0;
  limbs.body.position.y=.32+(1-seatedBlend)*(moving?Math.abs(swing)*.06:breathing);
  // During the blend the knees may not yet clear the floor: lift the root only as needed.
  visitor.position.y=Math.max(THREE.MathUtils.lerp(surface+1,seatedRoot,seatedBlend),surface-lowestSole);
  visitor.scale.y=1;
}
