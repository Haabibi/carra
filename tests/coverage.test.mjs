import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coverageFor } from '../lib/coverage.js';
const report = (...titles) => ({ origin: 'dataset', mileage: '36,120 mi', items: titles.map(title => ({ title, source_text: title, status: 'recommended', total: 100 })) });

test('profile separates electrical protection from consumables and unknown work', () => {
  const rows = coverageFor(report('DC-DC charging system diagnostic', 'Replace 12V AGM battery', 'Front brake pads', 'Inspect unusual noise'));
  assert.deepEqual(rows.map(row => row.route), ['warranty', 'excluded', 'excluded', 'unknown']);
  assert.ok(rows.every(row => row.verified === false));
  assert.ok(rows.every(row => !('refund' in row)));
});
test('uploaded documents cannot opt into fictional coverage or inherit synthetic status', () => {
  for (const origin of ['ai', 'manual']) {
    const own = { ...report('Charging system diagnostic'), origin, synthetic: true };
    assert.equal(coverageFor(own, { demo: true })[0].route, 'unknown');
  }
});
test('payment inquiry preserves authorization conditions, and historical work stays historical', () => {
  const sample = report('DC-DC diagnostic', 'Towing', 'Rental car', 'Collision damage');
  assert.match(coverageFor(sample)[0].next, /authorized service center/);
  assert.match(coverageFor(sample, { paid: true })[0].next, /reimbursement review/);
  assert.deepEqual(coverageFor(sample).map(row => row.route), ['warranty', 'insurance', 'insurance', 'insurance']);
  sample.items[0].status = 'warranty_completed';
  const row = coverageFor(sample)[0];
  assert.equal(row.route, 'record');
  assert.match(row.next, /not future coverage/);
});
test('electrical profile honors mileage, term, and pending diagnosis', () => {
  const sample = report('Charge-port lock actuator replacement');
  sample.items[0].status = 'pending_diagnosis';
  assert.equal(coverageFor(sample)[0].label, 'Warranty eligible');
  assert.equal(coverageFor({ ...sample, mileage: '68,420 mi' })[0].route, 'expired');
  assert.equal(coverageFor({ ...sample, estimateDate: '2027-09-20' })[0].route, 'expired');
});
test('actual EV sample rows distinguish included testing and excluded replacement', () => {
  for (const folder of ['carra-estimates', 'carra-service-records']) {
    const rows = readFileSync(`data/${folder}/ground_truth.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
    const expected = rows.find(row => row.sample_id === '29').expected;
    const items = (expected.items || expected.work_performed).map(item => ({ title: item.normalized_title, source_text: item.source_text, status: item.status, total: item.line_total }));
    assert.deepEqual(coverageFor({ origin: 'dataset', mileage: expected.vehicle.mileage, items }).map(row => row.route), ['warranty', 'warranty', 'excluded']);
  }
});
