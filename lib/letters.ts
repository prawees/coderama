import { PATIENTS } from "./patients";

type Log = Record<string, { day: number; good: boolean; letterRead: boolean }>;

/** Letters arrive the morning after a good outcome, for patients who write back */
export function arrivedLetters(log: Log, today: number): string[] {
  return Object.entries(log)
    .filter(([id, r]) => r.good && r.day < today && PATIENTS[id]?.letter)
    .sort(([, a], [, b]) => b.day - a.day)
    .map(([id]) => id);
}

export function unreadLetters(log: Log, today: number): string[] {
  return arrivedLetters(log, today).filter((id) => !log[id].letterRead);
}
