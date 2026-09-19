// Report presentation. Data and validation live in lib/core.js.
let REPORT = CarraCore.buildReport(CarraCore.createDraft("ev6-12v"));

const STATUS = {
  completed: ['Completed', 'The record lists this work as completed.'],
  warranty_completed: ['Warranty work completed', 'The record lists completed warranty work.'],
  courtesy_check: ['Courtesy check', 'The record lists a courtesy check.'],
  completed_after_additional_authorization: ['Completed after approval', 'The record lists work completed after additional approval.'],
  recommended: ['Shop suggestion', 'Proposed work; this status does not confirm customer approval.'],
  authorized: ['Customer OK recorded', 'The document records permission to do this work, not that it is finished.'],
  approved: ['Customer OK recorded', 'The document records permission to do this work, not that it is finished.'],
  declined: ['Declined', 'You chose not to do this.'],
  performed: ['Done', 'The shop has completed this work.'],
  pending_diagnosis: ['Pending diagnosis', 'This is an estimate. The shop will confirm after testing.', true],
  additional_authorization_required: ['Needs your OK', 'The shop needs your approval before doing this.', true],
  unknown: ['Status unclear', "The estimate doesn't say."],
};

const KIND = {
  open_recall: { color: 'record', shape: 'double', label: 'Recall on record' },
  warranty_program: { color: 'record', shape: 'double', label: 'Warranty program' },
  document_status: { color: 'attention', shape: 'half', label: 'Estimate status' },
  maintenance_schedule: { color: 'attention', shape: 'half', label: 'Maintenance schedule' },
  safety_note: { color: 'safety', shape: 'filled', label: 'Safety note' },
  owner_reports: { color: 'neutral', shape: 'dashed', label: 'Owner reports' },
  none: { color: 'neutral', shape: 'empty', label: 'General info' },
};

const TIER = { your_estimate: 'Your estimate', government: 'Government record', manufacturer: 'Manufacturer', legal: 'Legal record', owner_reports: 'Owner reports' };

const GLOSSARY = {
  iccu: 'ICCU stands for Integrated Charging Control Unit. On the EV6, it handles charging and keeps the 12-volt battery topped up.',
  dcdc: 'A DC-DC converter turns high voltage from the drive battery into 12 volts for the car\'s electronics.',
  agm: 'AGM (absorbent glass mat) is a sealed, spill-proof type of 12-volt battery.',
};

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => CarraCore.money(n);
const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = () => (reduceMotion() ? 'auto' : 'smooth');

// Plain text with {{term|Label}} glossary tokens.
function rich(text) {
  return esc(text).replace(/\{\{(\w+)\|([^}]+)\}\}/g, (_, key, label) =>
    `<button type="button" class="term" data-term="${key}" aria-expanded="false">${label}</button>`);
}

function markSVG(kindKey, label) {
  const k = KIND[kindKey] || KIND.none;
  const shapes = {
    double: '<circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
    half: '<circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 1.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor"/>',
    filled: '<circle cx="9" cy="9" r="7.25" fill="currentColor"/>',
    dashed: '<circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2.5"/>',
    empty: '<circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  };
  const a11y = label === false ? 'aria-hidden="true"' : `role="img" aria-label="${esc(label || k.label)}"`;
  return `<svg class="mark mark-${k.color}" viewBox="0 0 18 18" ${a11y}>${shapes[k.shape]}</svg>`;
}

const chevron = '<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const smallChevron = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

function findingsForItem(i) {
  return Object.entries(REPORT.findings).filter(([, f]) => f.verified === true && f.itemIndexes.includes(i)).map(([id, f]) => ({ id, ...f }));
}
function primaryKind(i) {
  const fs = findingsForItem(i);
  return fs.length ? fs[0].kind : null;
}
function colorVar(kindKey) {
  return `var(--${(KIND[kindKey] || KIND.none).color})`;
}
function statusChip(status) {
  const [label, , attention] = STATUS[status] || STATUS.unknown;
  return `<span class="status-chip${attention ? ' is-attention' : ''}">${label}</span>`;
}

// ---------- quotes ----------
let slotSeq = 0;
function quoteChip(quoteIds, slotId, extraClass = '') {
  const q = REPORT.quotes[quoteIds[0]];
  const pub = REPORT.sources[q.sourceId].publisher;
  return `<button type="button" class="quote-chip ${extraClass}" data-quotes="${quoteIds.join(',')}" aria-controls="${slotId}" aria-expanded="false">Quote <span class="pub">${esc(pub)}</span>${smallChevron}</button>`;
}

function quoteCard(qid, kindKey) {
  const q = REPORT.quotes[qid];
  const s = REPORT.sources[q.sourceId];
  let body = esc(q.text);
  if (q.highlight && q.text.includes(q.highlight)) body = body.replace(esc(q.highlight), `<mark>${esc(q.highlight)}</mark>`);
  else body = `<mark>${body}</mark>`;
  const action = s.tier === 'your_estimate' && !Number.isInteger(q.itemIndex)
    ? '<span>Reviewed document details</span>'
    : s.tier === 'your_estimate'
    ? `<button type="button" data-see-line="${q.itemIndex}">See on estimate</button>`
    : `<a href="${esc(s.url)}" target="_blank" rel="noopener">Open source</a>`;
  const where = `${s.title}, ${q.locator}`;
  const when = s.retrievedAt ? `<span>Retrieved ${esc(s.retrievedAt)}</span>` : '';
  const tier = s.tier === 'your_estimate' ? '' : `<span>${TIER[s.tier]}</span>`;
  const sourceLine = s.tier === 'your_estimate'
    ? `<strong>${esc(s.title)}</strong>, ${esc(q.locator)}`
    : `<strong>${esc(s.publisher)}</strong> ${esc(where)}`;
  return `<figure class="quote-card" style="--qc:${colorVar(kindKey)}" data-cite="${esc(`${s.publisher}, ${where}`)}">
    <blockquote>&ldquo;${body}&rdquo;</blockquote>
    <figcaption class="quote-meta">
      <span class="row"><span>${sourceLine}</span>${when}</span>
      <span class="row quote-source-action">${tier}${action}</span>
    </figcaption>
  </figure>`;
}

function kindForQuotes(quoteIds) {
  const f = Object.values(REPORT.findings).find((x) => x.quoteIds.some((id) => quoteIds.includes(id)));
  return f ? f.kind : null;
}

function toggleQuotes(chip) {
  const slot = document.getElementById(chip.getAttribute('aria-controls'));
  const open = chip.getAttribute('aria-expanded') === 'true';
  const siblings = $$(`[aria-controls="${slot.id}"]`);
  if (open) {
    slot.innerHTML = '';
  } else {
    const ids = chip.dataset.quotes.split(',');
    slot.innerHTML = ids.map((id) => quoteCard(id, kindForQuotes([id]))).join('');
  }
  siblings.forEach((c) => c.setAttribute('aria-expanded', String(!open)));
  // On mobile, key point text is clamped to 2 lines; show it in full with its quote.
  slot.closest('.key-point')?.querySelector('p')?.classList.toggle('is-full', !open);
}

// ---------- render: header + layer 1 ----------
function renderHeader() {
  const service = REPORT.documentKind === 'service_record';
  const invoice = REPORT.atAGlance.workLabel === 'Invoice covers';
  $('#items-title').textContent = service ? 'Work on this service record' : "What's on this document";
  $('#questions-title').textContent = service || invoice ? 'Questions about this service visit' : 'Questions to ask before you approve';
  $('#vehicle-name').textContent = REPORT.vehicle;
  $('#report-meta').textContent = `${service ? 'Service record' : invoice ? 'Invoice' : 'Document'} from ${REPORT.shop}, ${REPORT.estimateDate}. Odometer ${REPORT.mileage}.`;
  $('#glance-headline').textContent = REPORT.atAGlance.headline;
  $('#estimate-request').textContent = REPORT.atAGlance.estimateRequest;
  $('#simple-next-step').textContent = REPORT.atAGlance.simpleNextStep;
  $('#total-line').textContent = REPORT.atAGlance.totalLine;
  $('#read-summary-toggle').setAttribute('aria-expanded', 'false');
  $('#read-summary').classList.remove('is-expanded');
  $('#glance .read-label').textContent = REPORT.atAGlance.workLabel;
  $$('#glance > .provenance, #glance .read-total .provenance').forEach(label => { label.textContent = REPORT.atAGlance.sourceLabel; });

  $('#key-points').innerHTML = REPORT.atAGlance.keyPoints.slice(0, 3).map((kp) => {
    const f = kp.findingId ? REPORT.findings[kp.findingId] : null;
    const kind = f ? f.kind : 'none';
    const slotId = `slot-${++slotSeq}`;
    const hasQuote = kp.quoteIds && kp.quoteIds.length;
    const chipDesktop = hasQuote ? quoteChip(kp.quoteIds, slotId) : '';
    const chipMobile = hasQuote ? quoteChip(kp.quoteIds, slotId) : '';
    return `<li class="key-point">
      ${markSVG(kind)}
      <div>
        <p>${esc(kp.text)}</p>
        <div class="meta-row">${kp.provenance === REPORT.atAGlance.sourceLabel ? '' : `<span class="provenance">${kp.provenance}</span>`}${chipMobile}</div>
      </div>
      <div class="chip-cell">${chipDesktop}</div>
      <div class="quote-slot" id="${slotId}"></div>
    </li>`;
  }).join('');
}

// ---------- render: layer 2 items ----------
function renderItems() {
  $('#items-note').textContent = `${REPORT.items.length} items`;
  $('#item-list').innerHTML = REPORT.items.map((it, i) => {
    const fs = findingsForItem(i);
    const marks = fs.length
      ? `<span class="item-marks">${markSVG(fs[0].kind, false)}<span>${fs.length}</span><span class="visually-hidden"> ${fs.length === 1 ? 'finding' : 'findings'}</span></span>`
      : '';
    return `<div class="item" data-item="${i}">
      <button type="button" class="item-row" id="row-${i}" aria-expanded="false" aria-controls="detail-${i}">
        <span class="item-title">${esc(it.title)}${CarraProtection.badge(REPORT, i)}</span>
        <span class="item-amount">${money(it.total)}</span>
        <span class="item-meta">${statusChip(it.status)}<span class="plain">${esc((STATUS[it.status] || STATUS.unknown)[1])}</span></span>
        ${marks}
        ${chevron}
      </button>
      <div class="item-detail" id="detail-${i}" hidden></div>
    </div>`;
  }).join('');

  $('#fee-list').innerHTML = REPORT.fees.map(([label, amt]) => `<div class="fee-row"><span>${esc(label)}</span><strong>${money(amt)}</strong></div>`).join('')
    + `<div class="grand-total"><span>Estimate total</span><strong>${money(REPORT.total)}</strong></div>`;
}

function detailHTML(i, headingId) {
  const it = REPORT.items[i];
  const [, statusText] = STATUS[it.status] || STATUS.unknown;
  const fs = findingsForItem(i).filter((f) => f.kind !== 'document_status');
  const records = fs.length
    ? fs.map((f) => {
        const slotId = `slot-${++slotSeq}`;
        return `<div class="finding">
          <p class="finding-title">${markSVG(f.kind)}${esc(f.title)}</p>
          <p>${esc(f.body)}</p>
          ${f.quoteIds.map((id) => quoteCard(id, f.kind)).join('')}
          ${f.coverageCaveat ? `<p class="caveat">${esc(f.coverageCaveat)}</p>` : ''}
          ${f.suggestedQuestion ? `<p class="ask-this"><span>You may want to ask:</span> ${esc(f.suggestedQuestion)}</p>` : ''}
        </div>`;
      }).join('')
    : '<p class="muted">Public records were not checked for this item.</p>';

  const cost = it.cost.map(([l, v]) => `<span>${esc(l)}</span><span>${money(v)}</span>`).join('');

  const prev = i > 0 ? `<button type="button" class="btn btn-quiet" data-goto="${i - 1}">Previous item</button>` : '<span></span>';
  const next = i < REPORT.items.length - 1 ? `<button type="button" class="btn btn-quiet" data-goto="${i + 1}">Next item</button>` : '<span></span>';

  return `${headingId === 'sheet-title' ? `<div class="detail-head">
      <div class="title-row"><h3 id="${headingId}">${esc(it.title)}</h3><strong class="num">${money(it.total)}</strong></div>
      <p class="status-line">${statusChip(it.status)}<span>${esc(statusText)}</span></p>
    </div>` : ''}
    ${it.uncertainty ? `<div class="detail-block"><div class="not-confirmed"><strong>Not confirmed.</strong> ${esc(it.uncertainty)}</div></div>` : ''}
    ${CarraProtection.detail(REPORT, i)}
    ${CarraItemInsights.render(it, REPORT.vehicle)}
    <details class="item-evidence"><summary>Original wording &amp; cost breakdown</summary>
      ${quoteCard(it.quoteId, kindForQuotes([it.quoteId]))}
      <div class="cost-table">${cost}</div>
      ${!fs.length ? records : ''}
    </details>
    ${fs.length ? `<div class="detail-block"><h4>Related records</h4>${records}</div>` : ''}
    <nav class="detail-nav" aria-label="Item navigation">${prev}${next}</nav>`;
}

// ---------- item open/close ----------
let openIndex = null;
let returnFocus = null;

function openItem(i, { scroll = false } = {}) {
  if (isMobile()) return openItemSheet(i);
  $$('.item').forEach((el) => {
    const idx = Number(el.dataset.item);
    const isOpen = idx === i && openIndex !== i;
    el.classList.toggle('is-open', isOpen);
    $('.item-row', el).setAttribute('aria-expanded', String(isOpen));
    const detail = $('.item-detail', el);
    detail.hidden = !isOpen;
    detail.innerHTML = isOpen ? detailHTML(idx, `detail-title-${idx}`) : '';
  });
  openIndex = openIndex === i ? null : i;
  linkLine(openIndex);
  if (scroll && openIndex !== null) $(`#row-${i}`).scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}

function openItemSheet(i) {
  const sheet = $('#item-sheet');
  if (!sheet.open) returnFocus = document.activeElement;
  $('#item-sheet-body').innerHTML = `<div class="item-detail">${detailHTML(i, 'sheet-title')}</div>`;
  $('#item-sheet-body').scrollTop = 0;
  if (!sheet.open) sheet.showModal();
  $('#sheet-title').setAttribute('tabindex', '-1');
  $('#sheet-title').focus();
  sheet.dataset.item = i;
}

// ---------- estimate viewer ----------
function renderPaper() {
  const lines = REPORT.items.map((it, i) => {
    const q = REPORT.quotes[it.quoteId];
    return `<button type="button" class="doc-line" data-line="${i}" aria-label="Line ${i + 1}: ${esc(it.title)}, ${money(it.total)}">
      <span class="line-main"><span>${esc(it.title.replace('12-volt', '12V'))}</span><strong>${money(it.total)}</strong></span>
      <span class="line-sub">${esc(q.text)}</span>
    </button>`;
  }).join('');
  $('#paper').innerHTML = `
    <div class="paper-top"><strong>${esc(REPORT.shop)}</strong><span>${REPORT.documentKind === 'service_record' ? 'Service record' : 'Repair document'} · reviewed text</span></div>
    <div class="paper-meta"><span>Date: ${esc(REPORT.estimateDate)}</span><span>Odometer: ${esc(REPORT.mileage)}</span><span>Vehicle: ${esc(REPORT.vehicle)}</span><span>Document #: ${esc(REPORT.documentNumber || 'Not stated')}</span></div>
    <div class="paper-cols"><span>Description</span><span>Amount</span></div>
    ${lines}
    <div class="paper-fees">${REPORT.fees.map(([l, v]) => `<div><span>${esc(l)}</span><span>${money(v)}</span></div>`).join('')}</div>
    <div class="paper-total"><span>Total</span><span>${money(REPORT.total)}</span></div>
    <div class="paper-auth"><p>Reviewed document text. Compare it with the original PDF or photo below.</p></div>`;
  requestAnimationFrame(placeMarginMarks);
}

function placeMarginMarks() {
  if (!document.querySelector('.doc-line')) return;
  const strip = $('#margin-strip');
  const wrapTop = $('#paper-wrap').getBoundingClientRect().top;
  strip.innerHTML = REPORT.items.map((it, i) => {
    const fs = findingsForItem(i);
    if (!fs.length) return '';
    const line = $(`.doc-line[data-line="${i}"]`);
    const r = line.getBoundingClientRect();
    const top = r.top - wrapTop + r.height / 2;
    const label = `${it.title}, ${fs.length} ${fs.length === 1 ? 'finding' : 'findings'}`;
    return `<button type="button" class="margin-mark" data-line="${i}" style="top:${top}px" aria-label="${esc(label)}">${markSVG(fs[0].kind, false)}</button>`;
  }).join('');
}

function linkLine(i) {
  const paper = $('#paper');
  $$('.doc-line, .margin-mark').forEach((el) => el.classList.toggle('is-linked', i !== null && Number(el.dataset.line) === i));
  $$('.item').forEach((el) => el.classList.toggle('is-linked', i !== null && Number(el.dataset.item) === i));
  paper.classList.toggle('has-focus', i !== null && i !== undefined);
  if (i !== null && i !== undefined) {
    const line = $(`.doc-line[data-line="${i}"]`);
    line.style.setProperty('--line-color', primaryKind(i) ? colorVar(primaryKind(i)) : 'var(--paper-ink)');
  }
}

function seeOnEstimate(i) {
  if (isMobile()) {
    openEstimateSheet();
  }
  linkLine(i);
  const line = $(`.doc-line[data-line="${i}"]`);
  line.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
}

let zoom = 1;
function setZoom(delta) {
  zoom = Math.min(1.6, Math.max(0.8, Math.round((zoom + delta * 0.2) * 10) / 10));
  $('#paper-wrap').style.setProperty('--zoom', zoom);
  $('#zoom-label').textContent = `${Math.round(zoom * 100)}%`;
  requestAnimationFrame(placeMarginMarks);
}

function openEstimateSheet() {
  const sheet = $('#estimate-sheet');
  if (sheet.open) return;
  returnFocus = document.activeElement;
  $('#estimate-sheet-body').appendChild($('#viewer'));
  sheet.showModal();
  requestAnimationFrame(placeMarginMarks);
}

// ---------- questions ----------
let showAllQuestions = false;
const asked = new Set();

function renderQuestions() {
  const sorted = [...REPORT.questions].sort((a, b) => a.priority - b.priority);
  const shown = showAllQuestions ? sorted : sorted.slice(0, 3);
  $('#question-list').innerHTML = shown.map((q, i) => {
    const id = `q-${i}`;
    const f = q.findingId ? REPORT.findings[q.findingId] : null;
    const slotId = `slot-${++slotSeq}`;
    return `<li class="q-row${asked.has(q.q) ? ' is-asked' : ''}">
      <input type="checkbox" id="${id}" data-q="${esc(q.q)}" ${asked.has(q.q) ? 'checked' : ''} />
      <label for="${id}"><span class="q-text">${esc(q.q)}</span><span class="q-reason">${esc(q.reason)}</span></label>
      <div class="chip-cell">${f ? quoteChip(f.quoteIds, slotId) : ''}</div>
      <div class="quote-slot" id="${slotId}"></div>
    </li>`;
  }).join('');
  const toggle = $('#toggle-questions');
  toggle.hidden = sorted.length <= 3;
  toggle.textContent = showAllQuestions ? 'Show fewer questions' : `Show all questions (${sorted.length})`;
  toggle.setAttribute('aria-expanded', String(showAllQuestions));
}

async function copyQuestions() {
  const text = [`${REPORT.vehicle}, estimate from ${REPORT.estimateDate}`, '', ...[...REPORT.questions].sort((a, b) => a.priority - b.priority).map((q) => q.q)].join('\n');
  try { await navigator.clipboard.writeText(text); } catch { /* blocked on file:// in some browsers */ }
  showToast('Questions copied');
}

// ---------- how we checked ----------
function renderChecked() {
  const quoteCount = Object.keys(REPORT.quotes).length;
  const sourceCount = Object.keys(REPORT.sources).length;
  $('#checked-summary').textContent = `${quoteCount} quotes checked against the reviewed document text.`;
  const removed = REPORT.verification.findingsRemoved;
  $('#checked-body').innerHTML = `
    <h3>What we looked up</h3>
    <ul class="check-list">${REPORT.checks.map(([l, d]) => `<li><span>${esc(l)}</span><span>${esc(d)}</span></li>`).join('')}</ul>
    <h3>Sources used</h3>
    <ul class="check-list">${Object.values(REPORT.sources).map((s) => `<li><span>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</span><span>${TIER[s.tier]}</span></li>`).join('')}</ul>
    <p class="verify-line">${quoteCount} of ${quoteCount} quotes match their source text.${removed ? ` ${removed} findings were left out because we couldn't match them to their source text.` : ''}</p>
    <p><button type="button" class="link-button" id="trace-toggle" aria-expanded="false" aria-controls="trace-list">View technical trace</button></p>
    <ol class="trace-list" id="trace-list" hidden>${REPORT.trace.map(([t, label, target, res]) =>
      `<li><span class="t">${t}</span><span>${esc(label)}${target ? `<code>${esc(target)}</code>` : ''}</span><span class="res">${esc(res)}</span></li>`).join('')}</ol>`;
}

// ---------- ask (replay-style prototype) ----------
const ASK_LIMIT = 10;
let askCount = 0;
function renderSuggestions(list = REPORT.suggestedAsks) {
  $('#suggestions').innerHTML = list.map((s) => `<button type="button" class="suggestion" data-ask="${esc(s)}">${esc(s)}</button>`).join('');
}

function isOutOfScope(q) {
  return /\b(rip|ripp|scam|overcharg|overpric|too expensive|fair|worth it|skip|best (shop|dealer)|trust)\w*/i.test(q);
}

async function ask(question) {
  question = question.trim().slice(0, 500);
  if (!question) return;
  const thread = $('#thread');
  if (askCount >= ASK_LIMIT) {
    thread.insertAdjacentHTML('beforeend', '<p class="ask-error">You\'ve reached the question limit for this report.</p>');
    return;
  }
  askCount += 1;
  $('#suggestions').classList.remove('is-emphasized');
  const turn = document.createElement('div');
  turn.className = 'turn';
  turn.innerHTML = `<div class="chat-message user-message"><span class="message-label">You</span><p>${esc(question)}</p></div><ol class="ask-trace" aria-label="Carra is checking the report"></ol>`;
  thread.appendChild(turn);
  turn.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });

  const traceEl = $('.ask-trace', turn);
  traceEl.innerHTML = '<li><span>Connecting to Carra</span><span class="ok">…</span></li>';
  let sentences;
  let provider = 'gemini';
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, report: REPORT }),
    });
    if (!response.ok) throw new Error('Gemini is unavailable');
    const result = await response.json();
    sentences = result.sentences;
  } catch {
    provider = 'local fallback';
    sentences = CarraCore.answerFromReport(REPORT, question);
  }
  traceEl.innerHTML = `<li><span>${provider === 'gemini' ? 'Gemini read this report' : 'Local report reference'}</span><span class="ok">ready</span></li>`;
  if (!Array.isArray(sentences) || sentences.length === 0) {
    turn.insertAdjacentHTML('beforeend', '<p class="ask-error">Carra could not find an answer in this report. Try one of the suggested questions.</p>');
    return;
  }
  const quoteIds = new Set();
  const body = sentences.map(([text, prov, qids]) => {
    let tail = `<span class="provenance">${prov}</span>`;
    let slot = '';
    if (qids) {
      qids.forEach((id) => quoteIds.add(id));
      const slotId = `slot-${++slotSeq}`;
      tail = quoteChip(qids, slotId);
      slot = `<div class="quote-slot" id="${slotId}"></div>`;
    }
    return `<div class="answer-sentence"><span>${esc(text)}</span>${tail}${slot}</div>`;
  }).join('');
  const sourceCount = new Set([...quoteIds].map((id) => REPORT.quotes[id].sourceId)).size;
  const followups = REPORT.suggestedAsks.slice(0, 2);
  turn.insertAdjacentHTML('beforeend', `<div class="chat-message assistant-message"><div class="mini-avatar" aria-hidden="true"><img src="design/carra-character/carra-agent.png" alt="" /></div><div class="answer"><span class="message-label">Carra</span>${body}
    <p class="answer-foot">Read ${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}. ${quoteIds.size} ${quoteIds.size === 1 ? 'quote' : 'quotes'} checked. ${provider === 'gemini' ? 'Gemini' : 'Local fallback'}</p>
    <div class="followups">${followups.map((s) => `<button type="button" class="suggestion" data-ask="${esc(s)}">${esc(s)}</button>`).join('')}</div>
  </div></div>`);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- term popover ----------
function toggleTerm(btn) {
  const pop = $('#term-pop');
  const wasOpen = btn.getAttribute('aria-expanded') === 'true';
  closeTerm();
  if (wasOpen) return;
  pop.innerHTML = `${esc(GLOSSARY[btn.dataset.term])}<span class="provenance">General info</span>`;
  pop.hidden = false;
  const r = btn.getBoundingClientRect();
  const left = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 16);
  pop.style.left = `${Math.max(16, left)}px`;
  pop.style.top = `${window.scrollY + r.bottom + 8}px`;
  btn.setAttribute('aria-expanded', 'true');
  btn.setAttribute('aria-describedby', 'term-pop');
}
function closeTerm() {
  $('#term-pop').hidden = true;
  $$('.term[aria-expanded="true"]').forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.removeAttribute('aria-describedby'); });
}

// ---------- misc ----------
let toastTimer;
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function setupAskBar() {
  const bar = $('#ask-bar');
  const visible = { glance: true, ask: false };
  const update = () => { bar.hidden = document.body.dataset.screen !== 'report' || !isMobile() || visible.glance || visible.ask; };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { visible[e.target.id] = e.isIntersecting; });
    update();
  });
  io.observe($('#glance'));
  io.observe($('#ask'));
  window.addEventListener('resize', update);
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const t = e.target;
  const chip = t.closest('.quote-chip');
  if (chip) return toggleQuotes(chip);

  const term = t.closest('.term');
  if (term) return toggleTerm(term);
  if (!t.closest('#term-pop')) closeTerm();

  const row = t.closest('.item-row');
  if (row) return openItem(Number(row.closest('.item').dataset.item));

  const go = t.closest('[data-goto]');
  if (go) {
    const i = Number(go.dataset.goto);
    if (isMobile()) return openItemSheet(i);
    openIndex = null;
    openItem(i, { scroll: true });
    $(`#row-${i}`).focus({ preventScroll: true });
    return;
  }

  const line = t.closest('.doc-line, .margin-mark');
  if (line) {
    const i = Number(line.dataset.line);
    if (isMobile()) { $('#estimate-sheet').close(); openItemSheet(i); return; }
    if (openIndex !== i) openItem(i, { scroll: true });
    return;
  }

  const see = t.closest('[data-see-line]');
  if (see) return seeOnEstimate(Number(see.dataset.seeLine));

  if (t.closest('[data-open-estimate]')) return openEstimateSheet();
  if (t.closest('[data-close-sheet]')) return t.closest('dialog').close();
  if (t.closest('[data-copy-questions]')) return copyQuestions();

  const scroll = t.closest('[data-scroll]');
  if (scroll) {
    const target = document.getElementById(scroll.dataset.scroll);
    target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    $('h2', target)?.focus({ preventScroll: true });
    return;
  }

  if (t.closest('#toggle-questions')) { showAllQuestions = !showAllQuestions; return renderQuestions(); }

  if (t.closest('#checked-toggle')) {
    const btn = $('#checked-toggle');
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    $('#checked-body').hidden = open;
    return;
  }
  if (t.closest('#trace-toggle')) {
    const btn = $('#trace-toggle');
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    $('#trace-list').hidden = open;
    return;
  }

  const sug = t.closest('[data-ask]');
  if (sug) return ask(sug.dataset.ask);

  // Click on the sheet backdrop closes it.
  if (t.tagName === 'DIALOG') t.close();
});

// Desktop: hovering a row or a document line highlights its partner.
document.addEventListener('pointerover', (e) => {
  if (isMobile()) return;
  const src = e.target.closest('.item, .doc-line, .margin-mark');
  if (!src) return;
  linkLine(Number(src.dataset.item ?? src.dataset.line));
});
document.addEventListener('pointerout', (e) => {
  if (isMobile()) return;
  const src = e.target.closest('.item, .doc-line, .margin-mark');
  if (!src || src.contains(e.relatedTarget)) return;
  linkLine(openIndex);
});
document.addEventListener('focusin', (e) => {
  const row = e.target.closest('.item-row');
  if (row && !isMobile()) linkLine(Number(row.closest('.item').dataset.item));
});

document.addEventListener('change', (e) => {
  if (!e.target.matches('.q-row input')) return;
  const q = e.target.dataset.q;
  e.target.checked ? asked.add(q) : asked.delete(q);
  e.target.closest('.q-row').classList.toggle('is-asked', e.target.checked);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#term-pop').hidden) return closeTerm();
    if (!isMobile() && openIndex !== null) {
      const i = openIndex;
      openItem(i);
      $(`#row-${i}`).focus();
    }
  }
});

// Copying a quote carries its source line with it.
document.addEventListener('copy', (e) => {
  const sel = window.getSelection();
  const card = sel && sel.anchorNode && sel.anchorNode.parentElement?.closest('.quote-card');
  if (!card) return;
  e.clipboardData.setData('text/plain', `${sel.toString().trim()}\n${card.dataset.cite}`);
  e.preventDefault();
});

$$('[data-zoom]').forEach((b) => b.addEventListener('click', () => setZoom(Number(b.dataset.zoom))));

$$('dialog.sheet').forEach((d) => {
  d.addEventListener('close', () => {
    if (d.id === 'estimate-sheet') {
      $('.evidence').appendChild($('#viewer'));
      linkLine(openIndex);
    }
    if (d.id === 'item-sheet' && d.dataset.item !== undefined) {
      const row = $(`#row-${d.dataset.item}`);
      (row || returnFocus)?.focus();
      return;
    }
    returnFocus?.focus();
  });
  // Swipe down to close.
  let startY = null;
  d.addEventListener('touchstart', (e) => { startY = $('.sheet-body', d).scrollTop === 0 ? e.touches[0].clientY : null; }, { passive: true });
  d.addEventListener('touchend', (e) => { if (startY !== null && e.changedTouches[0].clientY - startY > 80) d.close(); startY = null; });
});

const askInput = $('#ask-input');
askInput.addEventListener('input', () => { $('#char-count').textContent = `${askInput.value.length} / 500`; });
askInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#ask-form').requestSubmit(); }
});
$('#ask-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = askInput.value;
  askInput.value = '';
  $('#char-count').textContent = '0 / 500';
  ask(q);
});

window.addEventListener('resize', () => requestAnimationFrame(placeMarginMarks));
document.fonts?.ready.then(() => requestAnimationFrame(placeMarginMarks));

// ---------- boot ----------
const params = new URLSearchParams(location.search);
if (params.get('present') === '1') document.documentElement.classList.add('present');

function mountReport(report) {
  REPORT = report;
  openIndex = null;
  askCount = 0;
  showAllQuestions = false;
  asked.clear();
  $('#thread').innerHTML = '';
  $('#ask-input').value = '';
  $('#char-count').textContent = '0 / 500';
  renderHeader(); renderItems(); renderPaper(); renderQuestions(); renderChecked(); renderSuggestions();
  $('#checked-toggle').setAttribute('aria-expanded', 'false');
  $('#checked-body').hidden = true;
}
document.getElementById('read-summary-toggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  document.getElementById('read-summary').classList.toggle('is-expanded', expanded);
});
setupAskBar();
