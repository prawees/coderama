# Code Rama Remaster - Handoff

## Clinical engine (Body Interact style)

The case screen is a real-time virtual patient, not a multiple-choice tree.

- `lib/clinical/catalog.ts` holds the teaching vocabulary:
  - ABCDE primary survey items (A, B, C, D, E each separate; neuro lives under D) plus a secondary survey.
  - History headings (CC/PI, PMH, DH, allergies, FH, SH).
  - Investigation catalog with turnaround times.
  - Treatment catalog in 8 categories with dose options.
- `lib/clinical/model.ts` normalizes every case format into one runtime shape:
  - Porames designer / Firestore `simulations` cases.
  - Story graph cases (required, outcome, ethicalChoice nodes).
  - The early decision-tree cases (case_03 to case_06).
  - Legacy exam text is split per clause and routed to the correct ABCDE item.
  - History is generated from the background when a case has no history graph.
  - Authored actions are fuzzy-matched to catalog items, so the player chooses from full menus.
- `lib/clinical/engine.ts` is a pure reducer:
  - Physiology drifts toward peri-arrest while critical steps are missing.
  - Labs return after their turnaround time.
  - Wrong doses and contraindicated drugs are penalized. For example, aspirin in a case that says "no aspirin".
  - Every action is logged to a timeline.
- `lib/scorecard.ts` grades five OSCE axes:
  - ABCDE assessment
  - Triage efficiency
  - Diagnostic stewardship
  - Pharmacological precision
  - Communication and ethics
- A scripted ideal player completes all 51 story cases. See "Smoke test" below.

## Images (ECG, CXR, CT, POCUS, exam photos)

Every imaging, ECG and visual result has an image slot. The game shows the image if it exists, otherwise a labelled placeholder with the expected path.

- **Story cases:** drop a file at `public/cases/<caseId>/<investigationId>.png`.
  - Example: `public/cases/case_12/hct1.png`.
  - Generic ECG or X-ray results without a case entry use the test name, e.g. `public/cases/case_12/12_lead_ecg.png`.
- **Designer cases:** use Upload, or type a path or URL in "Image URL or path".
  - Signed-in authors upload through Porames's `imageUpload` cloud function.
  - Offline authors get a downscaled embedded copy.
- Exam findings also accept `mediaUrl` for clinical photos.

## Case designer ("mod engine")

- `/cases` is the case library: story cases, my cases, and shared cases.
  - Any story case can be copied into the designer as a template.
- `/designer` hosts Porames's designer (`components/designer/`).
  - Saves locally first, and publishes to Firestore `simulations` when signed in.
  - Exports and imports `.coderama.json` files for sharing.
  - Playtest opens the case in the 3D suite.
  - The exam step now lists ABCDE items.
  - The treatment lists are the game's own catalog, so authored steps match what players can choose.
  - Communication nodes (ethical choices) can be added.

## Smoke test

A scripted ideal player runs every story case through the engine. Last result: 51 of 51 won.
The test script lives outside the repo. To reproduce it:
- Copy `lib/clinical/*.ts` to a scratch folder.
- Rewrite relative imports to include `.ts`.
- Run with `node --experimental-strip-types`.

## Still open

- `next build` (static export) has not been run. It was typechecked and exercised in the dev server only.
- `app/profile/page.tsx` and onboarding still write hex colours. Swap them for ramp pickers from `lib/palettes.ts`.
- Shop, summary, settings and `DialogueBox` still contain hardcoded English.
- Rank-gated options from the old decision tree are ignored in the clinical engine. All clinical actions are open to every rank.
- `_legacy_v1/` can be deleted.
