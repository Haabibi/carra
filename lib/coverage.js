// Fictional pitch-profile terms, never a coverage decision for uploaded files.
export const demoProtection = {
  warranty: { name: 'Carra Care', terms: 'Electrical protection', detail: 'Component defects and associated diagnostic testing, through September 19, 2027 or 60,000 miles. Routine maintenance, wear, and 12-volt battery replacement excluded. Repair authorization required.' },
  insurance: { name: 'Carra Auto', terms: 'Comprehensive & collision', detail: '$500 deductible for eligible incidents. Towing up to $100; rental up to $40/day for 5 days. Event approval required.' },
};
export function coverageFor(report, { paid = false } = {}) {
  const sample = report.origin === 'dataset' || (!report.origin && report.synthetic === true);
  const mileage = typeof report.mileage === 'number' ? report.mileage : Number(String(report.mileage || '').replace(/[^\d.]/g, ''));
  const expired = mileage >= 60000 || /^\d{4}-\d{2}-\d{2}$/.test(report.estimateDate || '') && report.estimateDate > '2027-09-19';
  return report.items.map((item, index) => {
    const text = `${item.title} ${item.source_text || ''}`.toLowerCase();
    const base = { index, title: item.title, amount: item.total, demo: sample, verified: false };
    if (item.status === 'warranty_completed') return { ...base, route: 'record', label: 'Warranty work recorded', reason: 'The service record identifies this as completed warranty work.', next: 'Keep the claim number and repair receipt in My page. This records a past claim, not future coverage.' };
    if (!sample) return { ...base, route: 'unknown', label: 'Coverage to check', reason: 'This document has not been matched to your warranty or insurance terms.', next: 'Add your plan in My page, then ask the provider to confirm this repair.' };
    if (/\b(tow|towing|rental|rented)\b/.test(text)) return { ...base, route: 'insurance', label: paid ? 'Reimbursement available' : 'Insurance benefit', reason: 'Carra Auto includes towing up to $100 and rental up to $40/day for 5 days for approved events.', next: 'Save your itemized receipt and proof of payment. Ask Carra Auto to confirm the event and submission deadline.' };
    if (/\b(collision|accident|vandalism|hail|windshield)\b/.test(text)) return { ...base, route: 'insurance', label: 'Insurance may apply', reason: 'Carra Auto includes comprehensive and collision benefits with a $500 deductible.', next: 'Send the incident details to your insurer for approval before arranging the repair.' };
    if (/\b(pads?|rotors?|tires?|tyres?|fluid|oil|filter|spark plugs?)\b|coolant.*(?:drain|refill)|(?:drain|refill).*coolant/.test(text) || /(?:12.?v|12.?volt|agm).*batter.*replac|replac.*(?:12.?v|12.?volt|agm).*batter/.test(text)) return { ...base, route: 'excluded', label: 'Wear & maintenance', reason: 'Carra Care excludes routine wear, maintenance, and 12-volt battery replacement.', next: 'Check any separate parts warranty on a previous repair receipt.' };
    if (/dc.?dc|charging|charge.?port|charge inlet|alternator|electrical|ignition coil|battery.*(?:test|diagnostic|isolation|thermal)|(?:test|diagnostic).*battery|high.voltage|drive.unit|regenerative/.test(text)) {
      if (expired) return { ...base, route: 'expired', label: 'Plan limit reached', reason: 'This document is beyond the Carra Care limit of 60,000 miles or September 19, 2027.', next: 'Ask the service center whether a separate manufacturer or replacement-parts warranty applies.' };
      return { ...base, route: 'warranty', label: item.status === 'pending_diagnosis' ? 'Warranty eligible' : 'Warranty covered', reason: 'Included in the Carra Care electrical protection plan. Diagnosis and repair authorization apply.', next: paid ? 'Request a reimbursement review with the itemized invoice, proof of payment, and diagnostic results.' : report.documentKind === 'service_record' ? 'Ask an authorized service center to review this visit and confirm the covered fault and claim reference.' : 'Contact an authorized service center before approving the work. Ask them to confirm the covered fault and any diagnostic charge.' };
    }
    return { ...base, route: 'unknown', label: 'Coverage to check', reason: 'This item needs a diagnosis and contract review before a coverage match can be made.', next: 'Ask the service center which plan provision applies to this work.' };
  });
}

