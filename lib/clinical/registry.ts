/**
 * CODE RAMA - Case registry: built-in story cases plus custom (designer) cases.
 */
import { BUILTIN_RAW } from './builtinCases';
import { buildClinicalCase, ClinicalCase, Lang } from './model';
import { ACTION_CATALOG, CatalogAction } from './catalog';

export function builtinIds(): string[] { return Object.keys(BUILTIN_RAW.en).sort(); }
export function getBuiltinRaw(id: string, lang: Lang): any | undefined {
  return BUILTIN_RAW[lang]?.[id] || BUILTIN_RAW.en[id];
}

// Case-specific actions from other cases act as realistic distractors, so a
// case's own authored steps never stand out in the treatment menu.
let distractorPool: CatalogAction[] | null = null;
function pool(): CatalogAction[] {
  if (distractorPool) return distractorPool;
  const lib = new Set(ACTION_CATALOG.map((a) => a.name));
  const seen = new Map<string, CatalogAction>();
  for (const id of builtinIds()) {
    const c = buildClinicalCase(id, BUILTIN_RAW.en[id]);
    c.actions.filter((a) => !lib.has(a.name) && a.name.length < 70 && !/^(no|avoid|stop|discontinue|withhold)\b/i.test(a.name)).forEach((a) => seen.set(a.name, a));
  }
  distractorPool = Array.from(seen.values());
  return distractorPool;
}
function seeded(id: string) {
  let h = 2166136261; for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}
export function withDistractors(c: ClinicalCase, n = 40): ClinicalCase {
  const rand = seeded(c.id);
  const have = new Set(c.actions.map((a) => a.name));
  const extra = pool().filter((a) => !have.has(a.name)).map((a) => ({ a, r: rand() })).sort((x, y) => x.r - y.r).slice(0, n).map((x) => x.a);
  return { ...c, actions: [...c.actions, ...extra] };
}

export function loadBuiltinCase(id: string, lang: Lang): ClinicalCase | null {
  const raw = getBuiltinRaw(id, lang);
  return raw ? withDistractors(buildClinicalCase(id, raw)) : null;
}

/** Shuffled differential list for the diagnosis panel (stable per case). */
export function differentialOptions(c: ClinicalCase): string[] {
  const rand = seeded(c.id + ':dx');
  return [...c.diagnoses].map((d) => ({ d, r: rand() })).sort((a, b) => a.r - b.r).map((x) => x.d);
}
