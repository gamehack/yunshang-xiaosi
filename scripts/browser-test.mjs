import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
const out=process.env.ARTIFACT_DIR||'artifacts/browser';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[],requests=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push({url:r.url(),error:r.failure()?.errorText}));
await page.addInitScript(()=>{const seed=sessionStorage.getItem('test-fixture');if(seed){localStorage.setItem('banrixian.guest.v1',seed);sessionStorage.removeItem('test-fixture');}});
await page.addInitScript(()=>{const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.__audio=this;}};});
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const key='banrixian.guest.v1';
async function ready(){await page.waitForFunction(()=>document.querySelector('canvas')&&document.querySelector('#metrics')?.textContent.includes('FPS'),{timeout:45000});}
async function saved(){await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));const result=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));return result;}
async function at(x,z,view={yaw:0,pitch:.43,distance:11}){
 await page.evaluate(({key,x,z,view})=>sessionStorage.setItem('test-fixture',JSON.stringify({version:1,x,z,seated:false,...view,savedAt:Date.now()})),{key,x,z,view});
 // Test fixtures seed observation points, not evidence of traversing the route.
 await page.goto(base);await ready();
}
async function shot(name){await page.screenshot({path:`${out}/${name}.png`});}
try{
 await page.goto(base);await ready();assert.equal(await page.locator('canvas').count(),1);checks.push('initialization');
 assert.equal(await page.locator('#ambient').getAttribute('aria-pressed'),'false');
 await page.locator('#ambient').click();assert.equal(await page.locator('#ambient').getAttribute('aria-pressed'),'true');
 await page.locator('#ambient-volume').fill('35');await page.locator('#ambient-volume').dispatchEvent('input');
 await page.locator('#ambient').click();assert.equal(await page.locator('#ambient').getAttribute('aria-pressed'),'false');checks.push('gesture-only audio toggle and volume');
 await page.locator('#ambient').click();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForFunction(()=>window.__audio.state==='suspended');assert.equal(await page.locator('#ambient').getAttribute('aria-pressed'),'false');
 await page.evaluate(()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});await ready();checks.push('visibility handler suspends real audio context');
 await at(0,8);await shot('01-entrance');
 await page.keyboard.down('w');await page.waitForTimeout(2000);await shot('08-walking');await page.keyboard.up('w');
 let state=await saved();assert.ok(state.z<8);checks.push('W movement');
 const beforeArrow=state.z;await page.keyboard.down('ArrowUp');await page.waitForTimeout(1500);await page.keyboard.up('ArrowUp');state=await saved();assert.ok(state.z<beforeArrow);checks.push('ArrowUp movement');
 await page.reload();await ready();assert.ok(Math.abs((await saved()).z-state.z)<.01);checks.push('refresh resume');
 await page.mouse.move(800,400);await page.mouse.down();await page.mouse.move(1000,450,{steps:10});await page.mouse.up();
 state=await saved();assert.ok(Math.abs(state.yaw)>.5);checks.push('mouse rotation');
 await page.mouse.wheel(0,300);await page.waitForTimeout(300);assert.ok((await saved()).distance>11);checks.push('wheel zoom');
 await at(0,8);
 const camera=new PerspectiveCamera(62,1280/720,.1,300);camera.position.set(0,1+Math.sin(.43)*11+1.1,8+Math.cos(.43)*11);camera.lookAt(0,1.8,8);camera.updateMatrixWorld();
 const point=new Vector3(0,0,4).project(camera);
 await page.mouse.click((point.x+1)*640,(1-point.y)*360);await page.waitForTimeout(500);assert.equal(await page.locator('#stop').isVisible(),true);
 await page.keyboard.press('Escape');await page.waitForTimeout(500);assert.equal(await page.locator('#stop').isVisible(),false);checks.push('ground click routing and Escape stop');
 await page.mouse.click((point.x+1)*640,(1-point.y)*360);await page.waitForTimeout(500);await page.locator('#stop').click();await page.waitForTimeout(300);assert.equal(await page.locator('#stop').isVisible(),false);checks.push('stop button cancels routing');
 await page.locator('#reset').click();assert.equal((await saved()).z,8);checks.push('reset');
 for(const [name,x,z,yaw,pitch,distance] of [
 ['02-overview',0,6,.7,.9,19],['03-teahouse-exterior',-3,-7,1,.43,11],['04-teahouse-interior',-6,-9,0,.25,5],['05-bamboo',0,-50,.4,.3,11],['06-bridge-pond',0,2,-1,.6,11],['07-lookout',0,-94,0,.3,11]]){
  await at(x,z,{yaw,pitch,distance});await shot(name);
 }
 // Walk from the courtyard into the tea approach through real mouse routing.
 await at(0,-7,{yaw:0,pitch:.43,distance:19});
 const teaCamera=new PerspectiveCamera(62,1280/720,.1,300);teaCamera.position.set(0,2.1+Math.sin(.43)*19,-7+Math.cos(.43)*19);teaCamera.lookAt(0,1.8,-7);teaCamera.updateMatrixWorld();
 const teaTarget=new Vector3(-8,0,-6.5).project(teaCamera);
 await page.mouse.click((teaTarget.x+1)*640,(1-teaTarget.y)*360);await page.waitForTimeout(500);
 await page.waitForFunction(()=>!document.querySelector('#stop').hidden,{timeout:10000});
 await page.waitForFunction(()=>document.querySelector('#stop').hidden,{timeout:120000});
 assert.ok((await saved()).x<-7.5);checks.push('courtyard to tea approach via real ground click');
 for(const [name,x,z] of [['tea',-8,-6.5],['lake',0,-94]]){
  await at(x,z);await page.locator('#seat').click();await page.waitForTimeout(1500);assert.equal((await saved()).seated,true);await shot(`09-seated-${name}`);
  await page.reload();await ready();assert.equal(await page.locator('#seat').textContent(),'起身');assert.equal((await saved()).seated,true);
  await page.locator('#seat').click();assert.equal((await saved()).seated,false);checks.push(`${name} sit, reload and stand`);
 }
 await page.locator('#quality').click();assert.equal(await page.locator('#quality').textContent(),'画质：精细');await page.locator('#quality').click();assert.equal(await page.locator('#quality').textContent(),'画质：省电');checks.push('quality cycle');
 // Fault injection uses real WebGL extension, not a synthetic DOM event.
 const beforeLoss=await saved();
 await page.evaluate(()=>window.__lose=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context'));
 await page.evaluate(()=>window.__lose.loseContext());await page.waitForTimeout(1000);assert.match(await page.locator('#metrics').textContent(),/恢复/);
 await page.keyboard.down('w');await page.evaluate(()=>window.__lose.restoreContext());await ready();await page.keyboard.up('w');const afterLoss=await saved();assert.ok(Math.hypot(afterLoss.x-beforeLoss.x,afterLoss.z-beforeLoss.z)<.01);checks.push('WebGL loss and restoration clears held movement');
 // Storage rejection must not prevent rendering or controls.
 const denied=await browser.newPage({viewport:{width:800,height:600}});
 denied.on('pageerror',e=>errors.push(e.message));
 await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}}));
 await denied.goto(base);await denied.waitForSelector('canvas');await denied.locator('#reset').click();await denied.close();checks.push('denied storage fallback');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log(JSON.stringify({checks,errors,requests,metrics:await page.locator('#metrics').textContent()}));
 await writeFile(`${out}/report.json`,JSON.stringify({date:new Date().toISOString(),browser:browser.version(),viewport:'1280x720',dpr:1,renderer:'Chromium SwiftShader software (not real PC performance)',checks,errors,requests,metrics:await page.locator('#metrics').textContent()},null,2));
}finally{await browser.close();}
// A real WebGL-disabled browser must show a comprehensible fallback without an unhandled exception.
const unsupported=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox','--disable-webgl']});
try{
 const p=await unsupported.newPage();const failures=[];p.on('pageerror',e=>failures.push(e.message));
 await p.goto(base);await p.getByRole('alert').waitFor();assert.match(await p.getByRole('alert').textContent(),/园林暂时无法加载/);assert.deepEqual(failures,[]);
 await p.screenshot({path:`${out}/10-webgl-unavailable.png`});
 console.log('WebGL-disabled initialization fallback passed');
 await writeFile(`${out}/fallback.json`,JSON.stringify({check:'WebGL-disabled initialization fallback',passed:true,errors:failures},null,2));
}catch(error){throw error;}finally{await unsupported.close();}
