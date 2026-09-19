(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const rowFor = (report, index) => {
    const row = CarraCore.coverageFor(report)[index];
    const profile = window.CarraProfile?.get();
    if ((profile?.warranty === '' && ['warranty', 'expired'].includes(row.route)) || (profile?.insurance === '' && row.route === 'insurance')) {
      return { ...row, route: 'unknown', label: 'Add your plan', reason: 'No matching protection plan is saved in your profile.', next: 'Add your warranty or insurance details in My page to review this item.' };
    }
    return row;
  };
  function badge(report, index) {
    const row = rowFor(report, index);
    return `<span class="coverage-badge coverage-${row.route}"><span aria-hidden="true">${['warranty', 'record'].includes(row.route) ? '&#10003;' : '&#183;'}</span> ${esc(row.label)}</span>`;
  }
  function detail(report, index) {
    const row = rowFor(report, index);
    return `<details class="item-coverage coverage-${row.route}"><summary>${badge(report, index)}<span>Plan details &amp; next step</span></summary><div class="item-coverage-body"><p>${esc(row.reason)}</p><p><strong>Next step</strong> ${esc(row.next)}</p>${row.route === 'warranty' && report.documentKind === 'service_record' ? '<p><strong>Already paid?</strong> Request a reimbursement review with your invoice and payment receipt. Prior authorization and plan limits still apply.</p>' : ''}<a href="#/my">View my plans &amp; documents &rarr;</a></div></details>`;
  }
  window.CarraProtection = { badge, detail };
})();
