import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {waitForSceneReady} from './browser-sync.mjs';
const stage=process.env.VISUAL_STAGE||'after';
const out=process.env.ARTIFACT_DIR||`docs/evidence/m21/${stage}`;
const scenarios=[
 ['default',0,8,null],['gate',0,16,[.45,.65,13]],['bamboo',0,-50,[.8,.35,11]],['bamboo-near',0,-50,[Math.PI/2,.16,7]],
 ['tea',-4,-7,[.7,.5,11]],['bridge',0,2,[-1,.6,11]],['pond',18,0,[Math.PI/2,.65,15]],['lake',0,-94,[0,.3,11]],
 ['avatar-front',0,8,[0,.18,5]],['avatar-side',0,8,[Math.PI/2,.18,5]],['avatar-back',0,8,[Math.PI,.18,5]],
 ['avatar-walk',0,8,[0,.18,5]],['seat-tea',-8,-6.5,[Math.PI/2,.25,5]],['seat-lake',0,-94,[Math.PI/2,.25,5]]
];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const records=[],errors=[],requests=[];
try{
 for(const [width,height] of [[1920,1080],[1366,768]]){
  const folder=`${out}/${width}x${height}`;await mkdir(folder,{recursive:true});
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('requestfailed',request=>requests.push({url:request.url(),error:request.failure()?.errorText}));
  await page.addInitScript(()=>{
   window.__THREE_DEVTOOLS__=new EventTarget();
   window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{
    const object=event.detail;if(object.isScene)window.__scene=object;
    if(object.isWebGLRenderer){window.__renderer=object;const render=object.render;object.render=function(scene,camera){window.__camera=camera;return render.call(this,scene,camera);};}
   });
   const fixture=sessionStorage.getItem('m21-fixture');localStorage.clear();
   if(fixture)localStorage.setItem('banrixian.guest.v1',fixture);
  });
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173');await waitForSceneReady(page,90000);
  for(const [name,x,z,view] of scenarios){
   if(process.env.VISUAL_SCENES && !process.env.VISUAL_SCENES.split(',').includes(name))continue;
   await page.evaluate(({x,z,view})=>{if(view)sessionStorage.setItem('m21-fixture',JSON.stringify({version:1,x,z,seated:false,yaw:view[0],pitch:view[1],distance:view[2],savedAt:Date.now()}));else sessionStorage.removeItem('m21-fixture');},{x,z,view});
   await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173');await waitForSceneReady(page,90000);
   if(name.startsWith('seat-')){
    await page.locator('#seat').click();
    await page.waitForFunction(()=>window.__scene.children.find(object=>object.userData.limbs)?.userData.seatBlend>.999,null,{timeout:60000});
   }
   if(name==='avatar-walk'){await page.keyboard.down('w');await page.waitForTimeout(1500);}
   await page.screenshot({path:`${folder}/${name}.png`});
   if(name==='avatar-walk')await page.keyboard.up('w');
   const details=await page.evaluate(()=>{
    const avatar=window.__scene.children.find(object=>object.userData.limbs);
    return {camera:window.__camera.position.toArray(),fov:window.__camera.fov,avatar:avatar.position.toArray(),drawCalls:window.__renderer.info.render.calls,triangles:window.__renderer.info.render.triangles,glError:window.__renderer.getContext().getError(),metrics:document.querySelector('#metrics').textContent};
   });
   if(details.glError!==0)errors.push(`${name}: WebGL error ${details.glError}`);
   records.push({name,width,height,view,quality:'均衡',dpr:1,...details});
   console.log(`${stage} ${width}x${height} ${name}: ${details.drawCalls} calls / ${details.triangles} triangles`);
  }
  // Same real drag/wheel/movement sequence at a near-forest camera, independent of screenshot fixtures.
  await page.mouse.move(width*.65,height*.55);await page.mouse.down();await page.mouse.move(width*.85,height*.48,{steps:15});await page.mouse.up();await page.mouse.wheel(0,200);await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');
  await page.close();
 }
 await writeFile(`${out}/report.json`,JSON.stringify({stage,browser:browser.version(),renderer:'SwiftShader software; not real PC performance',records,errors,requests},null,2));
 if(errors.length||requests.length)throw new Error(JSON.stringify({errors,requests}));
}finally{await browser.close();}
