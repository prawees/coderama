# Code Rama

A cozy pixel-art ER game for Thai medical students (Next.js 14 static export, Pixi 8, Zustand, Capacitor iOS).
The player walks a clinic, treats 51 emergency cases, and follows a 31-day story across four hospitals.
Everything a player reads is Thai as spoken on a Thai ward (English drug, test and diagnosis names inside Thai sentences).

Read first: `docs/HANDOFF.md` (where things stand and what is open), `docs/NEXT.md` (feature notes by pass),
`docs/WRITING.md` (voice rules for any Thai text).

## Branches

- Work happens on `claude/eloquent-dirac-6pegy7` and is mirrored to `fix/playable-loop`, which is PR #1
  (prawees/coderama, base `main`). Push both: `git push origin HEAD && git push origin HEAD:fix/playable-loop`.
- `remaster/clinical-engine` is a separate, unmerged branch with a 3D exam view and a case designer. Not part of PR #1.

## Commands

- `npm run dev` for local play at http://localhost:3000 (the game starts at `/`, the clinic is `/hub`).
- `npx tsc --noEmit` type check.
- `npm run validate` checks every case graph, the review-name sex table, and walks every story scene
  (31 days, 2 languages, 5 flag sets). Must print `0 error(s)` and `0 problem(s)`.
- `npm run build` writes the static export to `out/`. To play the export: `cd out && python3 -m http.server 8765`.
- Playtest bots (Playwright, headless phone size) are in `scripts/playtest/`, see the section below.

## Where things live

- `app/hub/page.tsx` the clinic screen: shift loop, patient spawner, story scenes, HUD. `app/hub/useWorldSocial.ts`
  is talking, gifts and props. `components/game/ClinicWorld.tsx` is the Pixi world (maps, actors, light, rain).
- `app/simulator/play/[id]/CaseEngineClient.tsx` the case screen: choices, labs, CPR minigame, grading, debrief.
- `lib/erStore.ts` the whole save (Zustand persisted to `CapacitorStorage.code-rama-storage`). New fields need a
  default, a `partialize` entry and a `resetGame` entry.
- `lib/story.ts` reads the campaign (`lib/StoryManager.ts` English, `lib/StoryManagerTH.ts` Thai JSON). Shift start
  time comes from the first "HH:MM น." in the opening scene, else 08:00, or 19:00 on the night-shift days.
- `lib/schedule.ts` picks the next patient. `lib/review.ts` names review patients. `lib/patients.ts` names, quotes,
  letters. `lib/caseIndex.ts` (generated) imports all Thai case JSON.
- Farm-game systems: `lib/requests.ts` (daily board request), `lib/casebook.ts`, `lib/weather.ts`,
  `BIRTHDAYS`/`ABSENT`/`ROSTER` in `lib/npcs.ts`, `lib/gifts.ts`, `lib/quests.ts`, `lib/letters.ts`.
- Music is written code, not audio files: `lib/musicCore.ts`, `lib/music.ts`. Sound effects and rain: `lib/audio.ts`.

## Editing content

- **Cases.** English source is `public/locales/en/case_*.json`. Thai text lives in `scripts/thai/cases/case_*.txt`
  and is built with `python3 scripts/thai/cases.py build case_09` (or `build all`). Never hand-edit
  `public/locales/th/*.json`, the build overwrites it. `python3 scripts/thai/cases.py check` reports stale keys.
  A dose change means editing both the English JSON and the Thai `.txt`, then building.
- **Story text.** Thai lines are in `scripts/thai/story/dayNN.txt`, applied with `scripts/thai/story_patch.py`.
  The patch refuses changes to `[IF_FLAG:X]` tags. Structural edits (a day's `cases` list, new nodes) go straight
  into both `lib/StoryManager.ts` and `lib/StoryManagerTH.ts`, then run `npm run validate`.
- **Voice.** Follow `docs/WRITING.md`. No em or en dashes in player-facing text.

## Playtest bots

`scripts/playtest/long.js N` plays N days from a fresh save and logs every line, case and summary to
`scripts/playtest/out/long/log.txt` (about 2 minutes a day). `features.js` checks the request, casebook, review
patient and birthdays on a seeded rain day. `rain_out.js` screenshots the courtyard on a rain and a dry day.
They need a running export (`npm run build`, then serve `out/` on port 8765) and Playwright
(`npm i -D playwright && npx playwright install chromium`, or set `PW_MODULE` and `PW_CHROMIUM`).
`BASE_URL` overrides the address.

## Gotchas

- Do not run `npm run build` while a bot is playing: it replaces `out/` under the server. Rebuild, then restart
  the server.
- `pkill -f "pattern"` also kills the shell that runs it if the same command line contains the pattern.
  Use a bracket trick (`pkill -f "long[.]js"`) or a separate command.
- The chapter card's continue button appears about 3.6 s in. Bots must wait for it.
- Commit trailers used so far: `Co-Authored-By: Claude ... <noreply@anthropic.com>` and a `Claude-Session:` link.
