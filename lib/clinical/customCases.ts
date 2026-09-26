"use client";
/**
 * CODE RAMA - Custom case storage ("mod engine").
 *
 * Cases authored in the designer are Porames CaseData objects. They are saved
 * locally first (works offline and without an account), and to Firestore
 * `simulations` when the author is signed in. JSON export/import lets
 * faculty share cases as files.
 */
import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, limit, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export interface StoredCase { id: string; title: string; updatedAt: number; cloudId?: string; data: any; }
const KEY = "coderama.customCases.v1";

function readAll(): Record<string, StoredCase> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function writeAll(all: Record<string, StoredCase>) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { console.error("Custom case save failed (storage full?)", e); throw e; }
}

export function listLocalCases(): StoredCase[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}
export function getLocalCase(id: string): StoredCase | undefined { return readAll()[id]; }

export function saveLocalCase(data: any, id?: string, cloudId?: string): StoredCase {
  const all = readAll();
  const cid = id || `local_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const rec: StoredCase = { id: cid, title: data.title || "Untitled case", updatedAt: Date.now(), cloudId: cloudId ?? all[cid]?.cloudId, data };
  all[cid] = rec; writeAll(all);
  return rec;
}
export function deleteLocalCase(id: string) { const all = readAll(); delete all[id]; writeAll(all); }

function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj && typeof obj === "object" && !(obj as any).toDate && !(obj as any).isEqual) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) if (v !== undefined) clean[k] = stripUndefined(v);
    return clean;
  }
  return obj;
}

/** Publish to Firestore when signed in. Returns the cloud id, or null when offline / signed out. */
export async function publishCloud(data: any, cloudId?: string): Promise<string | null> {
  if (!auth.currentUser) return null;
  const payload = stripUndefined({ ...data, createdBy: auth.currentUser.uid, updatedAt: serverTimestamp() }) as Record<string, unknown>;
  if (cloudId) { await setDoc(doc(db, "simulations", cloudId), payload); return cloudId; }
  const ref = await addDoc(collection(db, "simulations"), payload);
  return ref.id;
}
export async function listCloudCases(max = 50): Promise<{ id: string; title: string }[]> {
  try {
    const snap = await getDocs(query(collection(db, "simulations"), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, title: (d.data() as any).title || "Untitled case" }));
  } catch { return []; }
}
export async function getCloudCase(id: string): Promise<any | null> {
  try { const s = await getDoc(doc(db, "simulations", id)); return s.exists() ? s.data() : null; } catch { return null; }
}

export function exportCaseFile(rec: { title: string; data: any }) {
  const blob = new Blob([JSON.stringify({ format: "coderama-case", version: 1, case: rec.data }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(rec.title || "case").replace(/[^\w฀-๿-]+/g, "_").slice(0, 60)}.coderama.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export async function importCaseFile(file: File): Promise<StoredCase> {
  const json = JSON.parse(await file.text());
  const data = json?.format === "coderama-case" ? json.case : json;
  if (!data || typeof data !== "object" || !("title" in data) || !("managementGraph" in data)) throw new Error("Not a Code Rama case file.");
  return saveLocalCase(data);
}
