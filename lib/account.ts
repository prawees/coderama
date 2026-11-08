"use client";

import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { useERStore } from "./erStore";

/**
 * One cloud save per person, and the public leaderboard row that goes with it.
 *
 * saves/{uid}         the whole persisted game (what localStorage holds), plus a summary
 * leaderboards/{uid}  name, school, day, patients saved, stars, best streak; only if the player opts in
 *
 * When someone signs in and both this device and the cloud hold real progress that differ,
 * nothing is overwritten: the player picks which one to keep (status "conflict").
 */
export interface SaveSummary { day: number; saved: number; name: string; updatedAt: number }
export interface CloudStatus {
  user: User | null;
  phase: "starting" | "signed-out" | "loading" | "synced" | "saving" | "conflict" | "error";
  savedAt?: number;
  conflict?: { local: SaveSummary; cloud: SaveSummary };
  error?: string;
}

let status: CloudStatus = { user: null, phase: "starting" };
const listeners = new Set<(s: CloudStatus) => void>();
const emit = (patch: Partial<CloudStatus>) => { status = { ...status, ...patch }; listeners.forEach((l) => l(status)); };

/** The part of the save that persists, as plain JSON (what Firestore can store) */
function persisted(): Record<string, unknown> {
  const st = useERStore.getState();
  const part = useERStore.persist.getOptions().partialize?.(st) ?? st;
  return JSON.parse(JSON.stringify(part));
}

function summarise(s: any, updatedAt = 0): SaveSummary {
  return { day: Number(s?.currentDay) || 1, saved: Number(s?.savedTotal) || 0, name: String(s?.playerName || ""), updatedAt };
}

/** Real progress, as opposed to a fresh install that has not been played */
export function hasProgress(s: any): boolean {
  return !!s && (Number(s.currentDay) > 1 || Number(s.xp) > 0 || !!s.tutorialCompleted);
}

/**
 * What to do with two saves when someone signs in. Pure, so it can be tested.
 * "same" counts as no conflict: same day and same patients saved.
 */
export function decide(local: any, cloud: any): "upload" | "download" | "same" | "ask" {
  if (!cloud) return "upload";
  if (!hasProgress(local)) return "download";
  if (!hasProgress(cloud)) return "upload";
  const a = summarise(local), b = summarise(cloud);
  if (a.day === b.day && a.saved === b.saved) return "same";
  return "ask";
}

function leaderboardRow(uid: string, s: any) {
  const log = Object.values(s.patientLog ?? {}) as { star?: boolean }[];
  return {
    uid,
    displayName: String(s.playerName || "หมอนิรนาม").slice(0, 20),
    university: String(s.university || "Unknown").slice(0, 20),
    day: Math.max(1, Math.min(400, Math.round(Number(s.currentDay) || 1))),
    savedTotal: Math.max(0, Math.min(5000, Math.round(Number(s.savedTotal) || 0))),
    stars: Math.max(0, Math.min(51, log.filter((p) => p.star).length)),
    bestStreak: Math.max(0, Math.min(5000, Math.round(Number(s.bestStreak) || 0))),
    updatedAt: Date.now(),
  };
}

let lastPushed = "";
let timer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let applying = false;

async function push(uid: string) {
  const state = persisted();
  const body = JSON.stringify(state);
  if (body === lastPushed) return;
  emit({ phase: "saving" });
  try {
    const updatedAt = Date.now();
    await setDoc(doc(db, "saves", uid), { state, summary: summarise(state, updatedAt), updatedAt });
    if (useERStore.getState().leaderboardOptIn !== false && hasProgress(state)) {
      await setDoc(doc(db, "leaderboards", uid), leaderboardRow(uid, state));
    } else {
      await deleteDoc(doc(db, "leaderboards", uid)).catch(() => {});
    }
    lastPushed = body;
    emit({ phase: "synced", savedAt: updatedAt, error: undefined });
  } catch (e: any) {
    emit({ phase: "error", error: String(e?.code || e?.message || e) });
  }
}

function startSaving(uid: string) {
  unsubscribeStore?.();
  unsubscribeStore = useERStore.subscribe(() => {
    if (applying || status.phase === "conflict") return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => push(uid), 4000);
  });
  push(uid);
}

function apply(state: Record<string, unknown>) {
  applying = true;
  useERStore.setState({ ...state, syncEnabled: true } as any);
  applying = false;
  lastPushed = JSON.stringify(persisted());
}

let cloudCopy: Record<string, unknown> | null = null;

async function onSignedIn(user: User) {
  emit({ user, phase: "loading" });
  try {
    const snap = await getDoc(doc(db, "saves", user.uid));
    const cloud = snap.exists() ? (snap.data() as any) : null;
    const local = persisted();
    const choice = decide(local, cloud?.state);
    if (choice === "download") apply(cloud.state);
    if (choice === "ask") {
      cloudCopy = cloud.state;
      emit({ phase: "conflict", conflict: { local: summarise(local, Date.now()), cloud: summarise(cloud.state, cloud.updatedAt) } });
      return;
    }
    useERStore.setState({ syncEnabled: true });
    startSaving(user.uid);
  } catch (e: any) {
    emit({ phase: "error", error: String(e?.code || e?.message || e) });
  }
}

/** The player's answer to a conflict: keep this device's game, or bring the cloud one down */
export function resolveConflict(keep: "local" | "cloud") {
  const user = status.user;
  if (!user || status.phase !== "conflict") return;
  if (keep === "cloud" && cloudCopy) apply(cloudCopy);
  cloudCopy = null;
  emit({ conflict: undefined, phase: "loading" });
  useERStore.setState({ syncEnabled: true });
  startSaving(user.uid);
}

let started = false;
export function startAccount() {
  if (started || typeof window === "undefined") return;
  started = true;
  onAuthStateChanged(auth, (user) => {
    if (user) onSignedIn(user);
    else {
      unsubscribeStore?.();
      unsubscribeStore = null;
      lastPushed = "";
      useERStore.setState({ syncEnabled: false });
      emit({ user: null, phase: "signed-out", conflict: undefined, savedAt: undefined });
    }
  });
}

/** Signing out keeps the game on this device; it only stops saving to the cloud */
export async function signOut() {
  if (timer) clearTimeout(timer);
  if (status.user && status.phase !== "conflict") await push(status.user.uid);
  await fbSignOut(auth);
}

/** Save straight away, e.g. after changing the leaderboard setting */
export function saveNow() { if (status.user && status.phase !== "conflict") push(status.user.uid); }

export function useCloud(): CloudStatus {
  const [s, set] = useState(status);
  useEffect(() => { listeners.add(set); set(status); return () => { listeners.delete(set); }; }, []);
  return s;
}
