/* Original PDFs are rendered locally with PDF.js. AI requests send the original
   PDF/image bytes, never the preview canvas or a filename-based fixture guess. */
window.CarraDocuments = (() => {
  let pdfModule;
  let currentCleanup = () => {};
  const viewers = new Set();
  const targetViewers = new WeakMap();
  const number = value => value == null ? 'Not stated' : CarraCore.money(value);
  async function pdfjs() {
    if (!pdfModule) pdfModule = import('/vendor/pdf.mjs').then(module => { module.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.mjs'; return module; });
    return pdfModule;
  }
  function dispose() { currentCleanup(); currentCleanup = () => {}; for (const cleanup of [...viewers]) cleanup(); }
  async function pdfViewer(target, source) {
    targetViewers.get(target)?.();
    let document, task, renderTask;
    let alive = true;
    let pageNumber = 1;
    let zoom = 1;
    let sequence = 0;
    const close = () => { alive = false; renderTask?.cancel(); task?.destroy().catch(() => {}); viewers.delete(close); };
    viewers.add(close);
    targetViewers.set(target, close);
    target.innerHTML = '<div class="pdf-loading" role="status">Opening original PDF…</div>';
    try {
      const lib = await pdfjs();
      if (!alive || !target.isConnected) return close();
      task = lib.getDocument(typeof source === 'string' ? { url: source, isEvalSupported: false } : { data: new Uint8Array(await source.arrayBuffer()), isEvalSupported: false });
      document = await task.promise;
      if (!alive || !target.isConnected) return close();
      if (document.numPages > 5) throw new Error('Use a PDF with five pages or fewer.');
      target.innerHTML = `<div class="pdf-toolbar"><button type="button" data-pdf="previous" aria-label="Previous PDF page">Previous</button><span class="pdf-position" aria-live="polite"></span><button type="button" data-pdf="next" aria-label="Next PDF page">Next</button><span class="pdf-toolbar-spacer"></span><button type="button" data-pdf="out" aria-label="Zoom PDF out">−</button><span class="pdf-zoom">100%</span><button type="button" data-pdf="in" aria-label="Zoom PDF in">+</button></div><div class="pdf-scroll"><canvas role="img" aria-label="Original document page"></canvas></div><details class="pdf-text"><summary>Text on this page</summary><pre></pre></details>`;
      const canvas = target.querySelector('canvas');
      async function draw() {
        const drawId = ++sequence;
        renderTask?.cancel();
        const page = await document.getPage(pageNumber);
        if (!alive || drawId !== sequence) return;
        const viewport = page.getViewport({ scale: 1 });
        const width = Math.max(240, target.clientWidth - 32) * zoom;
        const scale = width / viewport.width;
        const density = Math.min(devicePixelRatio || 1, 2);
        const view = page.getViewport({ scale: scale * density });
        canvas.width = Math.round(view.width); canvas.height = Math.round(view.height);
        canvas.style.width = `${width}px`; canvas.style.height = `${view.height / density}px`;
        canvas.setAttribute('aria-label', `Original PDF, page ${pageNumber} of ${document.numPages}`);
        target.querySelector('.pdf-position').textContent = `Page ${pageNumber} of ${document.numPages}`;
        target.querySelector('.pdf-zoom').textContent = `${Math.round(zoom * 100)}%`;
        target.querySelector('[data-pdf=previous]').disabled = pageNumber === 1;
        target.querySelector('[data-pdf=next]').disabled = pageNumber === document.numPages;
        target.querySelector('[data-pdf=out]').disabled = zoom <= .75;
        target.querySelector('[data-pdf=in]').disabled = zoom >= 2;
        renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport: view });
        await renderTask.promise;
        const content = await page.getTextContent();
        if (alive && drawId === sequence) target.querySelector('pre').textContent = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('') || 'This page is an image. AI can read the page when you choose Read document.';
      }
      target.addEventListener('click', event => {
        const action = event.target.closest('[data-pdf]')?.dataset.pdf;
        if (!action || !alive) return;
        if (action === 'previous') pageNumber = Math.max(1, pageNumber - 1);
        if (action === 'next') pageNumber = Math.min(document.numPages, pageNumber + 1);
        if (action === 'in') zoom = Math.min(2, zoom + .25);
        if (action === 'out') zoom = Math.max(.75, zoom - .25);
        draw().catch(error => { if (error.name !== 'RenderingCancelledException' && alive) target.querySelector('.pdf-position').textContent = 'Could not render this page.'; });
      });
      await draw();
    } catch (error) {
      if (!alive) return;
      target.innerHTML = `<p class="form-error" role="alert">${error.name === 'PasswordException' ? 'This PDF is password protected. Use an unlocked copy.' : 'This PDF could not be opened. Try exporting it again.'}</p>`;
    }
    return close;
  }
  async function readSample(id) {
    const response = await fetch(`/api/samples/${encodeURIComponent(id)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The sample could not be loaded.');
    return CarraCore.DraftSchema.parse(result.draft);
  }
  const base64 = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
  async function mount(host, { onReady, preferredSample = 'service_record-29' }) {
    currentCleanup();
    let alive = true;
    let entries = [];
    let files = [];
    let mode = 'sample';
    let selected = preferredSample;
    let concern = '';
    let busy = false;
    let documentCleanup;
    let previewVersion = 0;
    const controller = new AbortController();
    currentCleanup = () => { alive = false; controller.abort(); documentCleanup?.(); files.forEach(file => URL.revokeObjectURL(file.url)); };
    host.innerHTML = '<div class="pdf-loading" role="status">Loading your document library…</div>';
    try {
      const response = await fetch('/api/samples', { signal: controller.signal });
      if (!response.ok) throw new Error('Document library unavailable. Start the app with npm run dev.');
      const body = await response.json();
      entries = body.samples;
      if (!Array.isArray(entries) || entries.some(entry => !/^\/data\/carra-(estimates|service-records)\/samples\/[\w.-]+\.pdf$/.test(entry.url))) throw new Error('The document library could not be read.');
      if (!alive) return;
      draw();
    } catch (error) { if (alive) host.innerHTML = `<h1>Open your car document</h1><p class="form-error" role="alert">${esc(error.message)}</p><a class="btn btn-secondary" href="#/">Go to home</a>`; }
    function draw() {
      documentCleanup?.();
      host.innerHTML = `<header class="flow-header document-header"><p class="eyebrow">Your documents, made clearer</p><h1>Let’s take a look.</h1><p>Understand a repair estimate or revisit work already done. Start with a sample, or bring your own PDF or photos.</p></header><div class="document-intake"><section class="document-controls"><div class="mode-tabs" role="group" aria-label="Document source"><button type="button" data-doc-mode="sample" class="btn ${mode === 'sample' ? 'btn-primary' : 'btn-secondary'}" aria-pressed="${mode === 'sample'}">Try a sample</button><button type="button" data-doc-mode="upload" class="btn ${mode === 'upload' ? 'btn-primary' : 'btn-secondary'}" aria-pressed="${mode === 'upload'}">Use my estimate</button></div>
      ${mode === 'sample' ? `<label class="field"><span>Choose a document</span><select id="document-sample">${[['service_record', 'Service records · completed work'], ['estimate', 'Estimates · proposed work']].map(([kind, label]) => `<optgroup label="${label}">${entries.filter(entry => entry.kind === kind).map(entry => `<option value="${entry.id}" ${entry.id === selected ? 'selected' : ''}>${esc(entry.label)}</option>`).join('')}</optgroup>`).join('')}</select></label><div class="document-facts" id="document-facts"></div><p class="document-note">Original PDFs from the supplied Carra datasets. The documents contain fictional training data.</p>` : `<div class="document-drop" id="document-drop"><span class="document-upload-icon" aria-hidden="true">+</span><h2>Drop your document here</h2><p>One PDF or up to five photos.<br>Include totals, notes, and every page.</p><div class="flow-actions"><label class="btn btn-secondary file-button">Choose files<input id="document-files" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple></label><label class="btn btn-quiet file-button">Take a photo<input id="document-camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></label></div></div><p class="document-note">PDF: up to 5 pages / 10 MB. Images: up to 5 MB each, 15 MB total.</p><div id="document-files-list"></div>`}
      <label class="field"><span>Anything you want to understand? <small>Optional</small></span><textarea id="document-concern" maxlength="2000" rows="3" placeholder="Example: Which work is already approved?">${esc(concern)}</textarea></label><button type="button" class="btn btn-primary document-read" id="document-read">Read document</button><p id="document-reading-status" class="document-note" role="status">${mode === 'sample' ? 'Try the full review with this original PDF.' : 'When you choose Read document, the file is sent to Carra for AI reading.'}</p><p id="document-error" class="form-error" role="alert"></p><button type="button" class="link-button" id="document-manual" ${mode === 'sample' ? 'hidden' : ''}>Enter details manually instead</button><div class="document-next"><strong>What happens next?</strong><p>Check the extracted text and amounts beside your original. Then explore a report with the listed work and questions to ask.</p></div></section>
      <aside class="document-preview"><div class="document-preview-head"><span id="document-preview-title">Original document</span><span class="sample-tag" id="document-type-tag">PDF preview</span></div><div id="document-preview-body"></div></aside></div>`;
      if (mode === 'sample') showSample(); else showFiles();
      host.querySelectorAll('[data-doc-mode]').forEach(button => button.onclick = () => { if (busy) return; concern = host.querySelector('#document-concern').value; mode = button.dataset.docMode; draw(); });
      host.querySelector('#document-sample')?.addEventListener('change', event => { selected = event.target.value; showSample(); });
      for (const id of ['document-files', 'document-camera']) host.querySelector(`#${id}`)?.addEventListener('change', event => { addFiles([...event.target.files]); event.target.value = ''; });
      const drop = host.querySelector('#document-drop');
      drop?.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('is-over'); });
      drop?.addEventListener('dragleave', () => drop.classList.remove('is-over'));
      drop?.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('is-over'); addFiles([...event.dataTransfer.files]); });
      host.querySelector('#document-read').onclick = read;
      host.querySelector('#document-manual').onclick = async () => {
        if (busy) return;
        const draft = CarraCore.createManualDraft(`estimate-${crypto.randomUUID()}`);
        draft.items[0].parts = null; draft.items[0].labor = null; draft.items[0].total = null;
        draft.fees = null; draft.tax = null; draft.total = null; draft.origin = 'manual';
        draft.concern = host.querySelector('#document-concern').value;
        await onReady(draft, files.map(entry => entry.file));
      };
    }
    async function showSample() {
      documentCleanup?.();
      const version = ++previewVersion;
      const entry = entries.find(entry => entry.id === selected) || entries[0];
      selected = entry.id;
      host.querySelector('#document-facts').innerHTML = `<span class="document-kind">${entry.kind === 'service_record' ? 'Service record · completed work' : 'Estimate · proposed work'}</span><h2>${esc(entry.vehicle)}</h2><p>${esc(entry.shop)}<br>${esc(entry.date)}</p><div><span>${entry.count} line items</span><strong>${number(entry.total)}</strong></div>`;
      host.querySelector('#document-type-tag').textContent = entry.kind === 'service_record' ? 'Service record' : 'Estimate';
      host.querySelector('#document-preview-title').textContent = entry.file;
      const cleanup = await pdfViewer(host.querySelector('#document-preview-body'), entry.url);
      if (alive && version === previewVersion) documentCleanup = cleanup; else cleanup?.();
    }
    function showFiles() {
      host.querySelector('#document-files-list').innerHTML = files.map((entry, index) => `<div class="document-file ${entry.active ? 'selected' : ''}"><button type="button" data-file-open="${index}"><span class="document-file-icon">${entry.file.type === 'application/pdf' ? 'PDF' : 'IMG'}</span><span>${esc(entry.file.name)}<small>${entry.pages} ${entry.pages === 1 ? 'page' : 'pages'} · ${(entry.file.size / 1024 / 1024).toFixed(1)} MB</small></span></button><button type="button" data-file-up="${index}" aria-label="Move file ${index + 1} earlier" ${index === 0 ? 'disabled' : ''}>Move up</button><button type="button" data-file-remove="${index}" aria-label="Remove file ${index + 1}">Remove</button></div>`).join('');
      host.querySelectorAll('[data-file-remove]').forEach(button => button.onclick = () => { if (busy) return; const [entry] = files.splice(Number(button.dataset.fileRemove), 1); URL.revokeObjectURL(entry.url); showFiles(); });
      host.querySelectorAll('[data-file-up]').forEach(button => button.onclick = () => { if (busy) return; const i = Number(button.dataset.fileUp); [files[i - 1], files[i]] = [files[i], files[i - 1]]; showFiles(); });
      host.querySelectorAll('[data-file-open]').forEach(button => button.onclick = () => showFile(Number(button.dataset.fileOpen)));
      if (files.length) showFile(0);
      else { documentCleanup?.(); host.querySelector('#document-preview-body').innerHTML = '<div class="document-empty"><span aria-hidden="true">▤</span><h2>Your original, right here.</h2><p>Add a PDF or photo to preview it before reading.</p></div>'; }
      host.querySelector('#document-read').disabled = !files.length;
    }
    async function showFile(index) {
      documentCleanup?.(); const version = ++previewVersion;
      const entry = files[index]; const target = host.querySelector('#document-preview-body');
      host.querySelector('#document-preview-title').textContent = entry.file.name;
      host.querySelector('#document-type-tag').textContent = entry.file.type === 'application/pdf' ? `${entry.pages} pages` : `Photo ${index + 1}`;
      if (entry.file.type === 'application/pdf') {
        const cleanup = await pdfViewer(target, entry.file);
        if (alive && version === previewVersion) documentCleanup = cleanup; else cleanup?.();
      } else target.innerHTML = `<div class="document-photo"><img src="${entry.url}" alt="Uploaded document page ${index + 1}"></div>`;
    }
    async function addFiles(incoming) {
      if (busy) return;
      const error = host.querySelector('#document-error'); error.textContent = '';
      const all = [...files.map(entry => entry.file), ...incoming];
      if (all.length > 5 || (all.some(file => file.type === 'application/pdf') && all.length !== 1)) { error.textContent = 'Choose one PDF or up to five images. Remove existing files before switching formats.'; return; }
      if (all.reduce((n, file) => n + file.size, 0) > 15 * 1024 * 1024) { error.textContent = 'Keep the total upload under 15 MB.'; return; }
      const added = [];
      busy = true;
      try {
        for (const file of incoming) {
          if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a PDF, JPEG, PNG, or WebP file.');
          if (file.size > (file.type === 'application/pdf' ? 10 : 5) * 1024 * 1024) throw new Error('Use a PDF under 10 MB or an image under 5 MB.');
          let pages = 1;
          if (file.type === 'application/pdf') {
            const task = (await pdfjs()).getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
            try { const pdf = await task.promise; pages = pdf.numPages; if (pages > 5) throw new Error('Use a PDF with five pages or fewer.'); }
            finally { await task.destroy(); }
          } else { const bitmap = await createImageBitmap(file); bitmap.close(); }
          added.push({ file, pages });
        }
        if (!alive) return;
        files.push(...added.map(entry => ({ ...entry, url: URL.createObjectURL(entry.file) })));
        showFiles();
      } catch (failure) { if (alive) error.textContent = failure.name === 'PasswordException' ? 'This PDF is password protected. Use an unlocked copy.' : failure.message || 'That file could not be opened.'; }
      finally { busy = false; }
    }
    async function read() {
      if (busy) return;
      busy = true; const button = host.querySelector('#document-read'); button.disabled = true;
      const error = host.querySelector('#document-error'); error.textContent = '';
      const status = host.querySelector('#document-reading-status');
      button.textContent = 'Reading document…'; status.textContent = mode === 'sample' ? 'Loading the reference data for this PDF…' : 'Reading the pages, amounts, and work status. This can take up to a minute.';
      try {
        let draft;
        if (mode === 'sample') draft = await readSample(selected);
        else {
          const payload = await Promise.all(files.map(async entry => ({ name: entry.file.name, type: entry.file.type, data: await base64(entry.file) })));
          const response = await fetch('/api/estimates/parse', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ files: payload }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(90000)]) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'This document could not be read. Try again or use manual entry.');
          draft = CarraCore.DraftSchema.parse(result.draft);
        }
        if (!alive) return;
        draft.concern = host.querySelector('#document-concern').value.trim() || draft.concern;
        await onReady(draft, mode === 'sample' ? [] : files.map(entry => entry.file));
      } catch (failure) {
        if (alive) { error.textContent = failure.name === 'TimeoutError' ? 'Reading timed out. Try again or enter the details manually.' : failure.message; status.textContent = 'Your file is still here. You can retry without uploading it again.'; }
      } finally { busy = false; if (alive) { button.disabled = false; button.textContent = 'Read document'; } }
    }
  }
  return { mount, pdfViewer, readSample, dispose };
})();
