// Every board request and birthday can actually happen: the person is working that day, the gift is sold.
// Run with: npx tsx scripts/check-requests.ts
import { requestFor, teamFor } from "../lib/requests";
import { BIRTHDAYS, NPCS, birthdayOn, rosterOn, tasteOf } from "../lib/npcs";
import { GIFTS } from "../lib/gifts";
import { phaseForDay } from "../lib/world/maps";

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

console.log(`checked 30 requests and ${Object.keys(BIRTHDAYS).length} birthdays, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
