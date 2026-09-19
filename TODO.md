# Carra implementation TODO

## Shared home-page design

- [x] Carry home typography, off-white surfaces, blue actions, soft cards, and teal/lime accents into all app pages
- [x] Add companion artwork to intake/review/progress headers and active navigation states
- [x] Restyle report items, document viewers, My page, and profile onboarding
- [x] Preserve mobile report density and respect reduced-motion preferences

## Document-specific report analysis

- [x] Review all 60 supplied examples and author distinct scope/headline/next-question narratives
- [x] Prioritize approval changes, declined work, provisional replacements, deposits, limits, outcomes, and cost drivers
- [x] Attach evidence from reviewed amounts/statuses and original dataset notes; remove generic public-record filler from the short summary
- [x] Distinguish service record, invoice, and estimate labels
- [x] Recompute facts and drop curated conclusions when source work, status, concern, or totals change
- [x] Verify all 60 rendered summaries, valid citations, missing amounts, and stale-payment protection
- [x] Add expandable mobile visit details and tailored next question

## Compact protection and My page

- [x] Replace the large protection section with per-item coverage badges and expandable plan details
- [x] Prefill a fictional Carra Care / Carra Auto pitch profile without repeated demo-coverage labels
- [x] Keep unknown uploads separate from sample coverage matches and honor profile plan opt-outs
- [x] Add My page with vehicle, insurance, warranty, and a combined document library
- [x] Add two-step profile onboarding, local persistence, and missing-plan states
- [x] Link saved analyses and supplied PDF estimates/service records/receipt in the library
- [x] Add local PDF/photo uploads, search/type filters, preview, and removal
- [x] Verify desktop/mobile navigation, PDF and image previews, profile editing, and refresh persistence
- [ ] Connect actual insurers, warranty contracts, provider decisions, and account-backed document sync

The sections below retain earlier milestones; the large coverage panel has been superseded by the compact indicators and My page.

## Warranty and insurance product demo

- [x] Add protection checks after the report summary and a home feature preview
- [x] Separate fictional warranty terms from fictional auto-insurance benefits
- [x] Show item-level potential matches, demo exclusions, historical warranty status, and unknown coverage
- [x] Keep personal uploads unverified by default; require an explicit demo selection
- [x] Adapt next steps for paid repairs, reimbursement inquiries, and authorized-center warranty checks
- [x] Add copyable questions, towing/rental benefit explanations, and a session-persistent document checklist
- [x] Test demo rules, missing-policy behavior, payment state, mobile layouts, and keyboard focus
- [ ] Ingest actual policies and warranty documents, verify VIN/term/mileage eligibility, and connect provider claims

> Track implementation against the Carra UI PRD. Complete P0 before starting P1.

## September 19 implementation milestone — local workflow

### Home landing page

- [x] Broader everyday car companion positioning, beyond estimate analysis
- [x] Character-led hero using the existing Carra asset
- [x] Interactive repair, garage, and everyday-question previews with keyboard-accessible tabs
- [x] Direct sample CTA, how-it-works section, expandable FAQs, and return-user history
- [x] Hide the local-preview banner on home; restore it inside the estimate workflow
- [x] Verify 390px/1440px layouts, navigation, tab keyboard controls, FAQs, and sample entry
- [x] Label upcoming garage and general-chat features within their previews
- [x] Supplied `waiting.mp4` greeting in the landing hero, with pause/replay, viewport/tab pausing, static reduced-motion fallback, and video-error fallback
- [x] Subtle feature-preview entrance transition, disabled for reduced motion

This increment keeps the existing light/static UI. It does not claim full PRD completion. The initial milestone preceded the dataset and document API; see the document milestone below. The detailed checklist below remains the target architecture; the implemented static equivalents are recorded here.

- [x] Home with saved draft/report history and empty state
- [x] A1 synthetic sample selection for EV6, CR-V, and A4 (explicitly not dataset ground truth)
- [x] Local reference photos: five-image limit, camera, drop, preview, remove, reorder, IndexedDB persistence
- [x] Manual-entry fallback that does not pretend to parse uploaded documents
- [x] A2 editable metadata, source lines, approval status, costs, and item add/remove
- [x] Integer-cent total reconciliation and line-breakdown mismatch warnings
- [x] Valid draft autosave and hash-route restoration after refresh
- [x] A3 six-step local workflow with honest skipped external checks and saved operation trace
- [x] A4 generated from the reviewed data, including edited values and quotes
- [x] Remove placeholder government claims, fabricated lookup counts, and fake agent tool logs
- [x] Zod draft/quote/finding/trace contracts, source substring checks, unverified-finding guard
- [x] `npm run check`: bundle, syntax, integrity tests, copy checks
- [x] Local reference Ask responses, clear scope fallback, and ten-question session limit
- [x] Fix false clipboard-success feedback and primary-button hover contrast
- [x] Print report styling
- [x] Browser verification: all three sample flows, edit/refresh persistence, quotes, saved trace, photo persistence, and keyboard focus
- [x] 390×844 first-screen summary (840px bottom) and 1440px desktop screenshots
- [ ] Finish native PDF input, actual OCR, and original-image bounding boxes
- [ ] Replace temporary UI draft contract with the supplied canonical dataset schema
- [ ] Connect real NHTSA/manufacturer records and validate captured public quotes
- [ ] Connect server APIs/SSE and Claude Agent SDK sandbox; record genuine replay fixtures
- [ ] Migrate to Next.js/strict TypeScript and complete P1 onboarding

See `README.md` for run commands, current boundaries, and validation details.

## Current UI prototype milestone

- [x] Establish the light report shell with Barlow typography and responsive layout
- [x] Add the EV6 report header, estimate total, and vehicle metadata
- [x] Add the three-point “At a glance” summary with provenance labels
- [x] Add divider-based estimate rows with status chips and expandable details
- [x] Add source quote controls and estimate-line highlighting
- [x] Add the estimate document viewer with page and zoom controls
- [x] Add the three-question checklist and copy interaction
- [x] Add the “How we checked” summary and technical-trace entry point
- [x] Add the permanent report disclaimer
- [x] Verify the prototype JavaScript syntax and browser accessibility tree
- [ ] Replace the static prototype with the Next.js route and typed report data
- [ ] Validate the prototype at 390px and 1440px with screenshots

## 0. Project foundation

- [ ] Create the Next.js App Router project with TypeScript strict mode
- [ ] Configure Tailwind CSS
- [ ] Add Barlow and Barlow Semi Condensed fonts
- [ ] Define the Carra color, typography, spacing, and radius tokens
- [ ] Add the light application shell and responsive page layout
- [ ] Add query flags: `demo`, `present`, and `trace`
- [ ] Add base accessibility styles, focus rings, and reduced-motion support
- [ ] Add `npm run check` for typecheck, lint, tests, and copy validation

## 1. Schemas and shared contracts

- [ ] Add the canonical `CarraEstimate` schema from the dataset JSON Schema
- [ ] Add Zod schemas for `Source`, `Quote`, `Finding`, and `CarraReport`
- [ ] Add schemas for `AnalysisEvent` and `TraceEvent`
- [ ] Add shared types for `EstimateLayout` and normalized bounding boxes
- [ ] Add item status-to-copy mapping
- [ ] Add provenance labels and finding-kind metadata
- [ ] Add currency, mileage, date, and relative-time formatters
- [ ] Add quote substring verification
- [ ] Add the forbidden-copy list and `scripts/lint-copy.ts`
- [ ] Add schema and guardrail tests

## 2. Mock data and fixtures

- [ ] Add the `ev6-12v` estimate fixture
- [ ] Add the `crv-brake` estimate fixture
- [ ] Add the `a4-idle` estimate fixture
- [ ] Add report fixtures with sources, quotes, findings, questions, and checks
- [ ] Add estimate layout fixtures and document page placeholders
- [ ] Add mock analysis event streams with `delayMs`
- [ ] Add mock report and analysis API adapters
- [ ] Validate every fixture with Zod
- [ ] Test that every quote matches its source text
- [ ] Test that unverified findings are excluded
- [ ] Run the forbidden-copy check against all fixture text

## 3. A4 report: report shell and at-a-glance

- [ ] Create the report route `/analyze/[id]`
- [ ] Build the responsive desktop and mobile report layout
- [ ] Build the report header with vehicle and estimate metadata
- [ ] Build `AtAGlance`
- [ ] Render a headline, total line, and no more than three key points
- [ ] Build `FindingMark` with distinct shapes and accessible labels
- [ ] Build `ProvenanceLabel`
- [ ] Build `QuoteChip` with collapsed default state
- [ ] Build `QuoteCard` with source tier, locator, date, and links
- [ ] Support quote expansion without navigating away from context
- [ ] Add the permanent report disclaimer
- [ ] Verify the 390px first viewport information budget

## 4. A4 report: estimate items and details

- [ ] Build `ItemRow` as a divider-based list row, not a card grid
- [ ] Show item title, amount, status, plain-language summary, and finding count
- [ ] Build `StatusChip` and its explanatory popover
- [ ] Build `ItemSheet` or desktop inline item details
- [ ] Add the estimate source quote and cost breakdown
- [ ] Add the `What this is` general information section
- [ ] Add related public-record findings and quote cards
- [ ] Add uncertainty notes without judgmental language
- [ ] Add previous-item and next-item navigation
- [ ] Restore focus after closing item details
- [ ] Add keyboard and Escape-key interaction

## 5. A4 report: estimate viewer and questions

- [ ] Build `EstimateViewer` with page support and brightness treatment
- [ ] Render finding marks beside related estimate lines
- [ ] Connect item rows to estimate line highlighting
- [ ] Connect estimate quotes to line highlighting
- [ ] Add zoom controls and page thumbnails
- [ ] Build `QuestionsList`
- [ ] Show three questions by default and support “Show all questions”
- [ ] Add local question checkboxes
- [ ] Implement “Copy questions” and the `Questions copied` toast
- [ ] Add `HowWeChecked` with checks, sources, and verification counts
- [ ] Add the saved technical trace entry point

## 6. A3 analysis progress and TracePanel

- [ ] Create the progress route `/analyze/[id]/progress`
- [ ] Build the six-step analysis status list
- [ ] Support running, done, failed, and skipped states
- [ ] Enforce the minimum running display time
- [ ] Build the estimate `ScanOverlay`
- [ ] Add the single scan beam and item outline sequence
- [ ] Remove scan effects when the report is ready
- [ ] Add reduced-motion final-state behavior
- [ ] Build `TracePanel`
- [ ] Group steps into Parse, Research, Explain, and Verify nodes
- [ ] Render safe trace fields only
- [ ] Add trace auto-scroll and “Jump to latest”
- [ ] Add expandable tool-result summaries
- [ ] Add trace totals for duration, tools, sources, and verified quotes
- [ ] Add `?trace=1` initial-open behavior
- [ ] Add SSE reconnect with exponential backoff
- [ ] Add failed-step retry and connection-lost states
- [ ] Navigate to the report after `report_ready`

## 7. A1 input and A2 estimate review

- [ ] Create `/analyze/new`
- [ ] Add image, PDF, camera, drag-and-drop, and multi-page upload handling
- [ ] Limit uploads to five pages
- [ ] Add thumbnails, removal, and page reordering
- [ ] Add the optional shop-concern field
- [ ] Add the sample estimate selector
- [ ] Add the “Read estimate” action
- [ ] Create `/analyze/[id]/review`
- [ ] Render parsed document metadata and vehicle details
- [ ] Render parser confidence and review reasons
- [ ] Add editable estimate item details
- [ ] Add confidence warnings for low-confidence items
- [ ] Add estimate-image focus synchronization
- [ ] Compare item totals, fees, tax, and grand total
- [ ] Show the mismatch warning when the difference is at least $1
- [ ] Add “Looks right, explain it” and “Retake photos” actions
- [ ] Persist review changes through the estimate update adapter

## 8. Mock end-to-end flow

- [ ] Connect A1 to the mock parse response
- [ ] Connect A2 confirmation to mock analysis creation
- [ ] Connect A3 to mock SSE events
- [ ] Connect A3 completion to A4 report loading
- [ ] Restore A2, A3, and A4 after refresh using route state
- [ ] Verify the full `?demo=1` flow for all three sample estimates
- [ ] Verify Shift+D mock-mode switching without breaking the current screen

## 9. Live public-record research

- [ ] Implement NHTSA recalls lookup
- [ ] Implement NHTSA complaints lookup
- [ ] Normalize make and model values for NHTSA
- [ ] Add component-to-estimate mapping
- [ ] Match records to estimate items using component and summary evidence
- [ ] Capture real NHTSA responses into record fixtures
- [ ] Generate quotes only from response substrings
- [ ] Handle `RECORDS_UNAVAILABLE` without claiming that records are absent
- [ ] Add manufacturer-source handling only when original text is available
- [ ] Add owner-report count, representative quote, and required caveat

## 10. Live parsing, explanation, and verification

- [ ] Implement document upload storage for the development environment
- [ ] Implement Stage A estimate parsing
- [ ] Compare parser output with dataset ground truth
- [ ] Add `scripts/eval-parser.ts`
- [ ] Implement Stage B plain-language explanations
- [ ] Enforce provenance on every rendered sentence block
- [ ] Remove unsupported or unverified findings
- [ ] Add quote verification to the live pipeline
- [ ] Add live trace events with whitelisted fields
- [ ] Record representative live analysis events as fixtures
- [ ] Verify the live path stays within the target response time

## 11. Ask about this report

- [x] Build the `AskPanel` UI
- [x] Add three report-specific suggested questions
- [x] Add the 500-character input and Enter/Shift+Enter behavior
- [x] Build the compact Ask trace view
- [x] Add the Carra agent avatar and chat-style message bubbles
- [x] Add the Carra character image to the report's top read section
- [x] Add the `thinking_suggesting.mp4` animation to the chatbot header
- [x] Use the Carra character image in circular chatbot reply avatars
- [x] Connect Ask to a server-side Gemini API route with a local fallback
- [x] Connect Gemini to PDF and image estimate parsing
- [x] Show user questions, trace steps, and Carra answers as a clear conversation
- [x] Group Carra, suggested questions, thread, and composer in one chat panel
- [x] Rewrite top findings in plain language for non-technical drivers
- [x] Explain estimate items by what each part or test does
- [x] Remove repeated source labels from quote cards and item details
- [ ] Build the answer schema and validation pipeline
- [ ] Add the replay adapter and recorded Ask fixtures
- [ ] Add sentence-level provenance and quote chips
- [ ] Add verified-answer-only rendering
- [ ] Add out-of-scope response handling
- [ ] Add the ten-question report limit
- [ ] Add timeout, retry, and failure states
- [ ] Build the report-isolated Ask sandbox
- [ ] Restrict tools to Read, Grep, and Glob
- [ ] Add the Agent SDK adapter
- [ ] Add injection and sandbox-boundary tests
- [ ] Ensure production builds exclude the local Claude Code path
- [ ] Make Shift+D switch Ask to replay mode

## 12. P1 onboarding

- [ ] Build insurance-card capture screen
- [ ] Build VIN manual-entry fallback
- [ ] Build insurance-card extraction confirmation
- [ ] Build VIN verification and correction display
- [ ] Build odometer capture and manual-entry fallback
- [ ] Build vehicle profile completion screen
- [ ] Add warranty display and remaining-term meters
- [ ] Add VIN-dependent recall display
- [ ] Add “Analyze an estimate” and “Go to home” actions

## 13. P1 home

- [ ] Build the current vehicle summary
- [ ] Show mileage, powertrain, warranties, and recalls
- [ ] Build the previous analyses list
- [ ] Link previous analyses to their reports
- [ ] Add the empty state
- [ ] Add the “Analyze an estimate” action

## 14. Final quality pass

- [ ] Run the full copy lint with zero forbidden terms
- [ ] Run quote-source integrity tests
- [ ] Run the full typecheck, lint, and test suite
- [ ] Test keyboard navigation and visible focus states
- [ ] Test WCAG AA contrast for the light theme
- [ ] Test 390px mobile layout
- [ ] Test 1440px desktop layout
- [ ] Test `prefers-reduced-motion`
- [ ] Test `?present=1`
- [ ] Confirm no report text, amount, or quote uses glow
- [ ] Confirm `--holo` is not used for meaning, links, buttons, or statuses
- [ ] Confirm no emoji, sparkle icons, purple gradients, or SF wording
- [ ] Confirm trace output contains no prompt, reasoning, API key, or full VIN
- [ ] Review the three demo stories from upload through report


## Original document milestone

- [x] Import original PDFs, ground truth, and schemas from both supplied datasets (60 documents)
- [x] Render original PDFs with page navigation, zoom, and accessible extracted text
- [x] Upload one PDF (up to five pages) or up to five photos; preview, remove, and reorder
- [x] Read new files through the server-side Gemini document API, validated against the dataset schemas
- [x] Preserve completed-work statuses, missing amounts, and extraction review reasons
- [x] Match exact supplied PDF bytes to reference data without claiming AI extraction
- [x] Review and edit extracted details beside the original; retain files across refresh
- [x] Verify 14 automated tests and desktop/mobile browser workflows
- [x] Live Gemini smoke test with the configured key: service record 29 returned HTTP 200 in 22 seconds; document kind, item count, line totals, statuses, and $600.36 total matched reference data (`node scripts/test-live-document.mjs`)
- [ ] Evaluate extraction accuracy across representative PDFs and photos beyond the single live smoke test
- [ ] Add original-image bounding boxes and independently verified OCR quotations


## Item clarity and price references

- [x] Remove repeated expanded-item title, amount, and status on desktop
- [x] Explain proposed versus customer-approved work in plain English
- [x] Add original brake/battery diagrams and useful explanations by service type
- [x] Add a price-range bar using dated RepairPal reference snapshots and source links
- [x] Show model-specific brake-pad references for Volvo XC60 and Honda CR-V; label unmatched year/location/axle
- [x] Preserve original wording and costs in a disclosure; remove empty public-record sections
- [x] Test price boundaries, unknown prices, bundled services, and desktop/mobile source access
- [ ] Connect live local pricing with exact year, ZIP, axle, parts, and repair scope


## Demo reference photography

- [x] Download reusable Commons photographs for pads, rotors, fluid reservoir, battery, plugs, ignition, and diagnostics
- [x] Use a clearly labeled related 12V battery photograph for the charging-system category
- [x] Serve local images with alt text, enlargement links, visible reference labels, expandable attribution, and load-error fallback
- [x] Keep original source, author, license, retrieval date, and download metadata in design/parts/credits.json
