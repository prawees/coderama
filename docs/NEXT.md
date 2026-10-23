# Where the ward-Thai pass stands

Done: one language (Thai, English medical terms), Itim font, no language picker, story days 1 to 10,
all 51 cases, patients, hub, case screen, creator, settings, summary, chapter pages, day card.

Left, in this order:
1. Cases are done. If an English case changes, `python3 scripts/thai/cases.py check` lists stale keys.
   Fix the matching `scripts/thai/cases/case_NN.txt`, then `python3 scripts/thai/cases.py build all`,
   `python3 scripts/thai/gen_case_index.py`, `npm run validate`.
2. Story days 11 to 31: `scripts/thai/story/dayNN.txt`, then `python3 scripts/thai/story_patch.py`.
3. Remaining screens: shop (gear and upgrade names), profile, skills, leaderboard, quests, friends,
   consults, minigame (drop the middle dot), useWorldSocial lines, lib/npcs.ts Thai lines, lib/quests.ts.
4. Letters: mailbox prop art is in lib/pixel/tiles.ts (postbox, mail emote). Still to wire: ER map prop at (9,9),
   envelope bubble, letters modal, scrapbook tab.
5. Update playtest bots for Thai labels, rebuild, playtest, push, update PR #1.

Voice rules: docs/WRITING.md.
