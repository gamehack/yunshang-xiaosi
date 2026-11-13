import {MathUtils,MeshStandardMaterial,Vector3} from 'three';

/** Visibility only inside the finite camera-to-subject corridor, never an entire grove. */
export function foliageVisibility(point:Vector3,camera:Vector3,focus:Vector3):number {
 const dx=focus.x-camera.x,dy=focus.y-camera.y,dz=focus.z-camera.z;
 const lengthSq=dx*dx+dy*dy+dz*dz;
 if(lengthSq<.0001)return 1;
 const x=point.x-camera.x,y=point.y-camera.y,z=point.z-camera.z;
 const t=(x*dx+y*dy+z*dz)/lengthSq;
 const clamped=MathUtils.clamp(t,0,1);
 const distance=Math.hypot(x-dx*clamped,y-dy*clamped,z-dz*clamped);
 const along=MathUtils.smoothstep(t,0,.08)*(1-MathUtils.smoothstep(t,.9,1));
 const corridor=1-along*(1-MathUtils.smoothstep(distance,.45,1.1));
 return Math.min(corridor,MathUtils.smoothstep(Math.hypot(x,y,z),.45,.9));
}
export function installFoliageView(material:MeshStandardMaterial):void {
 const view={camera:{value:new Vector3()},focus:{value:new Vector3()}};
 material.userData.foliageView=view;
 material.transparent=false;material.depthWrite=true;
 material.customProgramCacheKey=()=> 'm21-local-foliage-v1';
 material.onBeforeCompile=shader=>{
  shader.uniforms.foliageCamera=view.camera;shader.uniforms.foliageFocus=view.focus;
  shader.vertexShader='varying vec3 foliageWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    vec4 foliagePosition=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
      foliagePosition=instanceMatrix*foliagePosition;
    #endif
    foliageWorld=(modelMatrix*foliagePosition).xyz;`);
  shader.fragmentShader='varying vec3 foliageWorld; uniform vec3 foliageCamera; uniform vec3 foliageFocus;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
    vec3 segment=foliageFocus-foliageCamera;
    float lengthSq=max(dot(segment,segment),0.0001);
    vec3 relative=foliageWorld-foliageCamera;
    float along=dot(relative,segment)/lengthSq;
    float distanceToLine=length(relative-segment*clamp(along,0.0,1.0));
    float corridor=smoothstep(0.0,0.08,along)*(1.0-smoothstep(0.9,1.0,along));
    float visibility=1.0-corridor*(1.0-smoothstep(0.45,1.1,distanceToLine));
    visibility=min(visibility,smoothstep(0.45,0.9,length(relative)));
    float threshold=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(0.06711056,0.00583715))));
    if(visibility<threshold)discard;`);
 };
}
export function updateFoliageView(material:MeshStandardMaterial,camera:Vector3,focus:Vector3):void {
 const view=material.userData.foliageView;
 if(view){view.camera.value.copy(camera);view.focus.value.copy(focus);}
}
