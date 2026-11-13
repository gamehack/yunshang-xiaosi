export async function waitForSceneReady(page, timeoutMs=45000) {
  await page.waitForFunction(()=>document.querySelector('canvas') && document.querySelector('#metrics')?.textContent.includes('FPS'),null,{timeout:timeoutMs});
}

export async function setAmbientPlaying(page, playing, timeoutMs=10000) {
  await page.locator('#ambient').click();
  await page.waitForFunction(expected=>{
    const button=document.querySelector('#ambient');
    return button && !button.disabled && button.getAttribute('aria-pressed')===expected;
  },String(playing),{timeout:timeoutMs});
}
