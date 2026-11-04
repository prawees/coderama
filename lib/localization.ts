import { Rank } from './erStore';

export const getLocalizedRankTitle = (
  rank: Rank,
  name: string,
  gender: 'M' | 'F' | 'O',
  lang: 'en' | 'th'
): string => {
  if (lang === 'en') {
    switch (rank) {
      case 'MS5': return `MS5 ${name}`;
      case 'MS6': return `MS6 ${name}`;
      case 'Intern': return `Intern ${name}`;
      case 'R1': return `R1 ${name}`;
      case 'R2': return `R2 ${name}`;
      case 'R3': return `R3 ${name}`;
      case 'Asst. Prof': return `Asst. Prof ${name}`;
      case 'Assoc. Prof': return `Assoc. Prof ${name}`;
      case 'Prof': return `Prof ${name}`;
      default: return `${rank} ${name}`;
    }
  }

  // Thai Logic
  const titlePrefix = gender === 'F' ? 'พญ.' : gender === 'M' ? 'นพ.' : '';

  switch (rank) {
    case 'MS5': return `นศพ. ${name} ปี 5`;
    case 'MS6': return `extern ${name}`;
    case 'Intern': return `intern ${name}`;
    case 'R1': return `R1 ${name}`;
    case 'R2': return `R2 ${name}`;
    case 'R3': return `R3 ${name}`;
    case 'Asst. Prof': return `ผศ.${titlePrefix} ${name}`;
    case 'Assoc. Prof': return `รศ.${titlePrefix} ${name}`;
    case 'Prof': return `ศ.${titlePrefix} ${name}`;
    default: return `${rank} ${name}`;
  }
};

/** Rank as a ward would say it, without a name: "R1", "intern", "ผศ." */
export const RANK_SHORT_TH: Record<string, string> = {
  MS5: "นศพ. ปี 5", MS6: "extern", Intern: "intern", "Asst. Prof": "ผศ.", "Assoc. Prof": "รศ.", Prof: "ศ.",
};

/** Medical school as stored in the save, shown the way students say it */
export const UNIVERSITY_TH: Record<string, string> = {
  Rama: "รามาธิบดี", Siriraj: "ศิริราช", Chula: "จุฬาฯ", ChiangMai: "เชียงใหม่", KhonKaen: "ขอนแก่น", Other: "ที่อื่น",
};
export const universityTh = (u?: string) => (u ? UNIVERSITY_TH[u] ?? u : "");

export const translate = (key: string, lang: 'en' | 'th'): string => {
  const dict: Record<string, { en: string, th: string }> = {
    'hub_title': { en: 'ER CENTRAL COMMAND', th: 'ศูนย์ควบคุมฉุกเฉิน' },
    'start_shift': { en: 'START SHIFT', th: 'เริ่มกะเวร' },
    'on_shift': { en: 'ON SHIFT', th: 'กำลังเข้ากะ' },
    'end_shift': { en: 'END SHIFT', th: 'ออกเวร' },
    'shop': { en: 'SHOP', th: 'ร้านค้า' },
    'skills': { en: 'SKILLS', th: 'ทักษะ' },
    'patients': { en: 'PATIENTS WAITING', th: 'ผู้ป่วยที่รอ' },
    'cash': { en: 'CASH', th: 'เงิน' },
    'energy': { en: 'ENERGY', th: 'พลังงาน' },
    'lifetime_xp': { en: 'LIFETIME XP', th: 'XP รวม' },
    'current_rank': { en: 'RANK', th: 'ยศ' },
  };

  return dict[key]?.[lang] || key;
};
