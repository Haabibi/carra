/* The marketing page is isolated from the estimate workflow. */
window.CarraLanding = (() => {
  const icons = {
    car: '<path d="m5 10 2-5h10l2 5M4 10h16v8H4zM7 18v2m10-2v2M7 13h2m6 0h2"/>',
    paper: '<path d="M7 3h7l4 4v14H5V3h2Zm7 0v5h4M8 12h7M8 16h7"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-11 4h2m3 0h2m-7 3h2"/>',
    chat: '<path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/>',
    folder: '<path d="M3 7V4h7l3 3h8v13H3V7Z"/><path d="M3 10h18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.car}</svg>`;
  const topics = [
    { name: 'Repair estimates', icon: 'paper', kicker: 'A little clarity before you say yes.', title: 'Less jargon.<br>Better conversations.', text: 'Make sense of the line items, see what is approved, and bring useful questions to your mechanic. Start with an estimate and leave with a clearer next step.', action: 'Try a sample estimate', hint: 'Interactive example · No sign-up', label: 'Estimate overview',
      content: `<div class="preview-car">${icon('car')}<span><strong>2022 Kia EV6</strong><small>Synthetic example</small></span><span class="preview-tag">3 items</span></div><div class="preview-amount"><span>Your listed total</span><strong>$600.36</strong></div><div class="preview-line"><span>12-volt battery test</span><span>$92.50</span></div><div class="preview-line"><span>Charging system testing</span><span>$185.00</span></div><div class="preview-line"><span>Possible battery replacement</span><span>$300.50</span></div><p class="preview-fees">Includes $22.36 in listed fees and tax.</p><div class="preview-note">${icon('chat')}<span><strong>A question worth taking with you</strong>What did the tests show before we decide on the battery?</span></div>` },
    { name: 'Maintenance & records', icon: 'calendar', kicker: 'For the miles between shop visits.', title: 'Your car’s story.<br>All in one place.', text: 'Service receipts, mileage, and that detail you can never remember. Keep your documents and protection plans together in your garage.', action: 'Open my garage', hint: 'Your garage is ready. Reminders are coming next.', label: 'Your garage · Product preview',
      content: `<div class="preview-car">${icon('car')}<span><strong>Your everyday ride</strong><small>A home for your car’s history</small></span><span class="preview-tag">Preview</span></div><h4>A little more organized.</h4><div class="garage-entry">${icon('folder')}<span><strong>Service records</strong><small>Receipts and work performed, together.</small></span></div><div class="garage-entry">${icon('calendar')}<span><strong>Maintenance reminders</strong><small>Keep your next check-in in view.</small></span></div><div class="garage-entry">${icon('paper')}<span><strong>The details that matter</strong><small>Mileage, dates, and your notes.</small></span></div><div class="preview-note"><span>One place to pick up where you left off.</span></div>` },
    { name: 'Everyday car questions', icon: 'chat', kicker: 'No “car person” credentials required.', title: 'Big questions.<br>Plain-English answers.', text: 'From unfamiliar terms to preparing for a shop visit, Carra is being built to help you ask, understand, and feel more involved in caring for your car.', action: 'Start with your estimate', hint: 'General car chat is coming next.', label: 'A conversation with Carra · Product preview',
      content: `<div class="preview-chat-user">What can I ask my mechanic?</div><div class="preview-chat-agent"><img src="design/carra-character/carra-agent.png" alt=""><div><strong>Carra</strong><p>Start with what you want to understand. Here are a few questions to take along.</p></div></div><ol class="preview-prompts"><li>What did the inspection show?</li><li>Can you walk me through the listed work?</li><li>How will you check with me if the plan changes?</li></ol><span class="preview-general">General information</span>` },
    { name: 'Warranty & insurance', icon: 'check', kicker: 'Understand your protection.', title: 'Before you pay,<br>know what to check.', text: 'Find the warranty questions, insurance benefits, and reimbursement steps worth exploring alongside each repair. Know who to contact and what to bring.', action: 'Explore coverage with a sample', hint: 'Coverage at a glance, beside each repair', label: 'Your protection',
      content: `<div class="preview-car">${icon('check')}<span><strong>Your protection, together</strong><small>Your plans, clearly explained</small></span></div><div class="garage-entry">${icon('car')}<span><strong>Warranty eligibility</strong><small>Ask an authorized center to check the listed charging-system work.</small></span></div><div class="garage-entry">${icon('paper')}<span><strong>Already paid?</strong><small>Prepare an invoice and ask about reimbursement rules.</small></span></div><div class="garage-entry">${icon('folder')}<span><strong>Towing and rental benefits</strong><small>Check covered events, limits, and receipts with your insurer.</small></span></div><div class="preview-note"><span>See the relevant plan beside each repair, then keep the details in My page.</span></div>` },
  ];
  function preview(index) {
    const topic = topics[index];
    return `<div class="explorer-copy"><span class="landing-eyebrow">${topic.kicker}</span><h3>${topic.title}</h3><p>${topic.text}</p>${index === 1 ? `<a class="landing-button blue" href="#/my">Open my garage</a>` : `<button type="button" class="landing-button blue" ${(index === 0 || index === 3) ? 'data-start-sample="ev6-12v"' : 'data-landing-start'}>${topic.action}</button>`}<small>${topic.hint}</small></div><div class="product-preview"><div class="preview-chrome"><span class="preview-dot"></span><span>${topic.label}</span><span class="preview-brand">carra</span></div><div class="preview-content">${topic.content}</div></div>`;
  }
  function render(host, historyHtml) {
    host.innerHTML = `<div class="landing">
      <section class="landing-hero" aria-labelledby="landing-title">
        <div class="hero-copy"><span class="landing-eyebrow"><i></i> A little clarity for your car</span><h1 id="landing-title" tabindex="-1">Car ownership,<br>with a <span>copilot.</span></h1><p class="hero-description">The questions. The paperwork. The “what now?”<br>Understand repairs, explore warranty and insurance, and find your next step with Carra.</p><div class="hero-actions"><a href="#/analyze/new" class="landing-button blue">Try Carra</a><button type="button" class="landing-button outline" data-landing-scroll="explore-carra">Take a look around</button></div><div class="hero-footnote"><span>${icon('check')} No sign-up to try</span><span>${icon('check')} Made for everyday drivers</span></div></div>
        <div class="hero-scene"><div class="scene-orbit orbit-one"></div><div class="scene-orbit orbit-two"></div><span class="scene-label">Meet your new car companion</span><div class="scene-halo"></div><div class="hero-mascot"><img src="design/carra-character/carra-agent.png" alt="Carra, your friendly blue and silver car companion" fetchpriority="high" width="1280" height="1280"></div><button class="scene-card scene-question" type="button" data-landing-scroll="explore-carra" data-select-topic="2"><span class="scene-icon">${icon('chat')}</span><span>A question about your car?<strong>That’s a Carra question.</strong></span></button><button class="scene-card scene-record" type="button" data-landing-scroll="explore-carra" data-select-topic="1"><span class="scene-icon">${icon('folder')}</span><span>The little details.<strong>The bigger picture.</strong></span></button><div class="scene-caption"><span class="hello-dot"></span> On your side. Along for the ride.<button class="mascot-motion-control" type="button">Play Carra greeting</button></div></div>
      </section>
      <div class="landing-principles" aria-label="The Carra approach"><span>${icon('chat')} Plain English, always</span><span>${icon('car')} Your car at the center</span><span>${icon('paper')} Clarity before decisions</span></div>
      <section class="landing-explore" id="explore-carra" aria-labelledby="explore-title"><div class="landing-section-head"><div><span class="landing-eyebrow">One companion. The whole journey.</span><h2 id="explore-title" tabindex="-1">For the “what does this mean?”<br>and the “what comes next?”</h2></div><p>More than a single shop visit.<br>A simpler way to navigate car ownership.</p></div><div class="explorer-tabs" role="tablist" aria-label="Explore Carra features">${topics.map((topic, i) => `<button type="button" id="carra-topic-${i}" role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" aria-controls="carra-preview" data-topic="${i}">${icon(topic.icon)}${topic.name}<span class="tab-number">0${i + 1}</span></button>`).join('')}</div><div class="explorer-panel" id="carra-preview" role="tabpanel" aria-labelledby="carra-topic-0" tabindex="0">${preview(0)}</div></section>
      <section class="landing-how" id="how-carra-works" aria-labelledby="how-title"><div class="landing-section-head"><div><span class="landing-eyebrow">A good place to start</span><h2 id="how-title" tabindex="-1">Bring the estimate.<br>Leave with a little clarity.</h2></div><a href="#/analyze/new" class="landing-text-link">Explore your estimate</a></div><div class="landing-steps"><article><span class="step-index">01</span><h3>Start where you are.</h3><p>Bring an estimate from your shop, or take a sample for a spin.</p></article><article><span class="step-index">02</span><h3>Make sense of the details.</h3><p>Review the listed work, amounts, and what’s waiting for your approval.</p></article><article><span class="step-index">03</span><h3>Know what to ask.</h3><p>Take a short list of useful questions into your next conversation.</p></article></div></section>
      ${historyHtml}
      <section class="landing-faq" aria-labelledby="faq-title"><div><span class="landing-eyebrow">Glad you asked</span><h2 id="faq-title">A few things<br>you might be wondering.</h2></div><div class="faq-list"><details><summary>Is Carra just for repair estimates?</summary><p>No. Carra brings repair understanding, warranty questions, insurance benefits, and reimbursement preparation together. Try document review and My page today. Connect your paperwork with your car’s protection.</p></details><details><summary>Do I need to know anything about cars?</summary><p>Come as you are. Carra uses plain language and helps you prepare questions, so you can be part of the conversation even if cars aren’t your thing.</p></details><details><summary>Can I try it without uploading anything?</summary><p>Yes. Pick a sample estimate and explore the full review experience. No account or personal documents needed.</p><button type="button" class="landing-text-link" data-start-sample="ev6-12v">Open a sample estimate</button></details><details><summary>Does Carra replace my mechanic?</summary><p>No. Carra helps you understand information and prepare questions. Your mechanic can inspect your car and discuss the work with you. You stay in the driver’s seat.</p></details></div></section>
      <section class="landing-final"><div><span class="landing-eyebrow">Less guessing. More understanding.</span><h2>Your car has you.<br>You have Carra.</h2><p>Start with one question. Or one estimate.</p><button type="button" class="landing-button pale" data-start-sample="ev6-12v">Give Carra a try</button></div><div class="final-monogram" aria-hidden="true">c<span>•</span></div></section>
      <footer class="landing-footer"><a class="brand" href="#/" aria-label="Carra home"><span class="brand-mark" aria-hidden="true">C</span>carra</a><span>A little clarity. Every mile.</span><button type="button" data-landing-scroll="landing-title">Back to top</button></footer>
    </div>`;
  }
  function select(host, index, focus = false) {
    if (!topics[index] || !host.querySelector('#carra-preview')) return;
    host.querySelectorAll('[data-topic]').forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    const panel = host.querySelector('#carra-preview');
    panel.setAttribute('aria-labelledby', `carra-topic-${index}`);
    panel.innerHTML = preview(index);
    if (focus) host.querySelector(`#carra-topic-${index}`).focus();
  }
  function bind(host) {
    host.addEventListener('click', event => {
      const tab = event.target.closest('[data-topic]');
      if (tab) select(host, Number(tab.dataset.topic));
      const selectCard = event.target.closest('[data-select-topic]');
      if (selectCard) select(host, Number(selectCard.dataset.selectTopic));
      const scroll = event.target.closest('[data-landing-scroll]');
      if (scroll) {
        const target = document.getElementById(scroll.dataset.landingScroll);
        target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        (target?.querySelector('h2') || target)?.focus({ preventScroll: true });
      }
      if (event.target.closest('[data-landing-start]')) location.hash = '/analyze/new';
    });
    host.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-topic]');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const i = Number(tab.dataset.topic);
      select(host, event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (i + (event.key === 'ArrowRight' ? 1 : 2)) % 3, true);
    });
  }
  return { render, bind };
})();
