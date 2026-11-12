import { CASE_DATA } from "@/lib/caseIndex";
import { differentialFor } from "@/lib/differentials";
import { siteUrl } from "@/lib/invite";

/**
 * เคสประจำวัน: one case a day, the same for everyone, from the cases that ask for a working diagnosis.
 * It gives a group chat one thing to talk about ("วันนี้ยากมาก") and a reason to open the game tomorrow.
 * A new case arrives at midnight in Thailand. The result is kept on the device (stars, time, and whether the
 * diagnosis was right the first time), with a streak of days played in a row. Nothing here names the diagnosis.
 */

const DAY_MS = 86_400_000;
const BANGKOK_MS = 7 * 3_600_000;
/** Day 1 is 11 November 2026, Thai time */
const EPOCH_DAY = Math.floor(Date.UTC(2026, 10, 11) / DAY_MS);

/** Today's number, counting from 1 */
export function dailyNumber(now = Date.now()): number {
  return Math.max(1, Math.floor((now + BANGKOK_MS) / DAY_MS) - EPOCH_DAY + 1);
}

/** Milliseconds until the next case */
export function msToNextDaily(now = Date.now()): number {
  return DAY_MS - ((now + BANGKOK_MS) % DAY_MS);
}

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

let pool: string[] | null = null;
/** The cases with a working-diagnosis step, in a fixed shuffled order, so neighbours in the list are unrelated */
function dailyPool(): string[] {
  if (!pool) {
    pool = Object.keys(CASE_DATA)
      .filter((id) => differentialFor(id, (CASE_DATA as Record<string, { diagnoses?: unknown }>)[id]?.diagnoses).length > 0)
      .sort((a, b) => hash(`daily:${a}`) - hash(`daily:${b}`));
  }
  return pool;
}

export function dailyCaseId(n = dailyNumber()): string {
  const list = dailyPool();
  return list[(n - 1) % list.length];
}

export interface DailyResult {
  /** 0 to 3, the same stars as a story case */
  stars: number;
  /** seconds from opening the case to the end */
  secs: number;
  /** the working diagnosis was right the first time */
  dxFirst: boolean;
}

interface DailyState {
  /** number of the last day played */
  last: number;
  streak: number;
  best: number;
  results: Record<string, DailyResult>;
}

const KEY = "coderama.daily";
const EMPTY: DailyState = { last: 0, streak: 0, best: 0, results: {} };

export function readDaily(): DailyState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && typeof raw === "object") return { ...EMPTY, ...raw, results: { ...(raw.results || {}) } };
  } catch { /* private mode or a broken value */ }
  return { ...EMPTY };
}

/** The streak as it stands today: it lapses once a whole day has been missed */
export function liveStreak(st = readDaily(), n = dailyNumber()): number {
  return st.last >= n - 1 ? st.streak : 0;
}

export const playedToday = (st = readDaily(), n = dailyNumber()) => !!st.results[String(n)];

/** Keep the first result of the day. Returns the state and whether this was the day's first finish. */
export function recordDaily(result: DailyResult, n = dailyNumber()): { state: DailyState; first: boolean } {
  const st = readDaily();
  if (st.results[String(n)]) return { state: st, first: false };
  const streak = st.last === n - 1 ? st.streak + 1 : 1;
  const results = { ...st.results, [String(n)]: result };
  // a month of history is plenty for the week strip
  for (const k of Object.keys(results)) if (Number(k) < n - 30) delete results[k];
  const state: DailyState = { last: n, streak, best: Math.max(st.best, streak), results };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  return { state, first: true };
}

/** Coins for the story save: more for a better result, and a bonus when the streak reaches 3 and every 7th day */
export function dailyCoins(result: DailyResult, streak: number): number {
  const bonus = streak === 3 ? 50 : streak > 0 && streak % 7 === 0 ? 150 : 0;
  return 20 + result.stars * 10 + bonus;
}

export const fmtClock = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.round(secs) % 60).padStart(2, "0")}`;

/** One line for a result, with no diagnosis in it */
export function dailyLine(r: DailyResult): string {
  return `${r.stars} ดาว ใน ${fmtClock(r.secs)} ${r.dxFirst ? "Dx ถูกครั้งแรก" : "Dx รอบสอง"}`;
}

/** A link that dares a friend with today's result: /daily?d=12&s=3&t=134&x=1&n=บิ๊ก */
export function dailyDareUrl(n: number, r: DailyResult, name?: string | null): string {
  const q = new URLSearchParams({ d: String(n), s: String(r.stars), t: String(Math.round(r.secs)), x: r.dxFirst ? "1" : "0" });
  const who = name?.trim().slice(0, 15);
  if (who) q.set("n", who);
  return `${siteUrl()}/daily?${q.toString()}`;
}

export interface DailyDare { day: number; result: DailyResult; name: string | null }

export function readDailyDare(search: string): DailyDare | null {
  const q = new URLSearchParams(search);
  const day = Number(q.get("d")), stars = Number(q.get("s")), secs = Number(q.get("t"));
  if (!Number.isInteger(day) || day < 1 || !Number.isInteger(stars) || stars < 0 || stars > 3 || !Number.isFinite(secs) || secs < 5 || secs > 7200) return null;
  const name = (q.get("n") || "").replace(/[<>]/g, "").trim().slice(0, 15) || null;
  return { day, result: { stars, secs: Math.round(secs), dxFirst: q.get("x") === "1" }, name };
}

/** Who did better: stars first, then the diagnosis, then the clock */
export function dailyVerdict(mine: DailyResult, dare: DailyDare): string {
  const who = dare.name ?? "เพื่อน";
  const t = dare.result;
  if (mine.stars !== t.stars) return mine.stars > t.stars ? `ได้ดาวมากกว่า${who}!` : `${who}ได้ดาวมากกว่า พรุ่งนี้เอาใหม่`;
  if (mine.dxFirst !== t.dxFirst) return mine.dxFirst ? `ดาวเท่ากัน แต่คุณวินิจฉัยถูกก่อน ชนะ!` : `ดาวเท่ากัน แต่${who}วินิจฉัยถูกตั้งแต่แรก`;
  if (mine.secs === t.secs) return `เสมอกับ${who}เป๊ะ`;
  return mine.secs < t.secs ? `ดาวเท่ากัน แต่คุณเร็วกว่า${who} ${fmtClock(t.secs - mine.secs)} นาที` : `ดาวเท่ากัน แต่${who}เร็วกว่า ${fmtClock(mine.secs - t.secs)} นาที`;
}
