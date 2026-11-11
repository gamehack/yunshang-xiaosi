import {test,after,before} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {waitForSceneReady,setAmbientPlaying} from './browser-sync.mjs';
let browser;
before(async()=>{browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox']});});
after(async()=>{await browser?.close();});
test('scene readiness uses the requested timeout instead of the page default',async()=>{
 const page=await browser.newPage();
 try{
  await page.setContent('<div id="metrics">loading</div>');
  page.setDefaultTimeout(50);
  await page.evaluate(()=>setTimeout(()=>{document.body.append(document.createElement('canvas'));document.querySelector('#metrics').textContent='FPS 60';},200));
  await waitForSceneReady(page,2000);
  assert.equal(await page.locator('canvas').count(),1);
 }finally{await page.close();}
});
test('audio toggle waits for asynchronous completion in both directions',async()=>{
 const page=await browser.newPage();
 try{
  await page.setContent('<button id="ambient" aria-pressed="false">audio</button>');
  await page.evaluate(()=>document.querySelector('#ambient').addEventListener('click',async event=>{
   const button=event.currentTarget;button.disabled=true;
   await new Promise(resolve=>setTimeout(resolve,200));
   button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));button.disabled=false;
  }));
  for(const playing of [true,false]){
   await setAmbientPlaying(page,playing,2000);
   assert.equal(await page.locator('#ambient').getAttribute('aria-pressed'),String(playing));
   assert.equal(await page.locator('#ambient').isEnabled(),true);
  }
 }finally{await page.close();}
});
