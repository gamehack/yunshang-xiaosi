import * as THREE from 'three';

/** Lightweight stylized visitor, constructed from reusable primitives without external assets. */
export function createVisitor(): THREE.Group {
  const visitor=new THREE.Group();
  const coat=new THREE.MeshStandardMaterial({color:'#627f76',roughness:1});
  const trousers=new THREE.MeshStandardMaterial({color:'#465b55',roughness:1});
  const skin=new THREE.MeshStandardMaterial({color:'#d8b49b',roughness:1});
  const hair=new THREE.MeshStandardMaterial({color:'#353a37',roughness:1});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.31,.54,4,8),coat);
  body.position.y=.1;visitor.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),skin);
  head.position.y=.88;visitor.add(head);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.245,10,6,0,Math.PI*2,0,Math.PI*.48),hair);
  cap.position.y=.9;visitor.add(cap);
  const limb=new THREE.CapsuleGeometry(.105,.42,3,6);
  const leftLeg=new THREE.Mesh(limb,trousers),rightLeg=new THREE.Mesh(limb,trousers);
  leftLeg.position.set(-.17,-.64,0);rightLeg.position.set(.17,-.64,0);
  visitor.add(leftLeg,rightLeg);
  const arm=new THREE.CapsuleGeometry(.085,.38,3,6);
  const leftArm=new THREE.Mesh(arm,coat),rightArm=new THREE.Mesh(arm,coat);
  leftArm.position.set(-.4,.05,0);rightArm.position.set(.4,.05,0);
  visitor.add(leftArm,rightArm);
  visitor.userData.limbs={leftLeg,rightLeg,leftArm,rightArm,body};
  return visitor;
}
export function animateVisitor(visitor:THREE.Group, time:number, moving:boolean, seated:boolean):void {
  const limbs=visitor.userData.limbs as {leftLeg:THREE.Mesh;rightLeg:THREE.Mesh;leftArm:THREE.Mesh;rightArm:THREE.Mesh;body:THREE.Mesh};
  const swing=moving&&!seated?Math.sin(time*9)*.4:0;
  limbs.leftLeg.rotation.x=swing;
  limbs.rightLeg.rotation.x=-swing;
  limbs.leftArm.rotation.x=-swing*.65;
  limbs.rightArm.rotation.x=swing*.65;
  limbs.body.position.y=.1+(moving&&!seated?Math.abs(Math.sin(time*9))*.025:Math.sin(time*1.5)*.009);
  visitor.scale.y=seated?.72:1;
}
