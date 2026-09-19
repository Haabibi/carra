import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3011/#/analyze/new');
  await page.locator('#document-sample').selectOption('estimate-19');
  await page.getByRole('button', { name: 'Read document', exact: true }).click();
  await page.waitForURL(/\/review$/);
  await page.getByRole('button', { name: 'Looks right, explain it' }).click();
  await page.locator('#row-0').click();
  assert.equal(await page.locator('#detail-0 .detail-head').count(), 0);
  assert.match(await page.locator('#row-0').innerText(), /Shop suggestion/);
  assert.match(await page.locator('#detail-0').innerText(), /Above the reference range/);
  assert.match(await page.locator('#detail-0').innerText(), /\$58.00 above/);
  assert.equal(await page.locator('#detail-0 .quote-card').isVisible(), false);
  await page.waitForFunction(() => document.querySelector('#detail-0 .part-photo img')?.naturalWidth > 0);
  await page.locator('.item').first().screenshot({ path: 'artifacts/item-simple-desktop.png' });
  await page.locator('#detail-0 .price-context summary').click();
  assert.match(await page.locator('#detail-0 .price-context').innerText(), /ZIP code/);
  await page.locator('#detail-0 .item-evidence summary').click();
  assert.equal(await page.locator('#detail-0 .quote-card').isVisible(), true);
  await page.keyboard.press('Escape');
  const photos = await page.evaluate(async () => {
    const results = [];
    for (const [kind, photo] of Object.entries(CarraPartPhotos)) {
      const img = new Image(); img.src = photo.src;
      await img.decode();
      results.push({kind, loaded: img.naturalWidth > 0, credited: Boolean(photo.author && photo.source && photo.license)});
    }
    return results;
  });
  assert.equal(photos.length, 8);
  assert.ok(photos.every(p => p.loaded && p.credited));
  assert.equal(await page.locator('#row-0').evaluate(el => el === document.activeElement), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#row-0').click();
  await page.locator('#item-sheet').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#sheet-title').count(), 1);
  assert.equal(await page.locator('#sheet-title').evaluate(el => el === document.activeElement), true);
  assert.ok(await page.locator('#item-sheet').evaluate(el => el.scrollWidth <= el.clientWidth));
  await page.locator('#item-sheet').screenshot({ path: 'artifacts/item-simple-mobile.png' });
  await page.locator('#item-sheet .part-photo summary').click();
  await page.locator('#item-sheet .part-photo a').filter({ hasText: 'Wikimedia Commons source' }).waitFor({state:'visible'});
  await page.locator('#item-sheet .part-photo img').evaluate(img => { img.src = '/missing-demo-photo.jpg'; });
  await page.locator('#item-sheet [data-photo-fallback]').waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log('Item detail passed: original screenshot sample, nonduplicated header, clear status, sourced price range, illustration, disclosures, keyboard and mobile sheet.');
} finally { await browser.close(); }
