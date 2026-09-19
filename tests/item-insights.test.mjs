import test from 'node:test';
import assert from 'node:assert/strict';
import { itemInsight } from '../lib/item-insights.js';
const item = (title, total) => ({ title, total, plain: 'Work listed in your document.' });
test('Volvo screenshot example uses model reference and accurate difference', () => {
  const result = itemInsight(item('Rear brake pads', 404), '2020 Volvo XC60');
  assert.equal(result.kind, 'pads');
  assert.equal(result.comparison.low, 289);
  assert.equal(result.comparison.high, 346);
  assert.equal(result.comparison.difference, 58);
  assert.equal(result.comparison.position, 'Above');
  assert.ok(result.comparison.marker > result.comparison.bandEnd);
});
test('price boundaries, absent amounts, and outliers produce accurate visual positions', () => {
  for (const [amount, expected] of [[289, 'Within'], [346, 'Within'], [200, 'Below'], [10000, 'Above']]) {
    const c = itemInsight(item('Rear brake pads', amount), 'Volvo XC60').comparison;
    assert.equal(c.position, expected);
    assert.ok(c.marker >= 0 && c.marker <= 100);
  }
  for (const value of [null, undefined, 0, NaN]) assert.equal(itemInsight(item('Rear brake pads', value)).comparison, null);
});
test('unmatched, bundled, and diagnostic work never receives a replacement price', () => {
  for (const name of ['Inspect brake pads', 'Brake pads and rotors', 'DC-DC diagnostic', '12-volt battery test', 'Rotor resurfacing']) assert.ok(!itemInsight(item(name, 100)).comparison);
  assert.ok(!itemInsight(item('High-voltage battery replacement', 9000)).comparison);
  assert.equal(itemInsight(item('Unspecified labor', 200)).kind, 'unknown');
});
