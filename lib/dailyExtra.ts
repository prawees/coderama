import { CASE_DATA } from "@/lib/caseIndex";
import { differentialFor } from "@/lib/differentials";
import { dailyCaseId, dailyNumber } from "@/lib/daily";
import { siteUrl } from "@/lib/invite";

/**
 * Two more daily challenges beside the case of the day, the same for everyone:
 * - ทายโรค: name the diagnosis in six tries. Each miss opens the next clue, taken from the case as written
 *   (complaint, vitals, history, exam, labs, a text result: findings only, never the teaching note).
 * - ลำดับชีวิต: put an emergency algorithm in order against the clock (lib/algorithms.ts).
 * Results stay on the device in `coderama.daily2`; only the first finish of a day counts.
 */

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const cases = CASE_DATA as Record<string, any>;
const finding = (t?: string) => String(t ?? "").split(" || ")[0];

const STOP = new Set("with and the of acute severe syndrome injury left right type shock disease from high risk late onset group middle artery territory elevation reactive cervical bleeding".split(" "));
let pool: string[] | null = null;
const dxPool = () => (pool ??= Object.keys(cases).filter((id) => differentialFor(id, cases[id]?.diagnoses).length > 0).sort((a, b) => hash(`dxdle:${a}`) - hash(`dxdle:${b}`)));

/** The case to guess today: never the same patient as the case of the day */
export function dxCaseId(n = dailyNumber()): string {
  const list = dxPool();
  let id = list[(n - 1) % list.length];
  if (id === dailyCaseId(n)) id = list[n % list.length];
  return id;
}

/** Every diagnosis a player can guess: all answers and all their look-alikes */
export function dxChoices(): string[] {
  const all = new Set<string>();
  for (const id of dxPool()) differentialFor(id, cases[id].diagnoses).forEach((d) => all.add(d));
  return Array.from(all).sort((a, b) => a.localeCompare(b));
}

function vitalsLine(v: any): string {
  if (!v) return "";
  const val = (x: any) => (x && typeof x === "object" ? x.value : x);
  const bp = v.bp ?? (val(v.sbp) != null ? `${val(v.sbp)}/${val(v.dbp)}` : null);
  const parts = [["HR", val(v.hr)], ["BP", bp], ["RR", val(v.rr)], ["SpO2", val(v.spo2) ?? v.o2], ["T", val(v.temp)], ["GCS", val(v.gcs)]];
  return parts.filter(([, x]) => x != null && x !== "").map(([k, x]) => `${k} ${x}`).join("  ");
}

export interface DxPuzzle { caseId: string; answer: string; close: string[]; clues: { label: string; text: string }[] }

export function dxPuzzle(n = dailyNumber()): DxPuzzle {
  const caseId = dxCaseId(n), c = cases[caseId];
  const diff = differentialFor(caseId, c.diagnoses);
  const nodes = c.managementGraph?.nodes;
  const start = Array.isArray(nodes) ? nodes.find((x: any) => x.type === "start")?.data : nodes?.start;
  // A clue must not contain the answer's own words: no "Serum methanol level", no CT that shows the dissection,
  // no history that names the poison. Such clues are left out rather than reworded.
  const words = (diff[0].toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => !STOP.has(w));
  const tells = (t: string) => words.some((w) => t.toLowerCase().includes(w));
  const exam = (c.exam || []).filter((e: any) => e.abnormal && !tells(finding(e.finding)));
  const labs = (c.investigations || []).filter((i: any) => i.abnormal && i.indicated !== false && !tells(String(i.name)));
  const numeric = labs.filter((i: any) => i.value !== undefined && i.value !== "").slice(0, 3);
  const textual = labs.find((i: any) => (i.value === undefined || i.value === "") && i.report && !tells(finding(i.report)));
  const sex = /^f/i.test(c.sex || "") ? "หญิง" : "ชาย";
  const clues = [
    { label: "มาด้วย", text: `${sex} ${c.age} ปี ${c.chiefComplaint}` },
    { label: "Vital signs", text: vitalsLine(start?.vitals ?? c.vitals) },
    { label: "ประวัติ", text: tells(String(c.background || "")) ? "" : String(c.background || "") },
    { label: "ตรวจร่างกาย", text: exam.slice(0, 2).map((e: any) => finding(e.finding)).join(" ") },
    { label: "แล็บ", text: numeric.map((i: any) => `${i.name} ${i.value}${i.unit && i.unit !== "-" ? " " + i.unit : ""}`).join("  ") },
    { label: textual?.name ?? "ผลตรวจ", text: textual ? finding(textual.report) : exam.slice(2, 4).map((e: any) => finding(e.finding)).join(" ") },
  ].filter((x) => x.text.trim());
  return { caseId, answer: diff[0], close: diff.slice(1), clues };
}

export type Mark = "right" | "close" | "far";
export const markGuess = (p: DxPuzzle, guess: string): Mark => (guess === p.answer ? "right" : p.close.includes(guess) ? "close" : "far");
/** Squares for a chat message, the way these daily games are shared */
export const SQUARE: Record<Mark, string> = { right: "🟩", close: "🟨", far: "🟥" };

interface Extra { dx: Record<string, { marks: Mark[] }>; algo: Record<string, { score: number; secs: number; wrong: number }> }
const KEY = "coderama.daily2";
export function readExtra(): Extra {
  try { const r = JSON.parse(localStorage.getItem(KEY) || "null"); if (r) return { dx: r.dx || {}, algo: r.algo || {} }; } catch { /* private mode */ }
  return { dx: {}, algo: {} };
}
function write(e: Extra, n: number) {
  for (const k of ["dx", "algo"] as const) for (const d of Object.keys(e[k])) if (Number(d) < n - 30) delete e[k][d];
  try { localStorage.setItem(KEY, JSON.stringify(e)); } catch { /* private mode */ }
}
export function saveDx(marks: Mark[], n = dailyNumber()) { const e = readExtra(); e.dx[String(n)] = { marks }; write(e, n); }
export function saveAlgo(r: { score: number; secs: number; wrong: number }, n = dailyNumber()) { const e = readExtra(); if (!e.algo[String(n)]) { e.algo[String(n)] = r; write(e, n); } return e.algo[String(n)]; }

export const dxDone = (marks: Mark[] | undefined, max: number) => !!marks && (marks.includes("right") || marks.length >= max);
export function dxShareText(n: number, marks: Mark[], max: number): string {
  const won = marks.includes("right");
  return `Code Rama Dx Guess #${n} ${won ? marks.length : "X"}/${max}\n${marks.map((m) => SQUARE[m]).join("")}`;
}
export const dxUrl = (n: number, marks: Mark[], name?: string | null) => {
  const q = new URLSearchParams({ d: String(n), g: marks.includes("right") ? String(marks.length) : "x" });
  if (name?.trim()) q.set("n", name.trim().slice(0, 15));
  return `${siteUrl()}/daily/dx?${q}`;
};
export const algoUrl = (n: number, score: number, name?: string | null) => {
  const q = new URLSearchParams({ d: String(n), s: String(score) });
  if (name?.trim()) q.set("n", name.trim().slice(0, 15));
  return `${siteUrl()}/daily/algo?${q}`;
};
export function readFriend(search: string): { day: number; value: string; name: string | null } | null {
  const q = new URLSearchParams(search), day = Number(q.get("d")), value = q.get("g") ?? q.get("s") ?? "";
  if (!Number.isInteger(day) || day < 1 || !/^(x|\d{1,5})$/.test(value)) return null;
  return { day, value, name: (q.get("n") || "").replace(/[<>]/g, "").trim().slice(0, 15) || null };
}
