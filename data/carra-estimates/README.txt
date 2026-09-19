Carra Hackathon Estimate Dataset
=================================

Purpose
-------
A synthetic evaluation/demo dataset for the Carra hackathon MVP:
1. Understand My Estimate
2. Questions to Ask

Contents
--------
samples/                         24 synthetic PDF estimate/invoice/repair-order files
carra_estimate_output.schema.json Strict JSON Schema for model output
carra_system_prompt.txt          System prompt / guardrails
carra_user_prompt_template.txt   Per-document prompt template
carra_two_stage_recommendation.txt Recommended parser + explainer architecture
ground_truth.jsonl               Expected extraction facts for all 24 samples
sample_manifest.csv              Dataset index
source_manifest.txt              Public reference sources used to design field/layout diversity

Recommended build sequence
--------------------------
A. Start with samples 01, 03, 08, 10, 17, 20.
B. Validate that extraction JSON matches ground_truth.jsonl.
C. Add driver_view generation.
D. Test hard samples 21-24.
E. For live demo, use 01 or 18 first; keep 23 as an OCR stress test, not the main demo.

MVP Success Criteria
--------------------
- Correct document type.
- Vehicle, mileage, line items and total extracted without invention.
- Approved/declined/recommended/performed status preserved.
- Plain-language explanation is grounded in document facts.
- 2-6 useful, non-accusatory questions are generated.
- No diagnosis, price-fairness verdict, or mechanic override.
