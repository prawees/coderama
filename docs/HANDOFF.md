# Handoff, 6 November 2026

## Decision 1 is settled: option (a)

The user had already asked for customizable cases, real EKG and investigation images, and hopping from the 2D
world into the 3D view, so this was built without merging the remaster engine. Everything below is additive.

- **Designer** at `/designer` (`components/designer/`, Porames' editor). Saves on the device first
  (`lib/customCases.ts`), and to Firestore `simulations` when signed in. Exports and imports `.coderama.json`.
  Any story case opens as a template. Required and intervention nodes gained "What the player sees": button text,
  teaching summary and wrong options. The designer's own labels are still English: authors only, not players.
- **Adapter** `lib/customCase.ts`: `normalizeForDesigner`, `toGameCase`, `checkCase`. `npm run validate` now also
  pushes all 51 story cases through the round trip (`scripts/check-custom.ts`). Timer nodes are dropped because the
  bedside has no running clock, so a designer timer does nothing in play yet.
- **Case library** at `/cases`, linked from the title menu: my cases, shared cases, and story cases to practise or
  copy. Practice runs (`?practice=1`, or any custom case) give no XP, cost no energy and never change the save.
- **Case screen.** PE is now tap-to-examine, one system at a time, in ABCDE order (`lib/examOrder.ts`). Designer
  history graphs appear as questions that unlock follow-ups. `imageUrl` on an investigation or exam finding shows
  the picture with tap to zoom: put the file in `public/` and write the path from the root, for example
  `"imageUrl": "/cases/case_12/ecg.png"` in the English case JSON, then rebuild the case.
- **3D bedside** (`components/exam3d/`), on by default with a `3D` toggle remembered per device. Tapping the patient
  or a region button examines those systems. It draws in the clinic's colours, its monitor follows the case's
  vitals, and if WebGL fails the case still plays without it. The CPR minigame does not jolt the 3D patient.

## Tested since

- **Full campaign, first time on this build.** `long.js 32` played days 1 to 31 plus day 32 after the finale in one
  sitting, about 38 minutes: 96 patients, all 51 cases seen, 45 of them as review patients, every summary and chapter
  card reached, no page errors, no stray tags or dashes in the text. That run predates the gift, CPR and D-pad changes
  below. Those were covered by the bots below rather than by another full run.
- **Board requests and birthdays in play.** `requests.js` taps people in the world and passes 37 checks: buying at the
  supply closet, gift, social and cat requests, exact payouts, birthday triple points, no tripling on a hated gift,
  Ann off the floor on day 5. `npm run validate` now also checks that all 30 requests and 13 birthdays can happen.
- **Custom cases.** `custom.js` passes: library, practice leaves the save alone, 3D view, designer, history, images,
  wrong and harmful branches.

## Fixed by testing

- The gift menu listed only the three kinds you held most of, so a request for a fourth kind could not be completed.
  It now lists every kind, the requested one on top, and scrolls.
- The D-pad's empty corners swallowed taps. They now reach the world. A sleeping cat can still sit under a D-pad key;
  walking next to it and pressing A works.
- The world's debug hook is removed when the world unmounts, so it no longer throws on other screens.

## Added

- The 3D patient moves with each CPR compression, and the CPR panel sits low so the patient and monitor stay in view.
- The designer warns that a timer node does nothing in play. Timers are still dropped: the bedside has no running clock.

**Still needs a person:** try the 3D view and the CPR screen on a real phone. All of this was headless at phone size,
with software WebGL. Nobody has heard the music or rain in these runs either.

From the cloud sessions to local Claude Code. Everything below is committed on `claude/eloquent-dirac-6pegy7`
and mirrored to `fix/playable-loop` (PR #1, prawees/coderama). The PR description is the long-form changelog.

## Where the game stands

Playable end to end for 31 days in ward Thai. Two continuous headless playthroughs (13 days, then 12 on the
final build) finished every day, both chapter cards and every summary with no page errors.
`npx tsc --noEmit`, `npm run validate` and `npm run build` pass.

## Done in the last session

- **Farm-game systems.** Daily notice-board request, a 51-page casebook with stars and key steps, rain on
  seven fixed days, birthdays with triple gift points. Details in `docs/NEXT.md` under "Farm-game pass".
- **Review cases.** 51 cases fill about 93 patient slots, so about 42 are repeats. A repeat is now someone new
  with the same condition, under their own name and tagged เคสทบทวน, chosen from every condition met so far,
  the one seen longest ago first. It never touches the first patient's letter.
- **Story fixes.** Night-shift days (11 to 15, 26, 31) start at 19:00. Ann is off the floor on day 5.
  case_07_vip was in no day's list and now comes on day 6.
- **Energy.** Costs lowered (wrong choice 2, unneeded test 1, patient 10, attending or consult 10).
- **Board request.** A clean case counts even when an above-rank step was done under supervision (found while
  moving the bots into the repo).
- **Clinical.** DKA potassium and resolution criteria now follow the 2024 ADA/EASD/JBDS/AACE/DTS consensus.
  Naloxone no longer reads as capped at 2 mg. Methylergometrine follows WHO dosing. Labetalol in eclampsia
  steps 20, 40, 80 mg (300 mg total). About fifteen other cases were spot-checked and left as is.

## Open decisions (need the user or the department)

1. **3D view and designer cases.** Settled, see the top of this file.
2. **DKA thresholds.** Case 9 uses the 2024 international numbers (K 3.5 and 5.0). If the department teaches
   the Thai CPG, change three lines in `scripts/thai/cases/case_09.txt` and rebuild that case.
3. **Tuning that is a first guess:** rain days, birthdays, request rewards, casebook milestones, review-name
   pools, gift prices and friendship rates.
4. **Human reads still needed:** a Thai clinician on the case text and the 775 order lines, a Thai reader on
   the new scenes, and someone listening to the music and the rain with sound on.
5. The rest of the list is under "Needs a human decision" in the PR description.

## Good next steps

- Only the four worried-well cases flag unneeded tests (`"indicated": false`). Flagging low-value tests in the
  acute cases would make the lab-stewardship teaching real. That is a teaching call for the department.
