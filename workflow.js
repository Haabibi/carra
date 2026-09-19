/* Static-host compatible routes. All persisted input crosses Zod at read/write. */
(() => {
  history.scrollRestoration = 'manual';
  const C = CarraCore;
  const host = document.getElementById('workflow');
  const reportLayout = document.getElementById('report-layout');
  const key = 'carra.drafts.v1';
  let drafts = [];
  let routeVersion = 0;
  let uploads = [];
  let selected = C.samples[0].sampleId;
  let uploadMode = false;
  let storageAvailable = true;
  const traces = new Map();
  const nowId = () => `estimate-${crypto.randomUUID()}`;
  const read = () => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(data)) throw new Error('Invalid saved data');
      drafts = data.map(d => C.DraftSchema.parse(d));
    } catch {
      drafts = [];
      storageAvailable = false;
      showToast('Saved estimates could not be loaded. This session still works.');
    }
  };
  function save(d) {
    const valid = C.DraftSchema.parse(d);
    drafts = [valid, ...drafts.filter(old => old.id !== valid.id)].slice(0, 30);
    try { localStorage.setItem(key, JSON.stringify(drafts)); }
    catch { storageAvailable = false; showToast('Browser storage is unavailable. Keep this page open to retain your work.'); }
    return valid;
  }
  function loadTrace(id) {
    if (traces.has(id)) return traces.get(id);
    try { return JSON.parse(localStorage.getItem(`carra.trace.${id}`) || '[]').map(C.safeTrace); }
    catch { return []; }
  }
  function saveTrace(id, list) {
    traces.set(id, list);
    try { localStorage.setItem(`carra.trace.${id}`, JSON.stringify(list)); } catch { /* in-memory fallback */ }
  }
  const link = (path, label, style = 'btn-secondary') => `<a class="btn ${style}" href="#${path}">${esc(label)}</a>`;
  const field = (label, name, value, type = 'text', extra = '') => `<label class="field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value ?? '')}" ${extra} ${type === 'text' ? 'required' : ''}></label>`;
  const decimal = value => value == null ? '' : value.toFixed(2);
  const nullableNumber = value => value === '' ? null : Number(value);
  const originLabel = d => d.origin === 'dataset' ? 'Dataset PDF' : d.origin === 'ai' ? 'AI-extracted document' : d.synthetic ? 'Legacy example' : 'Manual entry';
  const stateNote = () => storageAvailable ? '' : '<p class="notice">Browser storage is unavailable. Changes are kept only for this session.</p>';
  function home() {
    const historyHtml = drafts.length ? `${stateNote()}<section class="history"><div class="section-head"><h2>Pick up where you left off</h2><span class="section-note">Your documents</span></div><ul class="history-list">${drafts.map(d => `<li><a href="#/analyze/${d.id}${d.completed ? '' : '/review'}"><span><strong>${esc(d.vehicle)}</strong><span>${esc(d.shop)} · ${esc(d.date)}${" · " + esc(originLabel(d))}</span></span><span><strong>${C.money(d.total)}</strong><span>${d.completed ? 'View report' : 'Continue review'}</span></span></a></li>`).join('')}</ul></section>` : '';
    CarraLanding.render(host, historyHtml);
    CarraLandingMotion.mount(host);
  }
  function input() {
    const version = routeVersion;
    return CarraDocuments.mount(host, { onReady: async (draft, files) => {
      uploads.forEach(entry => URL.revokeObjectURL(entry.url));
      uploads = files.map(file => ({ file, name: file.name, url: URL.createObjectURL(file) }));
      try { await storePages(draft.id); }
      catch { showToast('The original files could not be saved. Keep a copy for reference.'); }
      if (version !== routeVersion) return;
      save(draft);
      location.hash = '/analyze/' + draft.id + '/review';
    } });
  }
  // IndexedDB keeps reference images separate from small validated draft metadata.
  function mediaDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('carra-reference-pages', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('pages');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function storePages(id) {
    if (!uploads.length) return;
    const db = await mediaDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('pages', 'readwrite');
      tx.objectStore('pages').put(uploads.map(u => ({ file: u.file, name: u.name })), id);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    db.close();
  }
  async function showPages(id, target, version) {
    try {
      const db = await mediaDb();
      const rows = await new Promise((resolve, reject) => {
        const req = db.transaction('pages').objectStore('pages').get(id);
        req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error);
      });
      db.close();
      if (version !== routeVersion || !target.isConnected) return;
      if (!rows.length) { target.innerHTML = '<p class="muted">No reference photos attached.</p>'; return; }
      if (rows[0]?.file.type === 'application/pdf') { CarraDocuments.pdfViewer(target, rows[0].file); return; }
      const urls = rows.map(row => URL.createObjectURL(row.file));
      target.innerHTML = `<div class="reference-pages">${rows.map((row, i) => `<figure><img src="${urls[i]}" alt="Original estimate page ${i + 1}"><figcaption>Page ${i + 1} · ${esc(row.name)}</figcaption></figure>`).join('')}</div>`;
      target.querySelectorAll('img').forEach(img => { img.onload = () => URL.revokeObjectURL(img.src); });
    } catch { if (target.isConnected) target.textContent = 'Reference photos could not be loaded. Check the original estimate while reviewing.'; }
  }
  function editRow(item, index) {
    return `<fieldset class="edit-item${item.confidence < .75 ? ' low-confidence' : ''}" data-index="${index}"><legend>Item ${index + 1}${item.confidence < .75 ? ' · Check this' : ''}</legend><div class="edit-item-head">${field('Item title', 'title', item.title)}<button type="button" class="btn btn-quiet" data-delete-item="${index}">Remove item</button></div><label class="field"><span>Exact text from the document</span><textarea name="source_text" rows="2" maxlength="2000" required>${esc(item.source_text)}</textarea></label><div class="field-grid"><label class="field"><span>Work status</span><select name="status">${C.statuses.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${esc(STATUS[s][0])}</option>`).join('')}</select></label>${field('Parts ($)', 'parts', decimal(item.parts), 'number', 'min="0" max="10000000" step="0.01"')}${field('Labor ($)', 'labor', decimal(item.labor), 'number', 'min="0" max="10000000" step="0.01"')}${field('Other ($)', 'other', decimal(item.other), 'number', 'min="0" max="10000000" step="0.01"')}${field('Line total ($)', 'total', decimal(item.total), 'number', 'min="0" max="10000000" step="0.01"')}</div></fieldset>`;
  }
  function review(d) {
    host.innerHTML = `<header class="flow-header"><p class="eyebrow">Step 2 of 3 · Review details</p><h1>${d.origin === "manual" ? "Enter the details from your document." : "Here’s what the document says. Check the details."}</h1><p>${esc(originLabel(d))} · ${d.documentKind === "service_record" ? "Service record — completed work" : "Estimate or repair document"}</p><div class="parsing-summary"><span class="sample-tag">${d.items.length} line items</span>${d.origin === 'dataset' ? '<span class="sample-tag">Dataset reference loaded</span>' : d.confidence != null ? `<span class="sample-tag">${Math.round(d.confidence * 100)}% extraction confidence</span>` : ''}</div>${d.parseReasons?.length ? `<ul class="parse-reasons">${d.parseReasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>` : ''}</header>${stateNote()}
      <form id="review-form" data-id="${d.id}"><div class="review-grid"><section><div class="field-grid metadata-fields">${field('Vehicle (year, make, model)', 'vehicle', d.vehicle)}${field('Shop name', 'shop', d.shop)}${field('Document date', 'date', d.date, 'date')}${field('Odometer (mi)', 'mileage', d.mileage, 'number', 'min="0" max="2000000" step="1"')}</div><label class="field"><span>What brought you to the shop? <small>Optional</small></span><textarea name="concern" maxlength="2000" rows="2">${esc(d.concern)}</textarea></label><h2>Listed work</h2><div id="edit-items">${d.items.map(editRow).join('')}</div><button type="button" class="btn btn-secondary" id="add-item">Add an item</button></section>
      <aside class="review-summary"><h2>Check the totals</h2>${field('Fees ($)', 'fees', decimal(d.fees), 'number', 'min="0" max="10000000" step="0.01"')}${field('Tax ($)', 'tax', decimal(d.tax), 'number', 'min="0" max="10000000" step="0.01"')}${field('Document total ($)', 'grandTotal', decimal(d.total), 'number', 'min="0" max="10000000" step="0.01"')}<div id="reconciliation" role="status" aria-live="polite"></div><details class="reference-disclosure" open><summary>Original document</summary><div id="review-reference"></div></details></aside></div>
      <p id="review-error" class="form-error" role="alert"></p><footer class="review-footer"><span id="save-status" role="status">Changes save in this browser.</span><div class="flow-actions">${link('/analyze/new', 'Retake photos', 'btn-quiet')}<button class="btn btn-primary" type="submit">Looks right, explain it</button></div></footer></form>`;
    const ref = document.getElementById('review-reference');
    if (d.sourcePdf) CarraDocuments.pdfViewer(ref, d.sourcePdf);
    else if (d.synthetic) ref.innerHTML = `<div class="transcript"><p class="sample-tag">Original synthetic example</p>${C.samples.find(s => s.sampleId === d.sampleId).items.map(i => `<p>${esc(i.source_text)} <strong>${C.money(i.total)}</strong></p>`).join('')}</div>`;
    else showPages(d.id, ref, routeVersion);
    totals(d);
  }
  function draftFromForm() {
    const form = document.getElementById('review-form');
    const previous = drafts.find(d => d.id === form.dataset.id);
    const value = name => form.elements.namedItem(name).value;
    const items = [...form.querySelectorAll('.edit-item')].map((row, index) => {
      const get = name => row.querySelector(`[name="${name}"]`).value;
      const original = previous.items[index];
      const title = get('title');
      const source_text = get('source_text');
      const changed = original?.title !== title || original?.source_text !== source_text;
      return { title, source_text, status: get('status'), parts: nullableNumber(get('parts')), labor: nullableNumber(get('labor')), other: nullableNumber(get('other')), total: nullableNumber(get('total')), confidence: original?.confidence,
        plain: changed ? 'An item entered from your estimate.' : original.plain,
        why: changed ? 'Ask your shop to explain what this line covers.' : original.why };
    });
    return C.DraftSchema.parse({ ...previous, completed: false, vehicle: value('vehicle'), shop: value('shop'), date: value('date') || null, mileage: nullableNumber(value('mileage')), concern: value('concern'), items, fees: nullableNumber(value('fees')), tax: nullableNumber(value('tax')), total: nullableNumber(value('grandTotal')) });
  }
  function totals(d) {
    const result = C.reconcile(d);
    document.getElementById('reconciliation').innerHTML = `<div class="reconcile-row"><span>Items + fees + tax</span><strong>${C.money(result.calculated)}</strong></div><div class="reconcile-row"><span>Listed total</span><strong>${C.money(d.total)}</strong></div><p class="${result.needsReview ? 'notice' : 'total-match'}">${result.incomplete ? 'Some amounts are not stated. Check the original document; missing amounts stay blank.' : result.needsReview ? "These totals don't match. A line may be missing or misread." : 'Totals match within $1.'}</p>${result.breakdownMismatch ? '<p class="notice">Parts and labor do not match a line total. Check the cost breakdown.</p>' : ''}`;
  }
  function storeReview() {
    const form = document.getElementById('review-form');
    if (!form.checkValidity()) { document.getElementById('save-status').textContent = 'Complete the highlighted fields to save.'; return null; }
    try {
      const d = save(draftFromForm()); totals(d);
      document.getElementById('save-status').textContent = storageAvailable ? 'Changes saved.' : 'Changes kept for this session.';
      document.getElementById('review-error').textContent = '';
      return d;
    } catch {
      document.getElementById('review-error').textContent = 'Check the text, amounts, and date, then try again.';
      return null;
    }
  }
  async function progress(d, version) {
    const labels = ['Reading your estimate', "Sorting what's approved, recommended, and pending", 'Checking NHTSA recall and complaint records', "Checking the manufacturer's schedule and warranty programs", 'Preparing the item explanations', 'Checking every quote against its source'];
    const steps = ['read_estimate', 'check_statuses', 'check_records', 'check_manufacturer', 'write_explanations', 'verify_quotes'];
    host.innerHTML = `<header class="flow-header"><p class="eyebrow">Step 3 of 3 · Prepare report</p><h1>Making your estimate clearer.</h1><p>Preparing your reviewed document. Public records are not checked.</p></header><div class="progress-grid"><div class="scan-preview"><div class="scan-beam"></div><span class="sample-tag">${esc(originLabel(d))}</span><h2>${esc(d.shop)}</h2><p>${esc(d.vehicle)}</p>${d.items.map(i => `<div class="sample-line"><span>${esc(i.title)}</span><strong>${C.money(i.total)}</strong></div>`).join('')}<p class="sample-total">${C.money(d.total)}</p></div><section><ol class="analysis-steps" aria-label="Analysis progress">${labels.map((label, i) => `<li id="step-${i}" data-status="waiting"><span class="step-number">${i + 1}</span><div><strong>${label}</strong><p>Waiting</p></div></li>`).join('')}</ol><details class="technical-details" ${params.get('trace') === '1' ? 'open' : ''}><summary>Show technical details</summary><p>Actual local operations · no external tool calls</p><ol id="progress-trace" class="trace-list"></ol></details><p id="progress-error" class="form-error" role="alert"></p>${link(`/analyze/${d.id}/review`, 'Back to review', 'btn-quiet')}</section></div>`;
    const events = [];
    const start = performance.now();
    const details = [`${d.items.length} items; ${C.money(d.total)} listed total. ${d.origin === "dataset" ? "Loaded dataset reference." : "Loaded reviewed document fields."}`, `${d.items.filter(i => i.status === 'authorized' || i.status === 'approved').length} approved; ${d.items.filter(i => i.status === 'recommended').length} recommended; ${d.items.filter(i => i.status === 'pending_diagnosis').length} pending.`, 'Not checked: public-record service is not connected.', 'Not checked: no manufacturer source was supplied.', `${d.items.length} items formatted; 5 questions prepared.`, `${d.items.length} of ${d.items.length} quotes match the reviewed document text.`];
    try {
      for (let i = 0; i < steps.length; i++) {
        if (version !== routeVersion) return;
        const row = document.getElementById(`step-${i}`);
        row.dataset.status = 'running'; row.querySelector('p').textContent = 'In progress';
        const began = performance.now();
        if (i === 5) C.buildReport(d);
        const duration = performance.now() - began;
        // Display pacing is separate from measured work duration.
        await new Promise(resolve => setTimeout(resolve, reduceMotion() ? 0 : 600));
        if (version !== routeVersion) return;
        const skipped = i === 2 || i === 3;
        row.dataset.status = skipped ? 'skipped' : 'done'; row.querySelector('p').textContent = details[i];
        const event = C.safeTrace({ type: 'trace', id: `${d.id}-${i}`, step: steps[i], kind: 'check', label: details[i], status: skipped ? 'skipped' : 'ok', startedAtMs: Math.round(began - start), durationMs: Math.round(duration), counts: i === 5 ? { quotes: d.items.length, verified: d.items.length } : undefined });
        events.push(event);
        document.getElementById('progress-trace').insertAdjacentHTML('beforeend', `<li><span class="t">+${(event.startedAtMs / 1000).toFixed(2)}s</span><span>${esc(event.label)}</span><span>${skipped ? 'Skipped' : `${event.durationMs}ms`}</span></li>`);
      }
      saveTrace(d.id, events); save({ ...d, completed: true });
      location.hash = `/analyze/${d.id}`;
    } catch {
      if (version !== routeVersion) return;
      document.getElementById('progress-error').innerHTML = 'The report could not be prepared. Check the estimate details and try again. <button class="btn btn-secondary" id="retry-analysis">Retry</button>';
    }
  }
  function report(d) {
    host.hidden = true;
    reportLayout.hidden = false;
    document.body.dataset.screen = 'report';
    mountReport(C.buildReport(d, loadTrace(d.id)));
    const existing = document.getElementById('report-tools');
    existing?.remove();
    document.getElementById('report').insertAdjacentHTML('afterbegin', `<div id="report-tools" class="report-tools"><span class="sample-tag">${esc(originLabel(d))}</span>${link(`/analyze/${d.id}/review`, 'Edit details', 'btn-quiet')}<button class="btn btn-quiet" id="print-report">Print report</button></div>`);
    document.querySelector('#viewer-head-original')?.remove();
    document.querySelector('#viewer .reference-disclosure')?.remove();
    if (d.sourcePdf || !d.synthetic) {
      document.getElementById('viewer').insertAdjacentHTML('beforeend', '<details class="reference-disclosure" open><summary>Original document</summary><div id="report-reference"></div></details>');
      if (d.sourcePdf) CarraDocuments.pdfViewer(document.getElementById('report-reference'), d.sourcePdf);
      else showPages(d.id, document.getElementById('report-reference'), routeVersion);
    }
    document.querySelector('#viewer .viewer-head h2').textContent = 'Reviewed line items';
    document.getElementById('mode-banner').textContent = `${esc(originLabel(d))} · Public records not checked · Original document available for comparison`;
    if (params.get('trace') === '1') { document.getElementById('checked-toggle').click(); document.getElementById('trace-toggle').click(); }
  }
  function route() {
    if (location.hash && !location.hash.startsWith('#/')) return;
    CarraLandingMotion.stop();
    CarraDocuments.dispose();
    CarraMyPage.dispose();
    const version = ++routeVersion;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    host.hidden = false; reportLayout.hidden = true;
    document.body.dataset.screen = 'workflow';
    document.getElementById('ask-bar').hidden = true;
    document.getElementById('mode-banner').textContent = 'Read your document, check the details, and keep the original in view. Public records are not checked.';
    const path = location.hash.slice(1) || '/';
    document.body.classList.toggle('landing-page', path === '/');
    document.getElementById('mode-banner').hidden = ['/', '/my', '/onboarding'].includes(path);
    document.querySelector('.skip-link').href = ['/', '/my', '/onboarding'].includes(path) || path.endsWith('/new') || /\/(review|progress)$/.test(path) ? '#workflow' : '#report';
    document.querySelector('.skip-link').textContent = 'Skip to content';
    if (path === '/') home();
    else if (path === '/my') CarraMyPage.mount(host, { drafts, showOriginal: (d, target) => showPages(d.id, target, version) });
    else if (path === '/onboarding') CarraMyPage.onboarding(host);
    else if (path === '/analyze/new') input();
    else {
      const match = path.match(/^\/analyze\/([a-zA-Z0-9-]+)(?:\/(review|progress))?$/);
      const draft = match && drafts.find(d => d.id === match[1]);
      if (!draft) host.innerHTML = `<div class="empty-state"><h1>Estimate not found</h1><p>This estimate is not saved in this browser.</p>${link('/analyze/new', 'Start a new estimate', 'btn-primary')}</div>`;
      else if (match[2] === 'review') review(draft);
      else if (match[2] === 'progress') progress(draft, version);
      else if (!draft.completed) { location.hash = `/analyze/${draft.id}/review`; return; }
      else report(draft);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    (host.hidden ? document.getElementById('report') : host).focus({ preventScroll: true });
    document.title = path === '/' ? 'Carra | Your everyday car companion' : `${path === '/my' ? 'My page' : path === '/onboarding' ? 'Your profile' : path === '/analyze/new' ? 'New estimate' : 'Estimate'} | Carra`;
  }
  host.addEventListener('click', async e => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.dataset.startSample) {
      const version = routeVersion;
      button.disabled = true;
      try {
        const d = await CarraDocuments.readSample(button.dataset.startSample);
        if (version === routeVersion) { save(d); location.hash = `/analyze/${d.id}/review`; }
      } catch { showToast('The sample could not be loaded. Try again.'); button.disabled = false; }
      return;
    }
    if (button.id === 'add-item' || button.dataset.deleteItem !== undefined) {
      const d = storeReview();
      if (!d) { document.getElementById('review-form').reportValidity(); return; }
      if (button.id === 'add-item') {
        if (d.items.length >= 40) { showToast('This preview supports up to 40 items.'); return; }
        d.items.push(C.createManualDraft('temp').items[0]);
      } else {
        if (d.items.length === 1) { showToast('Keep at least one estimate item.'); return; }
        d.items.splice(Number(button.dataset.deleteItem), 1);
      }
      save(d); review(d);
    }
    if (button.id === 'retry-analysis') route();
  });
  host.addEventListener('input', e => { if (e.target.closest('#review-form')) storeReview(); });
  host.addEventListener('submit', e => {
    if (e.target.id !== 'review-form') return;
    e.preventDefault(); const d = storeReview();
    if (d) location.hash = `/analyze/${d.id}/progress`;
  });
  document.addEventListener('click', e => { if (e.target.closest('#print-report')) window.print(); });
  document.addEventListener('keydown', e => {
    if (e.shiftKey && e.key.toLowerCase() === 'd' && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); showToast('Local demo mode is active. No live services are connected.'); }
  });
  window.addEventListener('hashchange', route);
  CarraLanding.bind(host);
  read(); route();
})();
