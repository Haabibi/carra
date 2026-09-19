import { readFileSync } from 'node:fs';
import { samples, createDraft, buildReport, answerFromReport, forbiddenCopy } from '../lib/core.js';
const errors = [];
const check = (value, path) => { if (forbiddenCopy.test(value)) errors.push(`${path}: ${value}`); };
for (const sample of samples) {
  const report = buildReport(createDraft(sample.sampleId));
  const strings = [report.atAGlance.headline, report.atAGlance.estimateRequest, report.atAGlance.simpleNextStep, ...report.atAGlance.keyPoints.map(k => k.text), ...report.items.flatMap(i => [i.plain, i.why]), ...report.questions.flatMap(q => [q.q, q.reason]), ...report.suggestedAsks.flatMap(q => answerFromReport(report, q).map(s => s[0]))];
  strings.forEach(value => check(value, sample.sampleId));
}
for (const file of ['index.html', 'app.js', 'workflow.js', 'landing.js', 'documents-ui.js', 'coverage-ui.js', 'lib/coverage.js', 'lib/item-insights.js', 'item-insights-ui.js', 'my-page.js']) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    // Scope-detection regex is not displayed copy. Original source quotes are
    // independently validated and intentionally excluded from editorial rules.
    if (!line.includes('return /')) check(line, `${file}:${i + 1}`);
  });
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Copy checks passed: interface and generated report copy.');
