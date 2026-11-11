# Handoff, 8 November 2026

## Player's pass: เคสประจำวัน, the case of the day (11 November, later)

What the game lacked as a habit and as a group-chat topic: a reason to open it tomorrow, and one thing everybody
played today. One mechanic does both.

- **One case a day, the same for everyone** (`lib/daily.ts`). The case comes from the 37 with a working-diagnosis
  step, in a fixed shuffled order; a new one arrives at midnight Thai time; day 1 is 11 November 2026. It plays like
  practice (the story save does not move) and is timed.
- **`/daily`** (`app/daily/page.tsx`) shows today's patient and complaint, the streak, the last seven days as coloured
  squares, and one button. It needs no save, so a friend who taps a link can play straight away. After playing: the
  result, a countdown to the next patient, and the ways to pass it on.
- **Result** (`components/game/DailyResult.tsx`): stars, the clock, whether the diagnosis was right first time, the
  streak. Kept on the device in `coderama.daily`; only the first finish of the day counts. A player with a story save
  gets coins once a day (20 plus 10 a star, +50 at a 3 day streak, +150 every 7th day).
- **Dare link** `/daily?d=12&s=3&t=134&x=1&n=บิ๊ก`: the friend sees "บิ๊กท้าคุณ!" with the result, plays the same
  patient, and gets a verdict (stars, then the diagnosis, then the clock). An old link says so and offers today's case.
  Neither the page, the share text nor the Story card names the diagnosis.
- **Where it shows:** the title menu ("เคสประจำวัน #N", with a dot until today's is played and the streak at stake),
  and the end-of-shift summary when today's is still waiting. The link preview description mentions it.
- **Tested:** `scripts/playtest/daily.js` (24 checks: the dare, a visitor with no save, no diagnosis leaked, the dare
  back, the card, tomorrow, a missed day, coins once with a save, replay pays nothing). It moves the clock by
  overriding `Date.now`, which is all `lib/daily.ts` reads.
- **Not built:** a shared leaderboard for the day. Results live on each phone; comparing happens through the links.
  A real board needs sign-in and server-side checks to be worth trusting, which fits the funded competition idea.

## Editor's pass: findings before readings, fair differentials, photo mode (11 November)

An audit of every screen and every case, as an editor and as a clinician would read them.

- **Findings come without their interpretation.** Exam findings and text results (ECG, films, ultrasound) used to
  state the conclusion ("...which is the combination that signals right ventricular infarction"), which gave the
  working diagnosis away. Each is now stored as `what was found || what it means`. In play only the finding shows;
  the reading (the teaching note) opens once the working diagnosis is committed, or at once in a case with no
  diagnosis step, and the debrief shows both. 177 items were split by hand: `scripts/clinical/split_apply.py` holds
  every decision (`CUT` where the reading starts at a phrase, `CUSTOM` where the two were interleaved and had to be
  rewritten) and is safe to rerun; `split_draft.py` is the first-pass helper. Exam text is English (as charted on a
  Thai ward) and lives in `public/locales/en`; text results are Thai in `scripts/thai/cases/*.txt`.
- **Fair differentials** (`lib/differentials.ts`). Seven cases skip the diagnosis step because their list is a problem
  list or the mechanism is plain (drowning, amputation, worried well, electrical injury, major burn, crush, mass
  casualty). Eight cases had options that were true alongside the answer (retroperitoneal haematoma in the pelvic
  fracture, health anxiety beside the benign node); those were replaced so every wrong pick is wrong. 37 cases now
  have the step. **A clinician should read this file**: it is short, and it is where a wrong call would be unfair.
- **Openings that gave the answer away** rewritten as the bedside picture (case_04 "EKG ยืนยัน SVT", case_05 "Severe
  asthma exacerbation"). The case library lists story cases by patient and complaint, not the working title that
  names the diagnosis. An internal note that leaked into an exam finding ("the way case_23 was anxious") is gone.
- **Photo mode.** The clinic's share button now takes a picture: everyone on screen turns and pops a heart or a
  star (`WorldApi.pose`), the shutter flashes, and the sheet opens on a polaroid of the scene (`WorldApi.snapshot`,
  card kind `photo` in `lib/shareCard.ts`) with tape, a film-camera stamp ("DAY 07 08:00") and a caption that can be
  changed (`photoCaptions` in `lib/shareSpecs.ts`: night shift, rain, ordinary day). The stat card is one tap away.
- **Small things:** the bullet character in order feedback and the dash used as a minimise icon are gone; two unused
  files with placeholder text were deleted.
- **Tested:** `dx.js` now also checks findings without readings, the reading opening on commit, a skipped case and a
  curated list (24 checks). `ONLY=luck` in `requests.js` checks the photo, the caption change and the stat card.
- **Still for a clinician:** the reading notes themselves, the eight curated lists, and whether any remaining finding
  is too leading. Search a case's text for ` || ` to see where each split falls.

## Defib pads in the cold open (10 November)

Players kept hitting the shock button by accident: it appeared where they were already tapping CPR.
- After the first round of CPR, Ann takes over compressions and asks you to put the pads on
  (`components/game/PadPlacement.tsx`). Drag each pad onto the chest, or tap a pad and then the chest:
  one under the patient's right collarbone, one on the left side under the armpit. A wrong spot sends it back with a
  reason (breastbone, too low, too high, not across the heart) and the two spots then show as dashed circles.
- Then a short pause to read the rhythm (VF, shockable), charge, a "ทุกคนถอย! ไม่แตะเตียง" button, and only then
  the shock button, after a short delay. Three separate taps, never where the press button was.
- The dare time includes the pads now, so new runs are slower than links shared before this.
- Bots: `scripts/playtest/coldopen.js` places the pads; `hook.js` checks the miss, the pads and that no shock button
  shows before everyone is clear.

## Calmer screen for every age (9 November)

From อ.พรเทพ (paediatrics): fun, but too many pop-ups in too many places; he could not tell what was information
and what wanted an action, and text appearing on different layers was dizzying.

- **One layout rule.** Top of the clinic: two rows that never overlap (day, time and place with coins and energy;
  then today's task with the share button). Under them, one message slot: the pager and notices appear there, upright,
  and the story dialogue uses the same place. The bottom is only things to do (keys, A, beds, buttons).
- **The pager** no longer slides in tilted over the world; it sits in the message slot and says what to do
  ("แตะชื่อคนไข้ที่แถบเตียงด้านล่างเพื่อรับเคส").
- **Cases:** no screen shake on a wrong answer, and no text flying across the screen. "+15 XP" or "-2 พลังงาน" is a
  small tag at the top of the treatment panel, where the feedback already is.
- **โหมดสบายตา** (`lib/calm.ts`): a switch on the title menu (in plain sight on purpose) and in settings. Lines appear
  whole instead of typing, and nothing bobs, pulses, wiggles or shakes (`.calm` in globals.css, framer-motion via
  `MotionConfig` in `app/ClientLayout.tsx`). On by default when the phone asks for reduced motion.
- **Tested:** `scripts/playtest/calm.js` (the switch, whole lines, no looping animation, the top rows do not overlap).
- **Still to do:** the seven older cases (case_01 to case_07_vip) name the diagnosis in their opening narrative
  (case_05 opens with "Severe asthma exacerbation"). Rewriting those openings as what the doctor sees would finish
  Porames' point; a clinician should check the wording.

## Workup before treatment, first meetings, the stethoscope (8 November, evening)

- **Cases ask you to think first** (from Porames' playtest: "players just pick from the MCQ"). A case opens on the
  history tab. When the case's `diagnoses` is a real differential (4 or more names, the answer first; 44 of 51 cases),
  the treatment tab waits until the player has gathered two things (history, an exam system or a test) and picked a
  working diagnosis from that list, shuffled. A wrong first pick is one slip and the player thinks again (the answer
  is not shown); right first time is +20 XP. The debrief shows the first call and the other differentials. A case that
  starts in arrest (BP 0/0 or HR 0) treats first and asks after the first step. Cases with a short problem list
  (case_01 to case_07_vip) play as before. Numeric results already showed only the number; text reports (ECG, films)
  still describe findings, and a few may name the diagnosis. Worth a pass by a clinician.
- **Ten lines per character.** `lib/npcMore.ts` adds lines (10 at the first friendship level, 5 at each warmer
  level) and a different line when you talk again the same day. The awkward ones from the user were rewritten
  (Bob "อยู่แต่กายหยาบนะ", Somchai's door line, the day 1 automatic door).
- **First meetings.** Talking to someone for the first time plays a short exchange and usually gives a welcome gift
  (Ann a Thai tea, Ek his pocket handbook, Lung Suk dried fish for the cat...). Remembered as `<id>:meet` in
  `heartEventsSeen`.
- **The stethoscope.** Prof. Somchai's first meeting on day 1 sends you to the supply room (two new guide steps).
  `components/game/StethoscopeStudio.tsx`: pick one of eight tubing colours and engrave up to 14 characters; the
  camera zooms onto the chestpiece and a laser writes the name round the rim. Saved as `myStethoscope`; the sprite's
  stethoscope appears only once you own one, in its colour (saves past day 1 keep a plain one). 500 coins.
- **iPhone magnifier on the D-pad** fixed: the keys cancel the touch itself (a plain non-passive listener) and carry
  `game-key` (no selection, callout or zoom).
- **Tested:** `scripts/playtest/dx.js` (17 checks), `ONLY=meet node scripts/playtest/requests.js` (17 checks).
  Bots that play cases share `scripts/playtest/workup.js`. Timing checks (cold-open CPR rate in `hook.js`) fail when
  the Mac is under heavy load (load average over 50); rerun when it is idle.

## Getting friends in from the first minute (8 November, later)

- **Link preview.** `app/layout.tsx` now has Thai Open Graph and X tags and `public/og.jpg` (1200x630, real
  screenshots plus the logo), so a link pasted in LINE or Messenger shows a picture and a Thai line instead of
  "ER Management Idle RPG". LINE caches previews per URL for a while; a link pasted before this deploy may keep the old one.
- **Cold-open dare.** The cold open now times the run (first order to ROSC, in tenths of a second) and counts CPR
  on rate. The title after it offers "ท้าเพื่อนให้ลองบ้าง", a link like `/?vf=12.4&cpr=88&n=บิ๊ก`. Whoever opens it gets a
  splash naming the friend and the time, plays the same arrest with the dare on screen, sees who won (CPR breaks a
  tie), and can dare back. It works for players with a save too, and goes back to their game afterwards.
  `lib/invite.ts` holds the link format, the verdict and `shareLink` (phone share sheet, else LINE's share page on a
  phone, else the clipboard). The menu button is now "เล่นฉากเปิด ท้าเพื่อนแข่ง".
- **Invites.** Settings (title and clinic) has "ชวนเพื่อนเล่น"; the Story card sheet has "ส่งลิงก์ LINE".
- **Feedback.** `components/game/FeedbackModal.tsx` and `lib/feedback.ts`: hearts 1 to 5, what they liked, what to
  fix, a free line (no names or numbers asked). The summary asks with a row of hearts after days 1, 5, 10, 20 and 31,
  once each; settings has "บอกทีมหน่อย" any time. Rows go to Firestore `feedback`, create only, checked field by field
  in `firestore.rules` (tested on the emulator: a good row passes, extra fields, bad ratings, long text, someone
  else's uid and any read are refused). Read them in the Firebase console, Firestore, `feedback`.
  **The rule must be deployed** (`firebase deploy --only firestore:rules`), or sending shows "ส่งไม่สำเร็จ".
- **Tested:** `scripts/playtest/growth.js` (28 checks: preview tags, the dare both ways, a returning player, a broken
  link, invite, feedback against the emulators; `FEEDBACK=0` skips the emulator part).

## Sharing, late-story density, small extras (8 November)

- **Share from anywhere.** A "แชร์สตอรี่" button sits under coins and energy in the clinic from day 1, and the profile
  page has one too. Both make a "บัตรหมอ" card (`kind: "profile"` in `lib/shareCard.ts`, built by `profileCard()` in
  `lib/shareSpecs.ts`): rank, place, day, chapter hearts, the player and the cat, three numbers and the doctor type.
  Milestone cards (shift, case, chapter) still come up at the end of a shift as before. The HUD corner is
  `pointer-events-none`, so anything clickable inside it needs `pointer-events-auto` (the first version did not, and
  the canvas took the tap).
- **Days 11 to 31 have more story.** `scripts/thai/story_more/days11_31.py` holds extra Thai lines per day (before,
  during and after the shift, with a few choices) and a 2 to 3 line teaching round before handover.
  `apply.py` inserts them into `lib/StoryManagerTH.ts` and can be rerun (it removes its own `_x_` nodes first).
  Thai only: English players see the original scenes. Days 11 to 31 went from about 10 to about 18 lines a day.
  `rewrite.py` replaces story lines by node id; `wording_02_10.py` and `wording_11_31.py` are this pass's rewrites.
  After any of these, run `python3 scripts/thai/story_patch.py` if the day files changed, then `npm run validate`.
- **Mid-shift scenes.** `midShiftEvents` can hold several `{triggerMinute, cutscene}` events. Event `i` plays when the
  clock passes its minute or after patient `i+1`, whichever comes first, so a quick player still sees them all.
- **Small luck games.** `lib/luck.ts`: a capsule machine in the supply closet (tab "กาชา", 30 coins, mostly gifts and
  coins back, a 2% jackpot) and เซียมซี sticks at the courtyard tree, once a day, with a small bonus.
  UI in `components/game/LuckyModal.tsx`.
- **Doctors' room PC.** The consult computer now opens `components/game/DoctorPC.tsx`: links to Thai emergency
  guidelines (Ramathibodi Poison Center 1367, สพฉ. 1669, Thai Resuscitation Council, AHA 2020 Thai highlights, Heart
  Association of Thailand, Journal of Thai Stroke Society, กรมควบคุมโรค) and a button on to the consult room.
  Check the links once a year; they open outside the game.
- **Tested:** `ONLY=luck node scripts/playtest/requests.js` taps the share button (without forcing it), the PC, the
  tree and the gacha. `START_DAY=11 node scripts/playtest/long.js 3` plays from a seeded save on day 11.
- **GitHub "secret detected" alert on `lib/firebase.ts`.** That is the Firebase web API key, which is public by design
  (it ships in every web build). Restrict it in Google Cloud Console (HTTP referrers and the Firebase APIs only),
  then close the alert. See "Accounts" below.

## Hosting on coderama.prawees.com (Hostinger)

- `scripts/deploy-hostinger.sh` builds with the site address on the Story cards and uploads over SSH with a key made for
  this (`~/.ssh/coderama_hostinger` on the dev Mac). No Hostinger password is stored anywhere.
- `public/.htaccess` was tested on a local Apache 2.4 with every bot (hook, custom, requests, features): clean URLs,
  `/hub/` redirects to `/hub`, the game's own 404 page, no-cache on pages, a year of caching on hashed build files.
- Live since 8 November 2026 at https://coderama.prawees.com (folder `domains/prawees.com/public_html/coderama`).
  Hostinger's automatic SSL is on and http redirects to https. The hook, custom and features bots pass against the live
  site. To update it: `scripts/deploy-hostinger.sh` (needs `.deploy.env` and the key on the dev Mac).
- Still to do in Firebase: add coderama.prawees.com under Authentication, Settings, Authorized domains, and switch on
  Google and the email link, or sign-in will not work on the live site.

## Accounts, cloud saves and the leaderboard

- Firebase project `code-rama-6826d` (the one made in August, Firestore in Bangkok, free Spark plan). A web app
  "Code Rama" is registered and `firestore.rules` is deployed. An extra empty project `code-rama-th` was created by
  mistake on 8 November and can be deleted from the console.
- `lib/account.ts` replaced three overlapping sync paths. It saves the whole game, never overwrites progress without
  asking, keeps the game on the phone after sign-out, and writes a leaderboard row only for players who leave the
  setting on (in-game name, school, day, patients saved, stars, best streak; never the email).
- The leaderboard ranks by patients saved, not XP. The old `/hub/leaderboard` page, linked from nowhere, is gone.
- **Still to do by a person:** in the Firebase console, Authentication, Sign-in method: turn on Google, and Email/Password
  with "Email link (passwordless sign-in)". When the game has a public address, add it under Authorized domains.
- **iOS app:** Google sign-in uses a pop-up, which does not work inside the app, so the app shows email-link sign-in
  only, and the link opening the app needs deep links set up. Native Google and Sign in with Apple need the Capacitor
  Firebase Authentication plugin. Apple requires Sign in with Apple in any App Store app that offers Google sign-in.
- Leaderboard numbers are written by the player's own device. The rules cap them at believable values, but a
  determined player could still post a fake score. Checking scores on a server needs Cloud Functions (paid plan).
- Designer cases published before this went to Porames' `rama-toxico-edu` project and stay there.

## First minute and retention pass

Goal: hook a student or evaluator at once, and stop 31 days from reading as a wall.

- **Cold open.** A new player taps once and is running a VF arrest as the attending: order, CPR, shock, back on the
  chest, rhythm check at 2 minutes, ROSC. It follows ACLS and cannot be failed. It plays once per device and can be
  skipped. A clinician should read `components/game/ColdOpen.tsx`.
- **Setup is one screen** (name, gender, school). Dressing the character is optional. Returning players skip the logo
  and land on the menu, with their chapter and what is waiting.
- **Chapters, not 31 days.** The day card, summary and menu say "บท 1 เวร 3/5" and name the next promotion. Nothing
  shows a total of 31.
- **A reason to come back.** Every shift ends on a hook for the next one (`lib/teasers.ts`), a title for the shift, lives
  saved and a run of good cases. Case results land as stars.
- **Rank follows the story.** During the campaign `storyRank` gives rank from the day alone: นศพ. ปี 5, extern, intern, R1, then
  อาจารย์ on day 31. XP is only what you spend on skills until the campaign ends, when the promotion exam takes over.
  The bar on the desk counts shifts to the next promotion, which replaced an XP bar that sat full for most of a chapter.
- **Logo.** `lib/pixel/logo.ts`, shown by `components/game/PixelLogo.tsx`. `npx tsx scripts/export-logo.ts` writes the PNGs in
  `public/`. The app icons are still the cat.
- **Story cards.** Shift, case (a "what would you do" challenge that hides the answer) and chapter cards, 1080x1920, kept
  inside Instagram's safe area. Drawn on a canvas rather than captured from the page, and text shrinks to fit.

**Needs a person or a decision:**
- Real iPhone and Android test of the share button into Instagram. Headless browsers have no share sheet, so only the
  fallback (save the picture) has been exercised. After pulling, run `npx cap sync ios` and rebuild the app: it adds
  `@capacitor/filesystem`, and `Info.plist` gained the photo permission text that "Save Image" needs.
- There is no public link for the game yet. Set `NEXT_PUBLIC_SHARE_URL` at build time and every card shows it, otherwise
  someone who sees a card has nowhere to go.
- Days 11 to 31 have far less story than days 1 to 10: about 9 lines a day against about 34. This is the biggest risk to
  finishing the game and the hooks only partly cover it.
- The titles and hooks are first drafts of Thai humour and need a Thai reader.

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
