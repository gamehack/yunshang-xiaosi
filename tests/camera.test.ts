import {it,expect,vi} from 'vitest';
import {Scene,Mesh,BoxGeometry,MeshBasicMaterial,Object3D,PerspectiveCamera,type WebGLRenderer} from 'three';
import {WalkController} from '../src/navigation/walk-controller';
it('keeps the following camera in front of a wall and smoothly restores distance after clearing it',()=>{
 vi.stubGlobal('window',new EventTarget());
 const canvas=new EventTarget() as EventTarget & {style:Record<string,string>};canvas.style={};
 const scene=new Scene(),wall=new Mesh(new BoxGeometry(10,8,.35),new MeshBasicMaterial());
 wall.position.set(0,4,12);wall.userData.cameraOccluder=true;scene.add(wall);scene.updateMatrixWorld(true);
 const avatar=new Object3D();avatar.position.set(0,1,8);
 const camera=new PerspectiveCamera(62,1,.1,300);camera.position.set(0,8,19);
 const walking=new WalkController(avatar,camera,{domElement:canvas} as unknown as WebGLRenderer,scene);
 try{
  walking.update(1/60);expect(camera.position.z).toBeLessThan(11.825);expect(camera.position.z).toBeGreaterThan(8);
  const shortened=camera.position.z;
  wall.position.x=100;scene.updateMatrixWorld(true);walking.update(1/60);
  expect(camera.position.z).toBeGreaterThan(shortened);expect(camera.position.z).toBeLessThan(17);
  for(let i=0;i<120;i++)walking.update(1/60);
  expect(camera.position.z).toBeGreaterThan(17);
 }finally{walking.dispose();vi.unstubAllGlobals();wall.geometry.dispose();(wall.material as MeshBasicMaterial).dispose();}
});
