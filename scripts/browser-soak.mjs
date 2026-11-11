import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.ARTIFACT_DIR||'artifacts/soak';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:600},deviceScaleFactor:1});
const errors=[],samples=[];page.on('pageerror',e=>errors.push(e.message));
const start=Date.now();
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173/');await page.waitForSelector('canvas');
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 for(let i=0;i<20;i++){
  const key=i<10?'w':'s';await page.keyboard.down(key);await page.waitForTimeout(30000);await page.keyboard.up(key);
  await page.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
  const position=await page.evaluate(()=>JSON.parse(localStorage.getItem('banrixian.guest.v1')));
  const metrics=await cdp.send('Performance.getMetrics');
  samples.push({position,elapsedMs:Date.now()-start,hud:await page.locator('#metrics').textContent(),jsHeapUsed:metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value});
 }
 await page.screenshot({path:`${out}/final.png`});
 const report={elapsedMs:Date.now()-start,browser:browser.version(),renderer:'SwiftShader software; NOT real PC performance',viewport:'960x600',dpr:1,quality:'均衡',scenario:'5 minutes northward W from entry through bamboo to lookout, 5 minutes southward S back to entry',samples,errors};
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(errors.length || !samples.some(s=>s.position.z<-90) || samples.at(-1).position.z<0)process.exitCode=1;
}finally{await browser.close();}
