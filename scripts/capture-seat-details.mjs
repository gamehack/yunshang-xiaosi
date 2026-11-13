import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {waitForSceneReady} from './browser-sync.mjs';
const out=`${process.env.ARTIFACT_DIR||'artifacts/browser'}/seat-details`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],errors=[];
try{
 for(const [name,x,z] of [['tea',-8,-6.5],['lake',0,-94]]){
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{if(event.detail.isScene)window.__observedScene=event.detail;});});
  await page.addInitScript(({x,z})=>localStorage.setItem('banrixian.guest.v1',JSON.stringify({version:1,x,z,seated:false,yaw:Math.PI/2,pitch:.25,distance:5,savedAt:Date.now()})),{x,z});
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173');await waitForSceneReady(page);
  await page.locator('#seat').click();
  // Wait for the observed pelvis to settle onto the rendered seat at any frame rate.
  await page.waitForFunction(()=>{
   const avatar=window.__observedScene?.children.find(object=>object.userData.limbs);
   if(!avatar)return false;
   const seat=window.__observedScene.children.find(object=>object.geometry?.type==='BoxGeometry' && object.geometry.parameters.height<1 && Math.abs(object.position.x-avatar.position.x)<.001 && Math.abs(object.position.z-avatar.position.z)<.001);
   if(!seat)return false;
   const pelvis=avatar.userData.limbs.pelvis;pelvis.geometry.computeBoundingBox();seat.geometry.computeBoundingBox();
   return Math.abs(pelvis.geometry.boundingBox.clone().applyMatrix4(pelvis.matrixWorld).min.y-seat.geometry.boundingBox.clone().applyMatrix4(seat.matrixWorld).max.y)<.001;
  },null,{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#seat').textContent==='起身',null,{timeout:10000});
  await page.screenshot({path:`${out}/${name}-side.png`});const geometry=await page.evaluate(()=>{
   const scene=window.__observedScene,avatar=scene.children.find(object=>object.userData.limbs);
   const pelvis=avatar.userData.limbs.pelvis;pelvis.geometry.computeBoundingBox();
   const pelvisBox=pelvis.geometry.boundingBox.clone().applyMatrix4(pelvis.matrixWorld);
   const benches=scene.children.filter(object=>object.geometry?.type==='BoxGeometry' && object.geometry.parameters.height<1 && Math.abs(object.position.x-avatar.position.x)<.001 && Math.abs(object.position.z-avatar.position.z)<.001).map(object=>{object.geometry.computeBoundingBox();const box=object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);return {position:object.position.toArray(),min:box.min.toArray(),max:box.max.toArray()};});
   return {avatar:avatar.position.toArray(),seatBlend:avatar.userData.seatBlend,pelvisMin:pelvisBox.min.toArray(),benches};
  });
  assert.equal(geometry.benches.length,1,`${name} must have a visible seat directly below the visitor`);
  assert.ok(Math.abs(geometry.pelvisMin[1]-geometry.benches[0].max[1])<.002,`${name} pelvis must rest on the actual rendered seat`);
  results.push({seat:name,screenshot:`${name}-side.png`,view:'right side',settlingCondition:'observed pelvis rests on rendered seat within 1mm',geometry});await page.close();
 }
 await writeFile(`${out}/report.json`,JSON.stringify({browser:browser.version(),viewport:'1280x720',dpr:1,renderer:'SwiftShader software',results,errors},null,2));
 if(errors.length)throw new Error(JSON.stringify(errors));
 console.log(JSON.stringify({results,errors}));
}catch(error){console.error('::error title=Seat detail regression::'+String(error));throw error;}finally{await browser.close();}
