# Code Rama

A cozy pixel-art ER game for Thai medical students (Next.js 14 static export, Pixi 8, Zustand, Capacitor iOS).
The player walks a clinic, treats 51 emergency cases, and follows a 31-day story across four hospitals.
Everything a player reads is Thai as spoken on a Thai ward (English drug, test and diagnosis names inside Thai sentences).

Read first: `docs/HANDOFF.md` (where things stand and what is open), `docs/NEXT.md` (feature notes by pass),
`docs/WRITING.md` (voice rules for any Thai text).

## Branches

- Work happens on `claude/eloquent-dirac-6pegy7` and is mirrored to `fix/playable-loop`, which is PR #1
  (prawees/coderama, base `main`). Push both: `git push origin HEAD && git push origin HEAD:fix/playable-loop`.
- On the local clone the remote is named `coderama` (`origin` there is Porames' toxico-learning, never push to it).
- `remaster/clinical-engine` is a separate, unmerged branch with an older real-time engine. Not part of PR #1.
  Its designer and 3D view have been ported to this branch; its engine has not.

## Commands

- `npm run dev` for local play at http://localhost:3000 (the game starts at `/`, the clinic is `/hub`).
- `npx tsc --noEmit` type check.
- `npm run validate` checks every case graph, the review-name sex table, walks every story scene
  (31 days, 2 languages, 5 flag sets), and pushes all 51 cases through the designer round trip, and checks every board request and birthday can happen.
  Must print `0 error(s)` and `0 problem(s)` on every line.
- `npm run build` writes the static export to `out/`. To play the export: `node scripts/playtest/serve.js out 8765`.
- Playtest bots (Playwright, headless phone size) are in `scripts/playtest/`, see the section below.
- `scripts/deploy-hostinger.sh` checks, builds and uploads the game to coderama.prawees.com over SSH with the key
  `~/.ssh/coderama_hostinger` (settings in `.deploy.env`, see `.deploy.env.example`; `--dry-run` first). It refuses a
  folder that is not empty or already Code Rama's. `public/.htaccess` gives Apache/LiteSpeed clean URLs and caching.

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
- Custom cases: `app/designer/` and `components/designer/` (Porames' editor), `app/cases/` (library),
  `lib/customCase.ts` (designer format to game format, plus author checks), `lib/customCases.ts` (local and Firestore
  storage). `components/exam3d/` is the 3D bedside. `lib/examOrder.ts` maps exam systems to ABCDE and body regions.
- First minute and retention: `components/game/ColdOpen.tsx` (plays once per device, flag `coderama.coldOpenSeen`; the defib pads step is
  `components/game/PadPlacement.tsx`),
  `lib/chapters.ts` (chapter breaks, the single source), `lib/teasers.ts` (next-shift hook per day, must hold on every
  story branch), `lib/shiftTitle.ts` (shift titles and doctor types).
- Story cards: `lib/shareCard.ts` draws them on a canvas, `lib/shareSpecs.ts` builds them from the save,
  `components/game/ShareSheet.tsx` previews and sends. `NEXT_PUBLIC_SHARE_URL` puts a link in the card footer.
- Accounts: `lib/account.ts` is the only cloud code: one save per player in `saves/{uid}`, an opt-in row in
  `leaderboards/{uid}`, and a choice screen when the phone and the cloud disagree. `app/login/` is the account page.
  Firebase project `code-rama-6826d` (Firestore in Bangkok), rules in `firestore.rules`
  (`firebase deploy --only firestore:rules`). `lib/firebase.ts` holds the public web config.
- Wardrobe: `components/game/Wardrobe.tsx`, used at setup and in the profile locker. What each year may wear is in
  `lib/uniform.ts` (year 5 long coat, extern short coat, scrubs from intern, long sleeves for attendings); locked
  options stay visible and say when they open.
- Reading: `components/game/RichText.tsx` lays a line out sentence by sentence (`lib/sentences.ts` decides where a
  Thai sentence ends) and tints English clinical terms and doses. Use it for any Thai line longer than a phrase.
- First-days guide: `lib/guide.ts` (steps, what completes them, what the world arrow points at) shown by
  `components/game/GuideTracker.tsx`; the arrow is `WorldApi.mark`. Guide progress is `guide` in the save.
- Haptics: always `haptic` from `lib/haptics.ts`, never `@capacitor/haptics` directly. Safari on iPhone has no vibration
  API and the plugin throws there; awaited, it silently broke taps. `hook.js` and `custom.js` run without vibration.
- Rank: always read it with `storyRank(day, lifetimeXp)` in `lib/erStore.ts`, never from XP during the campaign.
- Screen layout: the clinic's top is status rows, then one message slot (pager, toasts, dialogue); the bottom is only
  actions. Keep new notices in that slot. Calm mode is `lib/calm.ts` (`isCalm`, `useCalm`, class `calm` on <html>).
- Case reasoning: the working-diagnosis gate in `CaseEngineClient.tsx` (`dxGate`, `pickDx`) takes its options from
  `lib/differentials.ts` (answer first; which cases skip the step; curated look-alikes). Exam findings and text
  results are written `finding || reading`: the reading shows after the diagnosis is committed. The splits are kept in
  `scripts/clinical/split_apply.py`. Bots that play cases use `scripts/playtest/workup.js`.
- Photo mode: `WorldApi.pose` and `WorldApi.snapshot` in `ClinicWorld.tsx`, card kind `photo` in `lib/shareCard.ts`,
  captions in `lib/shareSpecs.ts`, the photo/card switch in `ShareSheet.tsx`.
- Characters: `lib/npcMore.ts` (extra lines, first meetings with a welcome gift). Stethoscope studio:
  `components/game/StethoscopeStudio.tsx`, saved as `myStethoscope`, drawn by `lib/playerLook.ts`.
- Case of the day: `lib/daily.ts` (which case, the streak, the dare link), `app/daily/page.tsx`,
  `components/game/DailyResult.tsx`; the case screen runs it with `?daily=1`. Results stay in `coderama.daily`.
- Growth: `lib/invite.ts` (cold-open dare links `/?vf=&cpr=&n=`, `shareLink`), `components/game/FeedbackModal.tsx` with
  `lib/feedback.ts` (Firestore `feedback`, create only), link preview in `app/layout.tsx` with `public/og.jpg`.
- Extras: `lib/luck.ts` with `components/game/LuckyModal.tsx` (capsule machine in the shop, เซียมซี at the courtyard
  tree), `components/game/DoctorPC.tsx` (guideline links on the doctors' room computer). Late-story additions (days
  11 to 31, Thai only) are generated by `scripts/thai/story_more/apply.py`; rerunning it is safe.
- Music is written code, not audio files: `lib/musicCore.ts`, `lib/music.ts`. Sound effects and rain: `lib/audio.ts`.

## Editing content

- **Cases.** English source is `public/locales/en/case_*.json`. Thai text lives in `scripts/thai/cases/case_*.txt`
  and is built with `python3 scripts/thai/cases.py build case_09` (or `build all`). Never hand-edit
  `public/locales/th/*.json`, the build overwrites it. `python3 scripts/thai/cases.py check` reports stale keys.
  A dose change means editing both the English JSON and the Thai `.txt`, then building.
  In an exam finding or a text result, put what was found first, then ` || `, then what it means.
- **Story text.** Thai lines are in `scripts/thai/story/dayNN.txt`, applied with `scripts/thai/story_patch.py`.
  The patch refuses changes to `[IF_FLAG:X]` tags. Structural edits (a day's `cases` list, new nodes) go straight
  into both `lib/StoryManager.ts` and `lib/StoryManagerTH.ts`, then run `npm run validate`.
- **Voice.** Follow `docs/WRITING.md`. No em or en dashes in player-facing text.

## Playtest bots

`scripts/playtest/long.js N` plays N days from a fresh save and logs every line, case and summary to
`scripts/playtest/out/long/log.txt` (about a minute a day). `features.js` checks the request, casebook, review
patient and birthdays on a seeded rain day. `rain_out.js` screenshots the courtyard on a rain and a dry day.
`custom.js` checks the case library, practice mode, the 3D bedside, the designer and custom-case play.
`requests.js` plays the board requests and a birthday by tapping people in the world (it uses the read-only
`window.__codeRamaWorld` hook for where they are on screen). `ONLY=gift|birthday|social|cat|menu|meet|luck` runs one scene,
`ONLY=luck` checks the HUD share button, the doctors' room PC, the fortune tree and the gacha. `TRACE=1` logs every tap. `START_DAY=11 long.js 3` plays days 11 to 13 from a seeded save. `hook.js` checks the first minute (cold open, setup, returning player) and renders every
Story card with awkward data into `out/hook`: look at those pictures after changing `lib/shareCard.ts`.
They need a running export (`npm run build`, then `node scripts/playtest/serve.js out 8765`) and Playwright
(`npm i -D playwright && npx playwright install chromium`, or set `PW_MODULE` and `PW_CHROMIUM`; a Playwright in /tmp
can be emptied by macOS, and a newer Playwright can run the cached browser through `PW_CHROMIUM`).
`BASE_URL` overrides the address.
`calm.js` checks the calm-mode switch and that the clinic's top rows never overlap. `dx.js` checks the workup and working diagnosis on a case. `ONLY=meet` in `requests.js` plays first meetings and the
stethoscope studio.
`daily.js` plays the case of the day from a friend's dare, across days, with and without a save.
`growth.js` checks the link preview tags, the cold-open dare from both sides, invites and feedback (feedback needs the
emulator build below; `FEEDBACK=0` skips it).
`account.js` tests sign-in, cloud saves, a second phone, a save conflict, the leaderboard and the security rules
against the Firebase emulators: run `firebase emulators:start --only auth,firestore --project demo-coderama`, build with
`NEXT_PUBLIC_FIREBASE_EMULATOR=1 NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-coderama NEXT_PUBLIC_FIREBASE_API_KEY=demo-key`
(that build has a test sign-in button), serve it and set `BASE_URL`. Rebuild without those before shipping.

## Gotchas

- Do not use `python3 -m http.server` for bots: it resets connections under load and has no clean URLs.
- Run `long.js` with the machine idle. It takes about 40 minutes for a full campaign.
- Do not run `npm run build` while a bot is playing: it replaces `out/` under the server. Rebuild, then restart
  the server.
- `pkill -f "pattern"` also kills the shell that runs it if the same command line contains the pattern.
  Use a bracket trick (`pkill -f "long[.]js"`) or a separate command.
- The chapter card's continue button appears about 3.6 s in. Bots must wait for it.
- Commit trailers used so far: `Co-Authored-By: Claude ... <noreply@anthropic.com>` and a `Claude-Session:` link.
