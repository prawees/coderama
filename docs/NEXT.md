# Where the ward-Thai pass stands

Done: one language (Thai, English medical terms), Itim font, no language picker, all 31 story days,
all 51 cases, patients, hub, case screen, creator, settings, summary, chapter pages, day card.

Status, in the order it was done:
1. Cases are done. If an English case changes, `python3 scripts/thai/cases.py check` lists stale keys.
   Fix the matching `scripts/thai/cases/case_NN.txt`, then `python3 scripts/thai/cases.py build all`,
   `python3 scripts/thai/gen_case_index.py`, `npm run validate`.
2. Story days are done. Edits go in `scripts/thai/story/dayNN.txt`, then `python3 scripts/thai/story_patch.py`.
3. Screens are done: shop, skills, both leaderboards, quest rewards, minigame, useWorldSocial pearls.
   Profile, friends, consults and lib/npcs.ts were already Thai and are unchanged.
4. Letters are done: postbox at (9,9) on the ER map, envelope bubble while a letter is unread,
   components/game/LettersModal.tsx with a letters tab and a scrapbook tab. A letter arrives the morning
   after a good outcome (lib/letters.ts); reading one adds any gift the patient sent.
5. PR #1 is updated and carries all of the above. The playtest bots are not in the repo; the last check was
   a manual headless pass (shop, skills, leaderboard, case 12, postbox and letters).

Still open: a Thai clinician's read of the case text, and whether senior women should say หนู (lib/voice.ts).

Voice rules: docs/WRITING.md.
