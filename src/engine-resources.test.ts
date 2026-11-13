import {it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {disposeScene} from './engine-resources';
it('disposes shared geometry, material and texture once and removes scene references',()=>{
 const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),material=new THREE.MeshBasicMaterial({map:texture});
 scene.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));
 const g=vi.spyOn(geometry,'dispose'),m=vi.spyOn(material,'dispose'),t=vi.spyOn(texture,'dispose');
 disposeScene(scene);expect(g).toHaveBeenCalledTimes(1);expect(m).toHaveBeenCalledTimes(1);expect(t).toHaveBeenCalledTimes(1);expect(scene.children).toHaveLength(0);
});
