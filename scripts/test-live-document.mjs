// Explicit live check: sends one fictional dataset PDF to the configured Gemini API.
// Never prints credentials or raw provider responses.
import { readFile } from 'node:fs/promises';
import { getSample, parseUpload } from '../lib/documents.js';

const env = {};
for (const line of (await readFile(new URL('../.env', import.meta.url), 'utf8')).split(/\r?\n/)) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const entry = getSample('service_record-29');
// A harmless trailing PDF comment avoids the exact-byte dataset shortcut.
const data = Buffer.concat([entry.bytes, Buffer.from('\n% Live document extraction test\n')]).toString('base64');
let providerStatus;
const started = Date.now();
try {
  const result = await parseUpload({ files: [{ name: entry.file, type: 'application/pdf', data }] }, {
    apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || process.env.GEMINI_MODEL,
    fetchImpl: async (...args) => {
      const response = await fetch(...args);
      providerStatus = response.status;
      return response;
    },
  });
  const expected = entry.expected.work_performed;
  const checks = {
    provider: result.provider === 'gemini',
    kind: result.draft.documentKind === entry.kind,
    total: result.draft.total === entry.expected.totals.total,
    itemCount: result.draft.items.length === expected.length,
    itemTotals: result.draft.items.every((item, i) => item.total === expected[i]?.line_total),
    statuses: result.draft.items.every((item, i) => item.status === expected[i]?.status),
  };
  console.log(JSON.stringify({ providerStatus, elapsedSeconds: Math.round((Date.now() - started) / 1000), provider: result.provider, total: result.draft.total, checks }, null, 2));
  if (Object.values(checks).some(value => !value)) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify({ providerStatus, elapsedSeconds: Math.round((Date.now() - started) / 1000), code: error.code || 'NETWORK_ERROR', error: error.code ? error.message : 'Live request could not complete.' }, null, 2));
  process.exitCode = 1;
}
