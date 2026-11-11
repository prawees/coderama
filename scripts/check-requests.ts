// Every board request and birthday can actually happen: the person is working that day, the gift is sold.
// Run with: npx tsx scripts/check-requests.ts
import { requestFor, teamFor } from "../lib/requests";
import { BIRTHDAYS, NPCS, birthdayOn, rosterOn, tasteOf } from "../lib/npcs";
import { GIFTS } from "../lib/gifts";
import { phaseForDay } from "../lib/world/maps";
import { CHAPTERS, chapterOf } from "../lib/chapters";
import { teaserAfter } from "../lib/teasers";

let problems = 0;
const bad = (m: string) => { problems++; console.log("PROBLEM", m); };

for (let day = 2; day <= 31; day++) {
  const r = requestFor(day);
  if (!r) { bad(`day ${day}: no request`); continue; }
  const team = teamFor(day);
  if (r.kind === "gift") {
    if (!team.includes(r.npcId)) bad(`day ${day}: ${r.npcId} asks for a gift but is not working`);
    if (!r.giftId || !GIFTS[r.giftId]) bad(`day ${day}: unknown gift ${r.giftId}`);
    else if (tasteOf(NPCS[r.npcId], r.giftId) === "hate") bad(`day ${day}: ${r.npcId} asks for something they hate`);
  }
  if (r.kind === "social" && !team.length) bad(`day ${day}: nobody to talk to`);
  if (r.kind === "kanom" && !GIFTS[r.giftId!]) bad(`day ${day}: no ${r.giftId} to give the cat`);
}

for (const [id, day] of Object.entries(BIRTHDAYS)) {
  const phase = phaseForDay(day);
  if (!rosterOn(day, phase).some((x) => x.id === id)) bad(`${id}: birthday on day ${day} but not working at ${phase} that day`);
  else if (birthdayOn(day, phase) !== id) bad(`${id}: day ${day} is shadowed by another birthday`);
}

// Chapters cover the campaign with no gaps, and every shift ends on its own hook
for (let day = 1; day <= 31; day++) if (!chapterOf(day)) bad(`day ${day} is in no chapter`);
if (CHAPTERS[0].first !== 1 || CHAPTERS[CHAPTERS.length - 1].last !== 31) bad("chapters do not span days 1 to 31");
const fallback = teaserAfter(999);
for (let day = 1; day <= 30; day++) {
  const t = teaserAfter(day);
  if (t === fallback) bad(`day ${day} has no hook for the next shift`);
  if (/[\u2013\u2014]/.test(t)) bad(`day ${day}: dash in the hook`);
}

console.log(`checked 30 requests and ${Object.keys(BIRTHDAYS).length} birthdays, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
