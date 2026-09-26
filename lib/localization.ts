import { Rank } from './erStore';
import { tr, Lang } from './i18n/dictionary';

/**
 * Rank + name → localized title.
 * Thai uses real ward address forms: นศพ. (student), Ext., Int. (แพทย์เพิ่มพูนทักษะ),
 * and นพ./พญ. honorifics for staff grades.
 */
export const getLocalizedRankTitle = (
  rank: Rank,
  name: string,
  gender: 'M' | 'F' | 'O',
  lang: Lang
): string => {
  if (lang === 'en') {
    return `${rank} ${name}`;
  }
  const titlePrefix = gender === 'F' ? 'พญ.' : 'นพ.';
  switch (rank) {
    case 'MS5': return `นศพ. ${name} ปี 5`;
    case 'MS6': return `Ext. ${name}`;
    case 'Intern': return `Int. ${name}`;
    case 'R1': return `R1 ${name}`;
    case 'R2': return `R2 ${name}`;
    case 'R3': return `R3 ${name}`;
    case 'Asst. Prof': return `ผศ.${titlePrefix} ${name}`;
    case 'Assoc. Prof': return `รศ.${titlePrefix} ${name}`;
    case 'Prof': return `ศ.${titlePrefix} ${name}`;
    default: return `${rank} ${name}`;
  }
};

/**
 * Legacy shim. Old call sites used short keys ('start_shift'); they now map to
 * the central dictionary. New code should import useT() from lib/i18n/useT.
 */
const LEGACY_ALIASES: Record<string, string> = {
  hub_title: 'hub.title',
  start_shift: 'hub.start_shift',
  on_shift: 'hub.on_shift',
  end_shift: 'hub.end_shift',
  shop: 'nav.shop',
  skills: 'nav.quests',
  patients: 'hub.triage_queue',
  cash: 'hub.cash',
  energy: 'hub.energy',
  lifetime_xp: 'hub.lifetime_xp',
  current_rank: 'hub.rank',
  pager_on: 'hub.pager_on',
  pager_off: 'hub.pager_off',
};

export const translate = (key: string, lang: Lang): string =>
  tr(LEGACY_ALIASES[key] ?? key, lang);
