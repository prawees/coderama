/**
 * Which patient walks in next. A shift should feel like new people, not the same six on a loop:
 * today's patients the player has never met come first, then any earlier patient they missed,
 * and only after that a condition they have met before, as a review case: someone new under
 * their own name (lib/review.ts), never the same condition twice in one shift.
 * Returns null when the ER has nobody new for today.
 */
export function pickCase(opts: {
  today: string[];
  earlier: string[];
  /** cases already on a bed or already brought in this shift */
  excluded: string[];
  /** every case the player has finished, on any day */
  met: string[];
  random?: () => number;
}): string | null {
  const rnd = opts.random ?? Math.random;
  const free = (list: string[]) => list.filter((c) => !opts.excluded.includes(c));
  const fresh = (list: string[]) => free(list).filter((c) => !opts.met.includes(c));
  for (const tier of [fresh(opts.today), fresh(opts.earlier), free(opts.today)]) {
    if (tier.length) return tier[Math.floor(rnd() * tier.length)];
  }
  return null;
}
