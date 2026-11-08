# Handoff, 8 November 2026

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
