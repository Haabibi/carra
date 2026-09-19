import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3011/#/analyze/new');
  await page.waitForFunction(() => document.querySelector('.pdf-scroll canvas')?.width > 0);
  await page.screenshot({ path: 'artifacts/theme-input-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  const capture = async name => {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal overflow`);
    await page.screenshot({ path: `artifacts/theme-${name}.png`, fullPage: true });
  };
  await capture('input-mobile');
  await page.getByRole('button', { name: 'Read document', exact: true }).click();
  await page.waitForURL(/\/review$/);
  await capture('review-mobile');
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.evaluate(() => { location.hash = location.hash.replace('/review', '/progress'); });
  await page.locator('.progress-grid').waitFor();
  await capture('progress-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture('progress-desktop');
  await page.clock.runFor(1000);
  await page.locator('#vehicle-name').waitFor({ state: 'visible' });
  await page.goto('http://localhost:3011/#/my');
  await page.setViewportSize({ width: 360, height: 800 });
  await capture('my-mobile');
  assert.deepEqual(errors, []);
  console.log('Design review passed: loaded PDF, 360px intake/review/progress/My page, desktop progress, reduced-motion completion.');
} finally { await browser.close(); }
