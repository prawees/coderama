/**
 * Links that bring friends in. A link is the cheapest share there is: it works in LINE, Messenger and IG DMs,
 * and the site's preview image (app/layout.tsx, public/og.png) does the selling.
 *
 * The challenge link carries a cold-open result: `/?vf=34&cpr=88&n=บิ๊ก` means "Big brought the patient back in
 * 34 seconds with 88% of compressions on rate". Whoever opens it plays the same arrest against that score.
 */

/** The public address, without a trailing slash */
export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SHARE_URL;
  if (env) return env.startsWith("http") ? env.replace(/\/$/, "") : `https://${env.replace(/\/$/, "")}`;
  if (typeof location !== "undefined" && /^https?:/.test(location.origin)) return location.origin;
  return "https://coderama.prawees.com";
}

export interface ColdOpenResult {
  /** seconds from the first order to ROSC */
  secs: number;
  /** share of compressions inside 100 to 120 a minute, 0 to 100 */
  cpr: number;
  /** wrong orders before the right one */
  wrong: number;
}

export interface Challenge {
  secs: number;
  cpr: number;
  name: string | null;
}

const NAME_MAX = 15;
/** Tenths of a second: most runs land within a few seconds of each other, so whole seconds would tie */
const tenth = (x: number) => Math.round(x * 10) / 10;
export const fmtSecs = (x: number) => tenth(x).toFixed(1);

export function challengeUrl(r: ColdOpenResult, name?: string | null): string {
  const q = new URLSearchParams({ vf: fmtSecs(r.secs), cpr: String(Math.round(r.cpr)) });
  const n = name?.trim().slice(0, NAME_MAX);
  if (n) q.set("n", n);
  return `${siteUrl()}/?${q.toString()}`;
}

/** A challenge from the address bar, or null when there is none or it does not make sense */
export function readChallenge(search: string): Challenge | null {
  const q = new URLSearchParams(search);
  const secs = Number(q.get("vf"));
  const cpr = Number(q.get("cpr") ?? 0);
  if (!Number.isFinite(secs) || secs < 8 || secs > 900) return null;
  const name = (q.get("n") || "").replace(/[<>]/g, "").trim().slice(0, NAME_MAX) || null;
  return { secs: tenth(secs), cpr: Math.max(0, Math.min(100, Math.round(cpr) || 0)), name };
}

/** One line about a result, for the share text and the end screen */
export function resultLine(r: { secs: number; cpr: number }): string {
  return `ROSC ใน ${fmtSecs(r.secs)} วินาที CPR ตรงจังหวะ ${Math.round(r.cpr)}%`;
}

/** How the player did against the friend who sent the link */
export function verdict(mine: ColdOpenResult, them: Challenge): { won: boolean; text: string } {
  const who = them.name ?? "เพื่อน";
  const d = tenth(them.secs - tenth(mine.secs));
  if (d > 0) return { won: true, text: `เร็วกว่า${who} ${d.toFixed(1)} วินาที!` };
  if (d < 0) return { won: false, text: `ช้ากว่า${who} ${(-d).toFixed(1)} วินาที อีกนิดเดียว` };
  // Same time to the tenth: the steadier CPR wins
  const c = Math.round(mine.cpr) - them.cpr;
  if (c > 0) return { won: true, text: `เวลาเท่า${who} แต่ CPR ตรงจังหวะกว่า ชนะ!` };
  if (c < 0) return { won: false, text: `เวลาเท่า${who} แต่${who} CPR ตรงจังหวะกว่านิดนึง` };
  return { won: true, text: `เสมอกับ${who} พอดีเป๊ะ` };
}

export const lineShareUrl = (text: string) => `https://line.me/R/share?text=${encodeURIComponent(text)}`;

export type ShareOutcome = "shared" | "line" | "copied" | "cancelled";

/**
 * Send a link the way the phone wants: the share sheet where there is one (LINE, IG, Messenger are all in it),
 * otherwise LINE's own share page in a new tab, otherwise the clipboard.
 */
export async function shareLink(text: string, url: string): Promise<ShareOutcome> {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (nav?.share) {
    try {
      await nav.share({ text, url });
      return "shared";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
    }
  }
  const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    window.open(lineShareUrl(`${text}\n${url}`), "_blank", "noopener");
    return "line";
  }
  try {
    await nav?.clipboard?.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    window.open(lineShareUrl(`${text}\n${url}`), "_blank", "noopener");
    return "line";
  }
}

export const outcomeNote: Record<ShareOutcome, string | null> = {
  shared: "ส่งแล้ว",
  line: "เปิด LINE ให้แล้ว",
  copied: "คัดลอกลิงก์แล้ว วางในแชทได้เลย",
  cancelled: null,
};
