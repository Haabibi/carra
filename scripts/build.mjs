import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await build({ entryPoints: ['lib/core.js'], bundle: true, format: 'iife', globalName: 'CarraCore', outfile: 'core.bundle.js' });
await mkdir('vendor', { recursive: true });
for (const name of ['pdf.mjs', 'pdf.worker.mjs']) await copyFile(`node_modules/pdfjs-dist/build/${name}`, `vendor/${name}`);
