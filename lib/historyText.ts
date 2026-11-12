/**
 * A case history carries layout marks (scripts/clinical/history_apply.py): " ¦ " starts a line of the present
 * illness, " ¦p " a line of past history, and " || " the teaching note that only shows after the working diagnosis.
 */
export function parseHistory(text?: string): { now: string[]; past: string[]; reading: string } {
  const [body, reading = ""] = String(text ?? "").split(" || ");
  const now: string[] = [], past: string[] = [];
  for (const part of body.split("¦")) {
    const isPast = part.startsWith("p ");
    const line = (isPast ? part.slice(2) : part).trim();
    if (line) (isPast ? past : now).push(line);
  }
  return { now, past, reading: reading.trim() };
}

/** The history as plain running text, without the teaching note */
export function plainHistory(text?: string): string {
  const h = parseHistory(text);
  return [...h.now, ...h.past].join(" ");
}
