import { z } from 'zod';
export { coverageFor, demoProtection } from './coverage.js';
export { itemInsight } from './item-insights.js';

// Editable presentation contract. Canonical document schemas are validated on
// the server and retained verbatim in sourceData; editing never mutates them.
const text = z.string().trim().min(1).max(2000);
const amount = z.number().finite().min(0).max(10000000);
export const statuses = ['recommended', 'authorized', 'approved', 'declined', 'performed', 'pending_diagnosis', 'additional_authorization_required', 'completed', 'warranty_completed', 'courtesy_check', 'completed_after_additional_authorization', 'unknown'];
export const ItemSchema = z.object({
  title: text, source_text: text, status: z.enum(statuses), parts: amount.nullable(), labor: amount.nullable(), other: amount.nullable().optional(),
  total: amount.nullable(), plain: text, why: text, confidence: z.number().min(0).max(1).optional(),
});
export const DraftSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]+$/), sampleId: z.string(), synthetic: z.boolean(),
  vehicle: text, shop: text, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  mileage: z.number().int().min(0).max(2000000).nullable(), concern: z.string().max(2000),
  items: z.array(ItemSchema).min(1).max(40), fees: amount.nullable(), tax: amount.nullable(), total: amount.nullable(),
  documentKind: z.enum(['estimate', 'service_record']).optional(), origin: z.enum(['dataset', 'ai', 'manual']).optional(),
  documentType: z.string().max(60).optional(), documentNumber: z.string().max(120).nullable().optional(),
  sourceData: z.record(z.string(), z.unknown()).optional(), sourcePdf: z.string().regex(/^\/data\/carra-(estimates|service-records)\/samples\/[\w.-]+\.pdf$/).optional(),
  parseReasons: z.array(z.string().max(2000)).max(50).optional(), confidence: z.number().min(0).max(1).optional(),
  pageCount: z.number().int().min(1).max(5).optional(),
  completed: z.boolean().default(false), createdAt: z.string().datetime(),
});
export const SourceSchema = z.object({ id: text, tier: z.enum(['your_estimate', 'government', 'manufacturer', 'legal', 'owner_reports']), originalText: text });
export const QuoteSchema = z.object({ id: text, sourceId: text, text: text.refine(value => value.split(/\s+/).length <= 40, 'Quote exceeds 40 words'), itemIndex: z.number().int().nonnegative().optional() });
export const FindingSchema = z.object({ id: text, verified: z.boolean(), quoteIds: z.array(text).min(1) });
export const TraceSchema = z.object({
  type: z.literal('trace'), id: text, step: z.enum(['read_estimate', 'check_statuses', 'check_records', 'check_manufacturer', 'write_explanations', 'verify_quotes']),
  kind: z.enum(['stage', 'check']), label: text, status: z.enum(['running', 'ok', 'error', 'skipped']),
  startedAtMs: z.number().nonnegative(), durationMs: z.number().nonnegative().optional(),
  counts: z.record(z.string(), z.number().nonnegative()).optional(),
});
export const forbiddenCopy = /\b(necessary|unnecessary|not needed|don't need|can wait|must|should not|overpriced|overcharged|too expensive|fair price|good price|scam|rip-off|ripped off|we recommend replacing)\b/i;
export const money = value => value == null ? 'Not stated' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const cents = value => Math.round(value * 100);
export function reconcile(draft) {
  if ([draft.fees, draft.tax, draft.total, ...draft.items.map(item => item.total)].some(value => value == null)) return { calculated: null, difference: null, needsReview: true, incomplete: true, breakdownMismatch: false };
  const calculated = draft.items.reduce((sum, item) => sum + cents(item.total), 0) + cents(draft.fees) + cents(draft.tax);
  const difference = Math.abs(calculated - cents(draft.total));
  return { calculated: calculated / 100, difference: difference / 100, needsReview: difference >= 100,
    breakdownMismatch: draft.items.some(item => item.parts != null && item.labor != null && Math.abs(cents(item.parts) + cents(item.labor) + cents(item.other || 0) - cents(item.total)) >= 100) };
}
export function verifyQuote(quote, sources) {
  const parsed = QuoteSchema.safeParse(quote);
  return parsed.success && Boolean(sources[quote.sourceId]?.originalText?.includes(quote.text));
}
export function verifiedFindings(findings, quotes, sources) {
  return findings.filter(f => FindingSchema.safeParse(f).success && f.verified && f.quoteIds.every(id => quotes[id] && verifyQuote(quotes[id], sources)));
}
export function safeTrace(event) {
  // Zod strips all undeclared fields. This local adapter never emits input text,
  // URLs, VINs, prompts, or model logs.
  const parsed = TraceSchema.parse(event);
  if (/(?:sk-ant-|api[_ -]?key|bearer\s|\b[A-HJ-NPR-Z0-9]{17}\b)/i.test(parsed.label)) throw new Error('Unsafe trace label');
  return parsed;
}

const item = (title, source_text, status, parts, labor, plain, why) => ({ title, source_text, status, parts, labor, total: Number((parts + labor).toFixed(2)), plain, why });
export const samples = [
  { sampleId: 'ev6-12v', label: '2022 Kia EV6: 12-volt battery issue', vehicle: '2022 Kia EV6', mileage: 36120,
    concern: 'The car sometimes will not wake up, and a low 12-volt battery warning appears.',
    items: [
      item('12-volt battery test', 'Test 12V battery and record results.', 'authorized', 0, 75, 'A check of the small battery that powers the electronics.', 'A battery test measures the condition of the battery.'),
      item('DC-DC charging system diagnosis', 'Perform diagnostic testing of DC-DC charging system.', 'recommended', 0, 185, 'A check of the system that keeps the small battery charged.', 'A DC-DC converter changes the drive battery voltage to power low-voltage electronics.'),
      item('12-volt AGM battery replacement', 'Replace 12V AGM battery if testing confirms low capacity.', 'pending_diagnosis', 245, 55.5, 'A replacement small battery, depending on the test results.', 'The 12-volt battery supplies power to electronics, including computers and locks.'),
    ], fees: 12, tax: 27.86, total: 600.36 },
  { sampleId: 'crv-brake', label: '2019 Honda CR-V: brake vibration', vehicle: '2019 Honda CR-V', mileage: 62450,
    concern: 'The steering wheel vibrates when braking.',
    items: [
      item('Front brake pads', 'Recommend replacing front brake pads. Customer approval pending.', 'recommended', 145, 110, 'New friction material for the front brakes.', 'Brake pads press against the rotors to slow the wheels.'),
      item('Front brake rotors', 'Recommend replacing both front brake rotors. Customer approval pending.', 'recommended', 240, 95, 'New discs for the front brake pads to press against.', 'Rotors turn with the wheels and provide a surface for the pads.'),
      item('Brake fluid service', 'Recommend brake fluid exchange. Customer approval pending.', 'recommended', 30, 85, 'An exchange of fluid in the braking system.', 'Brake fluid transfers pedal pressure through the braking system.'),
    ], fees: 15, tax: 36.31, total: 756.31 },
  { sampleId: 'a4-idle', label: '2017 Audi A4: rough idle', vehicle: '2017 Audi A4', mileage: 78200,
    concern: 'The engine runs unevenly while stopped.',
    items: [
      item('Engine diagnostic testing', 'Perform engine diagnostic testing. Customer authorized testing.', 'authorized', 0, 165, 'Testing to gather information about uneven engine operation.', 'Testing helps a technician investigate the reported symptoms.'),
      item('Spark plug replacement', 'Recommend replacement of four spark plugs. Customer approval pending.', 'recommended', 88, 132, 'New parts that ignite the fuel mixture in the engine.', 'Spark plugs create the spark that starts combustion.'),
      item('Ignition coil replacement', 'Recommend ignition coil replacement. Customer approval pending.', 'recommended', 95, 44, 'A replacement part that supplies power to a spark plug.', 'An ignition coil provides the high voltage used by a spark plug.'),
    ], fees: 10, tax: 18.3, total: 552.3 },
];
export function createDraft(sampleId, id = 'example') {
  const sample = samples.find(s => s.sampleId === sampleId);
  if (!sample) throw new Error('Unknown sample');
  return DraftSchema.parse({ ...structuredClone(sample), id, synthetic: true, shop: 'Example Auto Service', date: '2026-09-19', createdAt: new Date().toISOString() });
}
export function createManualDraft(id) {
  return DraftSchema.parse({ id, sampleId: 'manual', synthetic: false, vehicle: 'Your vehicle', shop: 'Your repair shop',
    date: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString(), mileage: 0, concern: '',
    items: [item('Enter item title', 'Enter the exact line from your estimate.', 'unknown', 0, 0, 'An item entered from your estimate.', 'Ask your shop to explain what this line covers.')], fees: 0, tax: 0, total: 0 });
}
export function buildReport(input, trace = []) {
  const d = DraftSchema.parse(input);
  const service = d.documentKind === 'service_record';
  const sources = { S0: { id: 'S0', tier: 'your_estimate', publisher: service ? 'Your service record' : 'Your document', title: `${d.shop}, ${d.date || 'Date not stated'}`, originalText: d.items.map(i => i.source_text).join('\n') } };
  const quotes = Object.fromEntries(d.items.map((i, index) => {
    // Bound excerpts while preserving a literal substring, never paraphrase.
    const excerpt = i.source_text.match(/^(?:\S+\s*){1,40}/)?.[0].trim() || i.source_text;
    return [`Q${index + 1}`, { id: `Q${index + 1}`, sourceId: 'S0', locator: `Line ${index + 1}`, itemIndex: index, text: excerpt }];
  }));
  if (!Object.values(quotes).every(q => verifyQuote(q, sources))) throw new Error('Quote verification failed');
  const pending = d.items.filter(i => i.status === 'pending_diagnosis').length;
  const recommended = d.items.filter(i => i.status === 'recommended').length;
  const keyPoints = [
    { id: 'K1', text: `${d.items.length} line items are listed in this ${service ? 'service record' : 'document'}.`, provenance: service ? 'From your document' : 'From your estimate', quoteIds: Object.keys(quotes) },
    { id: 'K2', text: service ? 'This document records past work. Check each item’s completion status and keep it with your service history.' : pending ? `${pending} item depends on testing. Confirm the results before approving more work.` : `${recommended} items are marked recommended. Ask which work is awaiting your approval.`, provenance: 'General info' },
    { id: 'K3', text: 'Public records were not checked. You can ask your dealer to check recalls by VIN.', provenance: 'General info' },
  ];
  const questions = [
    { q: 'What did the inspection or tests show?', reason: 'Ask for the findings behind the listed work.', priority: 1 },
    { q: 'Which items are approved, and which are still awaiting my approval?', reason: 'Confirm the scope before work begins.', priority: 1 },
    { q: 'Can you check recalls for my VIN?', reason: 'Public records were not checked in this report.', priority: 2 },
    { q: 'Could any amounts change after testing?', reason: 'Confirm how changes will be approved.', priority: 2 },
    { q: 'Can you show me the parts and labor breakdown?', reason: 'Confirm what is included in each line.', priority: 3 },
  ];
  if (service) {
    questions[1] = { q: 'Can you confirm which work was completed during this visit?', reason: 'Check the record of completed work.', priority: 1 };
    questions[3] = { q: 'Is there any follow-up documented for this visit?', reason: 'Confirm the next steps with the shop.', priority: 2 };
  }
  return {
    id: d.id, synthetic: d.synthetic, documentKind: d.documentKind, origin: d.origin, documentNumber: d.documentNumber, vehicle: d.vehicle, shop: d.shop, estimateDate: d.date || 'Not stated', mileage: d.mileage == null ? 'Not stated' : `${d.mileage.toLocaleString('en-US')} mi`,
    atAGlance: { headline: service ? 'Here is the work your service record lists.' : 'Here is what your document lists.', estimateRequest: `${d.items.length} items, with their listed amounts and work status.`, simpleNextStep: 'What did the inspection or tests show?', totalLine: `${money(d.total)} listed total.${reconcile(d).incomplete ? ' Some amounts are not stated.' : reconcile(d).needsReview ? ' The line totals do not match.' : ''}`, keyPoints },
    items: d.items.map((i, index) => ({ ...i, quoteId: `Q${index + 1}`, cost: [['Parts', i.parts], ['Labor', i.labor], ...(i.other != null ? [['Other', i.other]] : [])], uncertainty: i.confidence < .75 ? 'This line was hard to read. Check it against the original document.' : i.status === 'pending_diagnosis' ? 'This line depends on testing. Ask the shop to confirm the scope and amount.' : undefined })),
    fees: [['Shop supplies / other fees', d.fees], ['Sales tax', d.tax]], total: d.total, findings: {}, sources, quotes, questions,
    checks: [['Document fields', d.origin === 'dataset' ? 'Loaded from the supplied PDF dataset reference; edits applied' : d.origin === 'ai' ? 'AI extracted; compare with the original document' : 'Manually entered; compare with the original document'], ['Quote verification', 'Checked against reviewed text, not independently verified OCR'], ['NHTSA recalls and owner complaints', 'Not checked'], ["Manufacturer schedule and warranty", 'Not checked']],
    verification: { quotesTotal: d.items.length, quotesVerified: d.items.length, findingsRemoved: 0 },
    trace: trace.map(event => { const t = safeTrace(event); return [`+${(t.startedAtMs / 1000).toFixed(2)}s`, t.label, null, t.status === 'skipped' ? 'Not checked' : `${t.durationMs ?? 0}ms`]; }),
    suggestedAsks: [service ? 'What is included in this service record?' : 'What is included in this estimate?', 'What do the item statuses mean?', 'Were public records checked?'],
  };
}
export function answerFromReport(report, question) {
  if (question === 'What is included in this estimate?' || question === 'What is included in this service record?') return report.items.slice(0, 6).map(i => [`${i.title}: ${money(i.total)}.`, 'From your estimate', [i.quoteId]]);
  if (question === 'What do the item statuses mean?') return [['Authorized means approved work; recommended means proposed work. Pending diagnosis means the scope depends on testing.', 'General info']];
  if (question === 'Were public records checked?') return [['Public records were not checked for this report. You can ask your dealer to check recalls by VIN.', 'General info']];
  return [["I can explain the listed items and their status using the questions above. I cannot answer this question from the available report.", 'General info']];
}
