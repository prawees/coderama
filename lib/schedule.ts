/**
 * Which patient walks in next. A shift should feel like new people, not the same six on a loop:
 * today's patients the player has never met come first, then any earlier patient they missed,
 * and only after that a condition they have met before, as a review case: someone new under
 * their own name (lib/review.ts), never the same condition twice in one shift. Reviews draw on
 * every condition met so far, the one seen longest ago first, so they rotate like spaced
 * repetition instead of cycling the few cases the story lists for that day.
 * Returns null when there is nobody to bring in.
 */
export function pickCase(opts: {
  today: string[];
  earlier: string[];
  /** cases already on a bed or already brought in this shift */
  excluded: string[];
  /** every case the player has finished, on any day */
  met: string[];
  /** day each case was last brought in, for choosing which review comes next */
  lastSeen?: Record<string, number>;
  random?: () => number;
}): string | null {
  const rnd = opts.random ?? Math.random;
  const free = (list: string[]) => list.filter((c) => !opts.excluded.includes(c));
  const fresh = (list: string[]) => free(list).filter((c) => !opts.met.includes(c));
  for (const tier of [fresh(opts.today), fresh(opts.earlier)]) {
    if (tier.length) return tier[Math.floor(rnd() * tier.length)];
  }
  const pool = Array.from(new Set(free([...opts.today, ...opts.earlier]))).filter((c) => opts.met.includes(c));
  if (!pool.length) return null;
  const seen = (c: string) => opts.lastSeen?.[c] ?? 0;
  const oldest = Math.min(...pool.map(seen));
  const due = pool.filter((c) => seen(c) === oldest);
  return due[Math.floor(rnd() * due.length)];
}
