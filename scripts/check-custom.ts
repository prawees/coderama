/**
 * Every story case must survive the designer round trip: open in the designer format, convert back
 * to the game format, pass the author checks, and still be playable to a good ending.
 * Run with `npx tsx scripts/check-custom.ts` (part of `npm run validate`).
 */
import * as fs from "fs";
import * as path from "path";
import { normalizeForDesigner, toGameCase, checkCase } from "../lib/customCase";

const dir = path.join(__dirname, "../public/locales/th");
let problems = 0;
let total = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  total++;
  const src = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const game = toGameCase(JSON.parse(JSON.stringify(normalizeForDesigner(src))));
  const { errors } = checkCase(game);
  for (const e of errors) { console.log(`${f}: ${e}`); problems++; }
  // Walk the graph from start along non-slip edges: a good ending must still exist
  const nodes = new Map<string, any>(game.managementGraph.nodes.map((n: any) => [n.id, n]));
  const start = game.managementGraph.nodes.find((n: any) => n.type === "start");
  const seen = new Set<string>([start.id]);
  const q = [start.id];
  let good = false;
  while (q.length) {
    const id = q.shift()!;
    const out = game.managementGraph.edges.filter((e: any) => e.source === id).map((e: any) => e.target);
    const n = nodes.get(id);
    if (!out.length && !/critical|deterior|fatal|worsen/i.test(n?.data?.outcomeType || "")) good = true;
    for (const t of out) if (!seen.has(t) && !nodes.get(t)?.data?.slip) { seen.add(t); q.push(t); }
  }
  if (!good) { console.log(`${f}: no good ending after the round trip`); problems++; }
  // Nothing authored may be lost
  const steps = (src.managementGraph.nodes?.length ? src.managementGraph.nodes : []).filter((n: any) => n.type === "required");
  for (const s of steps) {
    const after = nodes.get(s.id);
    if ((after?.data?.distractors?.length ?? 0) !== (s.data?.distractors?.length ?? 0)) { console.log(`${f}: ${s.id} lost its wrong options`); problems++; }
    if ((after?.data?.actions?.length ?? 0) !== (s.data?.actions?.length ?? 0)) { console.log(`${f}: ${s.id} lost orders`); problems++; }
  }
}
console.log(`${total} cases through the designer round trip, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
