import assert from 'node:assert/strict';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { PerspectiveCamera, Vector3 } from 'three';
import { waitForSceneReady } from '../browser-sync.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = process.env.ARTIFACT_DIR || 'artifacts/teahouse-review';
const guest = 'banrixian.guest.v1';
const hardware = process.env.REVIEW_RENDERER === 'hardware';
const headless = process.env.REVIEW_HEADED !== '1';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
  headless,
  args: hardware ? [] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const report = { browser: browser.version(), headless, renderer: '', comparisons: [], route: [], interaction: [] };

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

async function measureFrames(page, sampleMs = 5000) {
  return page.evaluate(async sampleMs => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unknown';
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
    const start = await frame();
    let previous = start;
    const durations = [];
    while (previous - start < sampleMs) {
      const current = await frame();
      durations.push(current - previous);
      previous = current;
    }
    const elapsed = previous - start;
    durations.sort((a, b) => a - b);
    return {
      renderer,
      frames: durations.length,
      elapsedMs: Math.round(elapsed),
      fps: Math.round(10000 * durations.length / elapsed) / 10,
      p95Ms: Math.round(durations[Math.ceil(durations.length * .95) - 1] * 10) / 10,
    };
  }, sampleMs);
}

function recordRenderer(renderer) {
  if (hardware) assert.doesNotMatch(renderer, /swiftshader|llvmpipe|software|warp|basic render|unknown/i);
  if (report.renderer) assert.equal(renderer, report.renderer);
  report.renderer = renderer;
}

const overview = { x: -2.5, z: -5.4, yaw: 1.16, pitch: .29, distance: 12.5 };
const pavilionView = { x: 14.3, z: -8.1, yaw: -.5, pitch: .22, distance: 6.2 };
const preview = new URL('/?art=teahouse', base).href;
const glbPath = '/art-preview/generated/teahouse.glb';
const pavilionPath = '/art-preview/generated/pavilion.glb';

function observeAssets(page) {
  const errors = [];
  const glb = [];
  const pavilionGlb = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on('response', response => {
    if (response.url().endsWith(glbPath)) glb.push(response.status());
    if (response.url().endsWith(pavilionPath)) pavilionGlb.push(response.status());
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  return { errors, glb, pavilionGlb };
}

async function captureView(page, name) {
  const { renderer, ...frames } = await measureFrames(page, 2000);
  recordRenderer(renderer);
  const { x, z, yaw, pitch, distance } = await guestState(page);
  const screenshot = name + '.jpg';
  await page.screenshot({ path: join(output, screenshot), quality: 88 });
  return { screenshot, x, z, yaw, pitch, distance, frames,
    metrics: await page.locator('#metrics').textContent() };
}

async function captureRoute(page) {
  const start = { x: 0, z: -4.6, yaw: 1.16, pitch: .29, distance: 12.5 };
  const target = { x: -6.1, z: -8.6 };
  await open(page, preview, start);
  assert.equal(await page.locator('#app').getAttribute('data-art'), 'teahouse');
  await page.locator('#hud-toggle').click();
  const { width, height } = page.viewportSize();
  report.route.push(await captureView(page, 'pondside-approach'));
  const camera = new PerspectiveCamera(62, width / height, .1, 300);
  const horizontal = Math.cos(start.pitch) * start.distance;
  camera.position.set(start.x + Math.sin(start.yaw) * horizontal,
    2.1 + Math.sin(start.pitch) * start.distance, start.z + Math.cos(start.yaw) * horizontal);
  camera.lookAt(start.x, 1.8, start.z);
  camera.updateMatrixWorld();
  const point = new Vector3(target.x, 0, target.z).project(camera);
  assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, 'Route target is within the viewport');
  await page.mouse.click((point.x + 1) * width / 2, (1 - point.y) * height / 2);
  await page.waitForFunction(() => !document.querySelector('#stop').hidden);
  await page.waitForFunction(() => document.querySelector('#stop').hidden, null, { timeout: 30000 });
  const arrival = await guestState(page);
  assert.ok(Math.hypot(arrival.x - target.x, arrival.z - target.z) < .5, 'Visitor reached the teahouse deck');

  await page.mouse.move(width * .3, height * .5);
  await page.mouse.down();
  await page.mouse.move(width * .3 + 546, height * .5 - 23, { steps: 12 });
  await page.mouse.up();
  for (let step = 0; step < 10; step++) await page.mouse.wheel(0, -120);
  const rotated = await guestState(page);
  assert.ok(Math.abs(rotated.yaw - start.yaw) > 3);
  assert.equal(rotated.distance, 5);
  report.route.push(await captureView(page, 'under-eaves-facing-pond'));
  report.interaction.push('pondside ground click reaches teahouse deck, camera turns back toward the pond');
}

try {
  await mkdir(output, { recursive: true });
  report.assetBytes = (await stat(new URL(`../../${glbPath.slice(1)}`, import.meta.url))).size;
  report.pavilionBytes = (await stat(new URL(`../../${pavilionPath.slice(1)}`, import.meta.url))).size;
  for (const [width, height] of (process.env.REVIEW_SKIP_COMPARISONS === '1' ? [] : [[1366, 768], [1920, 1080]])) {
    for (const variant of ['before', 'after']) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const { errors, glb, pavilionGlb } = observeAssets(page);
      try {
        await open(page, variant === 'after' ? preview : base, overview);
        assert.equal(await page.locator('#app').getAttribute('data-art'), variant === 'after' ? 'teahouse' : null);
        assert.equal(await page.locator('#app').getAttribute('data-pavilion'), variant === 'after' ? 'loaded' : null);
        assert.deepEqual(glb, variant === 'after' ? [200] : []);
        assert.deepEqual(pavilionGlb, variant === 'after' ? [200] : []);
        await page.locator('#hud-toggle').click();
        const { renderer, ...frames } = await measureFrames(page);
        recordRenderer(renderer);
        const screenshot = `${variant}-${width}x${height}.jpg`;
        await page.screenshot({ path: join(output, screenshot), quality: 88 });
        assert.deepEqual(errors, []);
        report.comparisons.push({ width, height, variant, screenshot, glb, pavilionGlb, errors, frames,
          metrics: await page.locator('#metrics').textContent() });
      } finally {
        await page.close();
      }
    }
  }

  const route = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const { errors: routeErrors } = observeAssets(route);
  await captureRoute(route);
  await route.close();
  report.routeErrors = routeErrors;
  assert.deepEqual(routeErrors, []);

  const near = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const nearAssets = observeAssets(near);
  await open(near, preview, pavilionView);
  assert.equal(await near.locator('#app').getAttribute('data-pavilion'), 'loaded');
  await near.locator('#hud-toggle').click();
  report.pavilionView = { ...await captureView(near, 'pavilion-near-bank'), ...nearAssets };
  assert.deepEqual(nearAssets.pavilionGlb, [200]);
  assert.deepEqual(nearAssets.errors, []);
  await near.close();

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

  const missingPavilion = await browser.newPage();
  await missingPavilion.route(`**${pavilionPath}`, route => route.abort());
  await open(missingPavilion, preview, pavilionView);
  assert.equal(await missingPavilion.locator('#app').getAttribute('data-art'), 'teahouse');
  assert.equal(await missingPavilion.locator('#app').getAttribute('data-pavilion'), 'fallback');
  await missingPavilion.locator('#reset').click();
  assert.equal((await guestState(missingPavilion)).z, 8);
  report.interaction.push('pavilion request failure preserves teahouse preview and reset');
  await missingPavilion.close();
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
}
