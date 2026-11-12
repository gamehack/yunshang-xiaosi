import assert from 'node:assert/strict';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { waitForSceneReady } from '../browser-sync.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = process.env.ARTIFACT_DIR || 'artifacts/teahouse-review';
const guest = 'banrixian.guest.v1';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const report = { browser: browser.version(), renderer: 'SwiftShader', comparisons: [], interaction: [] };

async function open(page, url, view) {
  await page.addInitScript(({ key, fixture }) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ version: 1, seated: false, savedAt: Date.now(), ...fixture }));
    }
  }, { key: guest, fixture: view });
  await page.goto(url);
  await waitForSceneReady(page);
}

async function guestState(page) {
  return page.evaluate(key => {
    dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    const state = JSON.parse(localStorage.getItem(key));
    dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    return state;
  }, guest);
}

const overview = { x: -2.5, z: -5.4, yaw: 1.16, pitch: .29, distance: 12.5 };
const preview = new URL('/?art=teahouse', base).href;
const glbPath = '/dev/art-preview/generated/teahouse.glb';

try {
  await mkdir(output, { recursive: true });
  report.assetBytes = (await stat(new URL(`../../${glbPath.slice(1)}`, import.meta.url))).size;
  for (const [width, height] of [[1366, 768], [1920, 1080]]) {
    for (const variant of ['before', 'after']) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const errors = [];
      const glb = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('requestfailed', request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
      page.on('response', response => {
        if (response.url().endsWith(glbPath)) glb.push(response.status());
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      try {
        await open(page, variant === 'after' ? preview : base, overview);
        assert.equal(await page.locator('#app').getAttribute('data-art'), variant === 'after' ? 'teahouse' : null);
        assert.deepEqual(glb, variant === 'after' ? [200] : []);
        await page.locator('#hud-toggle').click();
        const screenshot = `${variant}-${width}x${height}.jpg`;
        await page.screenshot({ path: join(output, screenshot), quality: 88 });
        assert.deepEqual(errors, []);
        report.comparisons.push({ width, height, variant, screenshot, glb, errors,
          metrics: await page.locator('#metrics').textContent() });
      } finally {
        await page.close();
      }
    }
  }

  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await open(page, preview, { x: -8, z: -6.5, yaw: 0, pitch: .43, distance: 8 });
  assert.equal(await page.locator('#app').getAttribute('data-art'), 'teahouse');
  await page.locator('#seat').click();
  assert.equal((await guestState(page)).seated, true);
  await page.reload();
  await waitForSceneReady(page);
  assert.equal(await page.locator('#seat').textContent(), '起身');
  await page.locator('#seat').click();
  const standing = await guestState(page);
  assert.equal(standing.seated, false);
  await page.locator('canvas').click({ position: { x: 670, y: 530 } });
  await page.keyboard.press('Escape');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(({ key, x, z }) => {
    const state = JSON.parse(localStorage.getItem(key));
    return Math.hypot(state.x - x, state.z - z) > .4;
  }, { key: guest, x: standing.x, z: standing.z }, { timeout: 15000 });
  await page.keyboard.up('ArrowRight');
  await page.locator('#reset').click();
  const reset = await guestState(page);
  assert.equal(reset.x, 0);
  assert.equal(reset.z, 8);
  assert.deepEqual(errors, []);
  report.interaction.push('sit, reload, stand, keyboard movement, reset');
  await page.close();

  const missing = await browser.newPage();
  await missing.route(`**${glbPath}`, route => route.abort());
  await open(missing, preview, overview);
  assert.equal(await missing.locator('#app').getAttribute('data-art'), 'fallback');
  assert.equal(await missing.locator('canvas').count(), 1);
  report.interaction.push('asset request failure leaves original garden playable');
  await missing.close();
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
}
