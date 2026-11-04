# Handoff, 25 October 2026

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

1. **3D view and designer cases.** The three.js scene and Porames' case designer (Firestore `simulations`)
   are in `_legacy_v1/`, excluded from the build. The game plays only the 51 static cases. Options put to the
   user, no answer yet:
   - (a) Port the designer page, the adapter (`lib/clinical/model.ts`, `lib/clinical/customCases.ts` on
     `remaster/clinical-engine`) and a runtime Firestore loader into this game, with `ExamSuite3D` as an
     optional exam view. Recommended if the department will write its own cases.
   - (b) Merge the remaster engine instead (heavy conflicts).
   - (c) Leave both out and remove the unused three.js packages and STL assets.
2. **DKA thresholds.** Case 9 uses the 2024 international numbers (K 3.5 and 5.0). If the department teaches
   the Thai CPG, change three lines in `scripts/thai/cases/case_09.txt` and rebuild that case.
3. **Tuning that is a first guess:** rain days, birthdays, request rewards, casebook milestones, review-name
   pools, gift prices and friendship rates.
4. **Human reads still needed:** a Thai clinician on the case text and the 775 order lines, a Thai reader on
   the new scenes, and someone listening to the music and the rain with sound on.
5. The rest of the list is under "Needs a human decision" in the PR description.

## Good next steps

- Whatever the user picks for decision 1.
- Have a bot actually do the board requests (walk to an NPC and give a gift) and check birthdays in play. The bot
  now only reads the request and plays cases. Tapping an NPC needs world coordinates from `ClinicWorld`.
- Days 14 to 31 have not been played continuously since these changes. Run `scripts/playtest/long.js 31`.
- Only the four worried-well cases flag unneeded tests (`"indicated": false`). Flagging low-value tests in the
  acute cases would make the lab-stewardship teaching real. That is a teaching call for the department.
