import * as THREE from 'three';
/** Shared instanced resources are released once, including textures. */
export function disposeScene(scene:THREE.Scene):void {
  const geometries=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  const textures=new Set<THREE.Texture>();
  scene.traverse(object=>{
    if(object instanceof THREE.Mesh){
      geometries.add(object.geometry);
      for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);
    }
  });
  for(const material of materials)for(const value of Object.values(material))if(value instanceof THREE.Texture)textures.add(value);
  for(const texture of textures)texture.dispose();
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
  scene.clear();
}
