import { useERStore, storyRank } from "@/lib/erStore";
import { getLocalizedRankTitle } from "@/lib/localization";
import { playerLookFrom } from "@/lib/playerLook";
import { phaseForDay } from "@/lib/world/maps";
import { patientFor } from "@/lib/patients";
import { shiftInChapter, chapterOf } from "@/lib/chapters";
import { shiftTitle, doctorType } from "@/lib/shiftTitle";
import type { CardPlayer, CardSpec } from "@/lib/shareCard";
import type { Look } from "@/lib/pixel/characters";

function player(): CardPlayer {
  const st = useERStore.getState();
  const rank = storyRank(st.currentDay, st.lifetimeXp || 0);
  return {
    name: st.playerName,
    rank: getLocalizedRankTitle(rank, st.playerName, st.playerGender, "th"),
    look: playerLookFrom(st.appearance, rank),
  };
}

export function shiftCard(finishedDay: number, fainted: boolean): CardSpec {
  const st = useERStore.getState();
  const patients = st.shiftStats.patients ?? [];
  const grades = patients.map((p) => p.grade);
  const t = shiftTitle(grades, fainted);
  const at = shiftInChapter(finishedDay);
  const left = at ? at.left : 0;
  return {
    kind: "shift",
    day: finishedDay,
    phase: phaseForDay(finishedDay),
    player: player(),
    title: t.title,
    line: t.line,
    saved: st.savedTotal ?? 0,
    streak: st.goodStreak ?? 0,
    treated: st.shiftStats.casesTreated,
    dx: patients.map((p) => patientFor(p.caseId)?.dx.th ?? "").filter(Boolean),
    chapter: at
      ? {
          title: at.chapter.title, n: at.chapter.n, total: at.total, position: at.position,
          next: at.chapter.reward ? (left > 0 ? `อีก ${left} เวร ${at.chapter.reward}` : at.chapter.reward) : undefined,
        }
      : undefined,
  };
}

const VERDICT = {
  clean: { stars: 3, line: "ทำถูกทุกขั้นเลยย คุณทำได้ไหมน้า" },
  minor: { stars: 2, line: "พลาดไปขั้นเดียวเอง ลองมาแข่งกันมั้ย" },
  poor: { stars: 1, line: "คนไข้รอดนะ แต่เราพลาดไปหลายขั้น แง คุณลองดูหน่อย" },
  critical: { stars: 0, line: "เคสนี้เรายังทำได้ไม่ดี ฮือ ถ้าเป็นคุณจะทำไงดี" },
};

export function caseCard(o: { patient: string; by?: string; quote: string; grade: keyof typeof VERDICT; vitals: { label: string; value: string; bad?: boolean }[] }): CardSpec {
  const st = useERStore.getState();
  const v = VERDICT[o.grade];
  return { kind: "case", phase: phaseForDay(st.currentDay), player: player(), patient: o.patient, by: o.by, quote: o.quote, stars: v.stars, verdict: v.line, vitals: o.vitals };
}

/** The doctor's ID card, available at any point in the game */
export function profileCard(): CardSpec {
  const st = useERStore.getState();
  const log = Object.values(st.patientLog ?? {}) as { star?: boolean }[];
  const stars = log.filter((p) => p.star).length;
  const friends = Object.entries(st.friendships ?? {}).filter(([k]) => k !== "cat").reduce((a, [, n]) => a + n, 0);
  const at = shiftInChapter(st.currentDay);
  return {
    kind: "profile", day: st.currentDay, phase: phaseForDay(st.currentDay), player: player(),
    saved: st.savedTotal ?? 0, stars, best: st.bestStreak ?? 0,
    type: doctorType({ stars, patients: log.length, catFriendship: st.friendships?.cat ?? 0, friendTotal: friends, saved: st.savedTotal ?? 0 }),
    chapter: at ? { title: at.chapter.title, n: at.chapter.n, total: at.total, position: at.position - 1,
      next: at.chapter.reward ? `อีก ${at.total - at.position + 1} เวร ${at.chapter.reward}` : undefined } : undefined,
  };
}

export function chapterCard(o: { title: string; promo?: string; host?: Look }): CardSpec {
  const st = useERStore.getState();
  const log = Object.values(st.patientLog ?? {}) as { star?: boolean }[];
  const stars = log.filter((p) => p.star).length;
  const friends = Object.entries(st.friendships ?? {}).filter(([k]) => k !== "cat").reduce((a, [, n]) => a + n, 0);
  const ch = chapterOf(st.currentDay);
  return {
    kind: "chapter", day: st.currentDay, phase: phaseForDay(st.currentDay), player: player(), host: o.host,
    title: o.title, promo: o.promo, saved: st.savedTotal ?? 0, stars, patients: log.length,
    type: doctorType({ stars, patients: log.length, catFriendship: st.friendships?.cat ?? 0, friendTotal: friends, saved: st.savedTotal ?? 0 }),
    chaptersDone: ch ? ch.n - 1 : 6,
  };
}
