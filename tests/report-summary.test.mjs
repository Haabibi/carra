import test from 'node:test';
import assert from 'node:assert/strict';
import { dataset, datasetDraft, getSample } from '../lib/documents.js';
import { buildReport, verifyQuote, forbiddenCopy } from '../lib/core.js';
const build=id=>buildReport(datasetDraft(getSample(id)));
test('all 60 documents have tailored, source-backed summaries instead of generic filler',()=>{
 const headlines=new Set();
 for(const entry of dataset){
  const r=buildReport(datasetDraft(entry)), s=r.atAGlance;
  assert.equal(s.curated,true,entry.id);
  assert.ok(s.keyPoints.length>=2 && s.keyPoints.length<=3,entry.id);
  assert.ok(!/Here is what|Here is the work|line items are listed|Public records were not checked/.test(JSON.stringify(s)),entry.id);
  for(const point of s.keyPoints){assert.ok(point.quoteIds.length);for(const id of point.quoteIds)assert.ok(verifyQuote(r.quotes[id],r.sources),entry.id+':'+id);}
  for(const text of [s.headline,s.estimateRequest,s.simpleNextStep,...s.keyPoints.map(k=>k.text)])assert.equal(forbiddenCopy.test(text),false,entry.id+':'+text);
  headlines.add(s.headline);
 }
 assert.equal(headlines.size,60);
});
test('deposits, authorization caps, declined work, and zero-dollar warranty returns stay distinct',()=>{
 const deposit=build('estimate-16').atAGlance;assert.match(deposit.keyPoints[0].text,/300.00.*669.16/);assert.equal(deposit.workLabel,'Invoice covers');
 assert.match(build('estimate-17').atAGlance.keyPoints[0].text,/250.00/);
 assert.match(build('service_record-20').atAGlance.keyPoints[0].text,/Declined, not completed/);
 const zero=build('service_record-15').atAGlance;assert.match(zero.headline,/warranty return/);assert.match(zero.totalLine,/\$0.00 recorded/);
 assert.match(build('estimate-26').atAGlance.keyPoints[0].text,/conditional/);
 assert.match(build('service_record-26').atAGlance.headline,/actuator repair/);
});
test('edited documents lose stale curated conclusions and retain recomputed facts',()=>{
 const d=datasetDraft(getSample('service_record-15'));d.total=100;
 const r=buildReport(d);assert.equal(r.atAGlance.curated,false);assert.doesNotMatch(r.atAGlance.headline,/no charge/);assert.match(r.atAGlance.totalLine,/do not match/);
 const deposit=datasetDraft(getSample('estimate-16'));deposit.total=1200;
 assert.doesNotMatch(JSON.stringify(buildReport(deposit).atAGlance),/669.16/);
 const changed=datasetDraft(getSample('estimate-29'));changed.items[2].status='declined';
 const summary=buildReport(changed).atAGlance;assert.equal(summary.curated,false);assert.match(summary.keyPoints[0].text,/Declined/);assert.doesNotMatch(summary.estimateRequest,/replacement is conditional/);
});
test('missing totals and arbitrary uploads never inherit sample-specific claims',()=>{
 const d=datasetDraft(getSample('estimate-29'));d.origin='ai';d.total=null;
 const r=buildReport(d);assert.equal(r.atAGlance.curated,false);assert.match(r.atAGlance.keyPoints[0].text,/amounts are missing/);assert.ok(!r.quotes.DN);
});
