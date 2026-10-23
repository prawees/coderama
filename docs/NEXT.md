# Where the game stands

Done: one language (Thai, English medical terms), Itim font, no language picker, all 31 story days,
all 51 cases, patients, hub, case screen, creator, settings, summary, chapter pages, day card, letters.

## Ward-Thai pass
1. Cases are done. If an English case changes, `python3 scripts/thai/cases.py check` lists stale keys.
   Fix the matching `scripts/thai/cases/case_NN.txt`, then `python3 scripts/thai/cases.py build all`,
   `python3 scripts/thai/gen_case_index.py`, `npm run validate`.
   Keys per node: `.l` label, `.c` button text, `.n` narrative, `.dN`/`.fN` wrong option and why,
   `.aN` order line, `.mN` dose note for that order. `iv.<id>` optionally gives a Thai result value;
   without it the value stays in ward English. Test names become ward shorthand in `thai_name()`.
2. Story days are done. Edits go in `scripts/thai/story/dayNN.txt`, then `python3 scripts/thai/story_patch.py`.
3. Screens, letters and the postbox are done. Female players say หนู at every rank (lib/voice.ts).

## Player-experience pass (after the pitch audit)
- Labs: the player orders each test. Results show the value, unit, H/L flag and normal range.
  `"indicated": false` on an investigation makes ordering it a slip with its reason.
  `"onFile": true` shows a result from the start (old reports the patient brings).
- Histories no longer state the diagnosis or the teaching point. Pearls stay in the debrief.
- Every option list is shuffled, including the older branching cases (03 to 06).
- Debrief at the end of each case: key steps, each slip with its reason (and the right move when a slip
  ends the case), and how to read the abnormal results. Unneeded tests count as slips but do not worsen
  vitals, and a patient with all-normal baseline vitals never deteriorates from a slip.
- Older branching cases mark wrong turns with `"slip": true`. Counterfactual endings use
  `outcomeType: "worsened"` and grade as a bad outcome.
- CPR minigame scores compression rate (100 to 120/min) and explains a fast or slow rhythm.
- Shift: an empty ER fills within seconds. No patient repeats within a shift (lib/schedule.ts).
  Cases 07 and 09 are scheduled. Clock-out needs two patients, and a second tap if anyone is waiting.
  Summary lists each patient, diagnosis and grade. Dialogue has a skip button.
- The old teacher portal (/dashboard, /classes) is removed.

Checks: `npx tsc --noEmit`, `npm run validate`, `npm run build`. The playtest bots are not in the repo.
The last headless pass covered: title to first patient (17 taps, first patient at about 1 s), cases 01,
02, 03 (CPR fast and correct), 04, 05, 07, 23, 27, 43, the end-shift gate and the summary.

Still open: a Thai clinician's read of the case text and the new order lines (`.aN`).

Voice rules: docs/WRITING.md.
