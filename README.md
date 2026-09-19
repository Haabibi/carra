# Carra

An English-language car companion with an interactive landing page and a document workflow: original PDF or photos → extracted details → editable review → report. Garage reminders and general car chat remain upcoming features.

## Run

```sh
npm install
npm run build
npm run dev
```

Open `http://localhost:3000/#/` for home or `http://localhost:3000/#/analyze/new` for documents. For port 3011 in PowerShell, run `$env:PORT='3011'; npm run dev`. Use the Node server; document APIs need it.

Copy `.env.example` to `.env` if it does not exist, set `GEMINI_API_KEY` locally, and restart the server to enable new-document reading and Ask. Never commit the key. Samples and manual entry work without a key. New uploads are sent to Gemini when you choose **Read document**.

## Documents

- The sample picker includes 30 estimates and 30 service records. Original PDFs, schemas, and reference answers are preserved in `data/`. These are fictional training documents.
- PDF.js renders original documents with page navigation, zoom, and accessible text. Review and report screens retain access to the original.
- Upload one PDF up to 10 MB and five pages, or up to five JPEG/PNG/WebP images at 5 MB each, with a 15 MB total limit. Photos can be reordered and removed.
- Exact dataset PDF uploads load known reference answers, labeled as dataset data. Other PDFs and images use the server-side Gemini API. Filename matching never substitutes sample results.
- Returned JSON must pass the dataset JSON Schema and draft Zod schema. Missing amounts stay unknown, completed work keeps its status, and uncertain readings are flagged for review.
- Drivers can edit vehicle details, dates, work, statuses, parts/labor/other costs, and totals. Reconciliation uses integer cents and a $1 mismatch threshold.
- Drafts and reports use local browser storage; uploaded files use IndexedDB. Links do not transfer data to another browser. Quotes are checked against reviewed text, not independently verified against original pixels.

## Verification

All 60 sample reports have document-specific summaries, work scope, and follow-up questions. Takeaways prioritize conditional work, approval changes, deposits, authorization limits, recorded outcomes, and cost drivers, with expandable evidence. Editing source details drops the curated narrative and recomputes the summary from reviewed values. On mobile, **Visit details & next step** expands the supporting context. Run `node scripts/test-summary-browser.mjs` to check every sample.

```sh
npm run check
node scripts/test-documents.mjs
node scripts/test-browser.mjs
node scripts/test-motion.mjs
```

Browser tests use headless Microsoft Edge and port 3011; the general browser suite also accepts `CARRA_TEST_URL`. Screenshots go to ignored `artifacts/`. Tests cover all 60 reference mappings, PDF uploads, schema rejection, mocked model requests/responses, nullable fields, review/report persistence, mobile layouts, and error/manual-entry flows. Mock tests do not establish live model accuracy.

The landing greeting uses `design/carra-character/waiting.mp4`, with pause/replay, offscreen pausing, and reduced-motion fallback.

## Warranty and insurance demo

Reports show compact protection badges beside each repair item. Plan details and next steps expand inside that item; the large coverage panel is removed. The fictional Carra Care / Carra Auto pitch profile drives sample badges, while personal uploads remain unverified. Routine wear, pending diagnosis, and plan limits are distinguished.

Open `/#/my` for My page: vehicle, insurance, warranty, and a searchable library combining saved analyses, sample PDFs, and locally added receipts or policy files. `/#/onboarding` edits the profile in two steps. Profile fields persist in localStorage; added PDF/photo files persist in IndexedDB. Plan opt-outs update report badges. The small profile footer identifies the illustrative hackathon data without repeated demo labels on repairs. Run `node scripts/test-my-page.mjs` and `node scripts/test-coverage-browser.mjs` for interaction and mobile checks.

General guidance links to the [FTC warranty guide](https://consumer.ftc.gov/articles/auto-warranties-and-auto-service-contracts) and [NAIC insurance guide](https://content.naic.org/article/what-you-should-know-about-auto-insurance-coverage). Actual policy ingestion, VIN eligibility, claim submission, and provider decisions remain future integrations.

## Remaining work

Live extraction accuracy evaluation, original-image bounding boxes, verified public-record/NHTSA queries, stricter Ask provenance, PRD replay/SSE/agent architecture, verified VIN/insurance-card onboarding, garage reminders, and hosted sharing remain pending. See `TODO.md` for the broader PRD checklist.
