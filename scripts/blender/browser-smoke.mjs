import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const output = process.env.ARTIFACT_DIR || 'artifacts/blender-smoke';
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const path = '/dev/blender-smoke/';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const report = { browser: browser.version(), renderer: 'SwiftShader', results: [] };

try {
  await mkdir(output, { recursive: true });
  for (const [width, height] of [[1366, 768], [1920, 1080]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    const glb = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.url().endsWith('.glb')) glb.push(response.status());
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    try {
      await page.goto(new URL(path, base).href);
      const status = page.getByRole('status');
      await page.waitForFunction(() => document.querySelector('#status')?.dataset.state !== 'loading');
      assert.equal(await status.getAttribute('data-state'), 'ready', (await status.textContent()) ?? '');
      assert.match(await status.textContent(), /2\.00 × 1\.80 × 0\.80/);
      assert.equal(await page.locator('canvas').count(), 1);
      assert.deepEqual(glb, [200]);
      const screenshot = `fixture-${width}x${height}.png`;
      await page.screenshot({ path: join(output, screenshot) });
      assert.deepEqual(errors, []);
      report.results.push({ width, height, status: await status.textContent(), glb, errors, screenshot });
    } catch (error) {
      report.results.push({ width, height, glb, errors, failure: String(error) });
      await page.screenshot({ path: join(output, `failure-${width}x${height}.png`) }).catch(() => {});
      throw error;
    } finally {
      await page.close();
    }
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await writeFile(join(output, 'fixture-report.json'), JSON.stringify(report, null, 2));
}
