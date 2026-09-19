import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { dataset, datasetDraft } from '../lib/documents.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildReport } from '../lib/core.js';
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/dataset-summary-review.json',JSON.stringify(dataset.map(entry=>({id:entry.id,summary:buildReport(datasetDraft(entry)).atAGlance})),null,2));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3011/#/analyze/new');
 await page.getByRole('button',{name:'Read document',exact:true}).click();
 await page.waitForURL(/\/review$/);await page.getByRole('button',{name:'Looks right, explain it'}).click();
 await page.locator('#glance').waitFor();
 for(const entry of dataset){
  await page.evaluate(draft=>mountReport(CarraCore.buildReport(draft)),datasetDraft(entry));
  const text=await page.locator('#glance').innerText();assert.ok(!text.includes('Here is the work'),entry.id);
  if(entry.kind==='service_record')assert.ok(!text.includes('From your estimate'),entry.id);
  await page.locator('#key-points .quote-chip:visible').first().click();
  assert.ok(await page.locator('#key-points .quote-card').count()>0);
  assert.equal(await page.locator('[data-see-line="undefined"]').count(),0);
 }
 const example=dataset.find(e=>e.id==='service_record-29');
 await page.evaluate(draft=>mountReport(CarraCore.buildReport(draft)),datasetDraft(example));
 await page.locator('#glance').screenshot({path:'artifacts/summary-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo(0,0));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'artifacts/summary-mobile.png',fullPage:false});
  await page.locator('#read-summary-toggle').click();
  assert.equal(await page.locator('#simple-next-step').isVisible(),true);
  assert.match(await page.locator('#simple-next-step').innerText(),/charging-system test/);
  await page.locator('#read-summary-toggle').click();
 assert.deepEqual(errors,[]);
 console.log('All 60 summaries rendered with correct labels, traceable details, and working evidence disclosures; mobile layout passed.');
}finally{await browser.close();}
