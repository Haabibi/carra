import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalog, dataset, datasetDraft, getSample, parseUpload, validateUpload, mapDocument } from '../lib/documents.js';
import { buildReport, reconcile } from '../lib/core.js';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP1sAAAAASUVORK5CYII=';
const image = { name: 'photo.png', type: 'image/png', data: png };
const bodyFor = entry => ({ files: [{ name: entry.file, type: 'application/pdf', data: entry.bytes.toString('base64') }] });
function extraction() {
  const e = structuredClone(getSample('estimate-29').expected);
  return { parse_metadata: { document_type: 'estimate', language: 'en', currency: 'USD', overall_confidence: .9, needs_review: false, review_reasons: [], page_count: 1 },
    document: { number: e.document_number, date: e.date, status: 'estimate' }, shop: { name: e.shop_name, address: null, phone: null },
    vehicle: { year: e.vehicle.year, make: e.vehicle.make, model: e.vehicle.model, mileage: e.vehicle.mileage, vin: null, license_plate: null },
    customer_concern: e.customer_concern, items: e.items, totals: { ...e.totals, deposit: null, balance_due: null },
    authorization: { authorization_limit: null, additional_authorization_required: null, notes: null },
    driver_view: { headline: 'Listed battery work.', summary: 'The document lists testing and a possible battery replacement.', item_explanations: [], questions_to_ask: [{ question: 'What did the test show?', reason: 'Ask about the listed work.' }, { question: 'Can you confirm the scope?', reason: 'Clarify the listed work.' }], uncertainties: [] },
    guardrails: { diagnosis_made: false, price_fairness_judgment_made: false, mechanic_overruled: false, disclaimer: 'Discuss the listed work with the shop.' } };
}
test('all 60 original dataset documents preserve factual fields and completion states', () => {
  assert.equal(catalog().length, 60);
  for (const entry of dataset) {
    const draft = datasetDraft(entry);
    const expected = entry.expected.items || entry.expected.work_performed;
    assert.deepEqual(draft.sourceData, entry.expected);
    assert.equal(draft.total, entry.expected.totals.total);
    assert.equal(draft.items.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
      assert.equal(draft.items[i].status, expected[i].status);
      assert.equal(draft.items[i].source_text, expected[i].source_text);
      assert.equal(draft.items[i].total, expected[i].line_total);
    }
    const report = buildReport(draft);
    assert.equal(report.total, draft.total);
    if (entry.kind === 'service_record') assert.match(report.atAGlance.headline, /service record/);
  }
});
test('original PDF uploads resolve by bytes, and altered/name-spoofed files never become fixture results', async () => {
  const entry = getSample('service_record-29');
  const result = await parseUpload(bodyFor(entry), { apiKey: '' });
  assert.equal(result.provider, 'dataset');
  assert.equal(result.draft.items[0].status, 'completed');
  assert.equal(result.draft.items[0].labor, 92.5);
  await assert.rejects(() => parseUpload({ files: [{ ...image, name: entry.file }] }, { apiKey: '' }), error => error.code === 'PARSER_NOT_CONFIGURED');
  const altered = bodyFor(entry); altered.files[0].data = Buffer.concat([entry.bytes, Buffer.from('\n% changed')]).toString('base64');
  await assert.rejects(() => parseUpload(altered, { apiKey: '' }), error => error.code === 'PARSER_NOT_CONFIGURED');
});
test('upload validation checks PDF pages, real signatures, mixture, and file counts', async () => {
  const multi = await validateUpload(bodyFor(getSample('service_record-22')));
  assert.equal(multi.pageCount, 2);
  await assert.rejects(() => validateUpload({ files: Array(6).fill(image) }));
  await assert.rejects(() => validateUpload({ files: [...bodyFor(getSample('estimate-29')).files, image] }));
  await assert.rejects(() => validateUpload({ files: [{ ...image, data: Buffer.from('not a PNG').toString('base64') }] }));
  await assert.rejects(() => validateUpload({ files: [{ name: 'broken.pdf', type: 'application/pdf', data: Buffer.from('%PDF-broken').toString('base64') }] }));
});
test('AI request sends actual image bytes and validates returned canonical fields', async () => {
  const document = extraction(); document.items[0].confidence = .5; document.totals.total = null;
  let request;
  const result = await parseUpload({ files: [image] }, { apiKey: 'unit-test-only', fetchImpl: async (url, options) => {
    request = JSON.parse(options.body);
    assert.match(url, /generativelanguage\.googleapis\.com\/v1beta\/models\/.+:generateContent\?key=/);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ kind: 'estimate', document }) }] } }] }) };
  } });
  assert.equal(request.contents[0].parts[0].inline_data.data, png);
  assert.equal(request.contents[0].parts[0].inline_data.mime_type, 'image/png');
  assert.equal(result.draft.total, null);
  assert.equal(result.draft.items[0].parts, null);
  assert.equal(reconcile(result.draft).incomplete, true);
  assert.ok(result.draft.parseReasons.some(reason => reason.includes('Item 1')));
  assert.match(buildReport(result.draft).atAGlance.totalLine, /not stated/);
});
test('AI PDF requests use the document block; missing facts stay null', async () => {
  const body = bodyFor(getSample('estimate-29'));
  body.files[0].data = Buffer.concat([getSample('estimate-29').bytes, Buffer.from('\n% test')]).toString('base64');
  const document = extraction(); document.document.date = null; document.vehicle.mileage = null;
  const result = await parseUpload(body, { apiKey: 'unit-test-only', fetchImpl: async (_url, options) => {
    assert.equal(JSON.parse(options.body).contents[0].parts[0].inline_data.mime_type, 'application/pdf');
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ kind: 'estimate', document }) }] } }] }) };
  } });
  assert.equal(result.draft.date, null); assert.equal(result.draft.mileage, null);
  assert.equal(buildReport(result.draft).mileage, 'Not stated');
});
test('invalid model output and provider errors never appear as a parsed report', async () => {
  await assert.rejects(() => parseUpload({ files: [image] }, { apiKey: 'test', fetchImpl: async () => ({ ok: false }) }), error => error.code === 'PARSER_UNAVAILABLE');
  await assert.rejects(() => parseUpload({ files: [image] }, { apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"kind":"estimate","document":{"injected":true}}' }] } }] }) }) }), error => error.code === 'PARSE_FAILED');
  const wrong = extraction(); wrong.guardrails.diagnosis_made = true;
  await assert.rejects(() => parseUpload({ files: [image] }, { apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ kind: 'estimate', document: wrong }) }] } }] }) }) }));
});
