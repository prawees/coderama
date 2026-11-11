import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useERStore, storyRank } from "./erStore";
import { auth } from "./firebase";

/**
 * Player feedback goes to Firestore `feedback`, create only (see firestore.rules). Nobody can read it from the game;
 * the team reads it in the Firebase console (Firestore, collection "feedback"). No email and no free contact field.
 */

export const LIKES = ["เรื่องราว", "เคสคนไข้", "CPR", "ตัวละคร", "แมว", "ภาพกับเพลง", "การ์ดแชร์"] as const;
export const FIXES = ["ยากไป", "ง่ายไป", "ตัวหนังสือเยอะ", "งง ไม่รู้ต้องทำอะไร", "เจอบั๊ก", "ช้า กระตุก"] as const;

export type FeedbackWhere = "summary" | "menu" | "settings";

/** Shifts after which the summary asks, once each */
export const ASK_AFTER_DAYS = [1, 5, 10, 20, 31];

const askedKey = (day: number) => `coderama.feedbackAsked.${day}`;
export const alreadyAsked = (day: number) => { try { return !!localStorage.getItem(askedKey(day)); } catch { return true; } };
export const markAsked = (day: number) => { try { localStorage.setItem(askedKey(day), "1"); } catch { /* private mode */ } };

function device(): "ios" | "android" | "desktop" {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export async function sendFeedback(f: { rating: number; likes: string[]; fixes: string[]; text: string; where: FeedbackWhere }) {
  const st = useERStore.getState();
  await addDoc(collection(db, "feedback"), {
    rating: Math.max(1, Math.min(5, Math.round(f.rating))),
    likes: f.likes.filter((x) => (LIKES as readonly string[]).includes(x)).slice(0, LIKES.length),
    fixes: f.fixes.filter((x) => (FIXES as readonly string[]).includes(x)).slice(0, FIXES.length),
    text: f.text.trim().slice(0, 600),
    where: f.where,
    day: Math.max(1, Math.min(400, st.currentDay || 1)),
    rank: storyRank(st.currentDay || 1, st.lifetimeXp || 0).slice(0, 20),
    school: String(st.university || "").slice(0, 20),
    device: device(),
    uid: auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
  });
}
