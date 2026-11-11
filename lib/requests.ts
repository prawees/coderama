import { NPCS, rosterOn } from "./npcs";
import { GIFTS } from "./gifts";
import { phaseForDay, Phase } from "./world/maps";

/**
 * One small request pinned to the notice board each day, like a help-wanted board.
 * Gift runs and team chats build friendships; the clean-case request rewards getting
 * every step right. Requests start on day 2 so the first shift is only the starter quests.
 */
export type RequestKind = "gift" | "clean" | "social" | "kanom";

export interface DailyRequest {
  day: number;
  kind: RequestKind;
  /** Who pinned it, for friendship and the signature on the note */
  npcId: string;
  giftId?: string;
  /** The note as pinned on the board */
  note: string;
  /** Short goal for the quest log */
  goal: string;
  cash: number;
  xp: number;
  /** Friendship points for whoever pinned it */
  friend: number;
}

const CYCLE: RequestKind[] = ["gift", "clean", "social", "gift", "kanom", "clean", "gift", "social"];

/** The senior doctor and the charge nurse each place has, who pin the work requests */
const SENIOR: Record<Phase, string> = { rama1: "bob", korat: "ek", lovely: "nam", rama2: "bob" };
const CHARGE: Record<Phase, string> = { rama1: "ann", korat: "jai", lovely: "kai", rama2: "ann" };

const DRINKS = ["thai_tea", "coffee", "energy_drink"];
const FOODS = ["khanom_krok", "mango_sticky_rice", "durian", "dried_fish"];

function wantVerb(giftId: string) {
  if (DRINKS.includes(giftId)) return "อยากดื่ม";
  if (FOODS.includes(giftId)) return "อยากกิน";
  return "อยากได้";
}

export function requestFor(day: number): DailyRequest | null {
  if (day < 2 || day > 31) return null;
  const phase = phaseForDay(day);
  const kind = CYCLE[(day - 2) % CYCLE.length];
  if (kind === "gift") {
    // gift runs take turns around everyone working there
    const here = rosterOn(day, phase);
    let earlier = 0;
    for (let d = 2; d < day; d++) if (phaseForDay(d) === phase && CYCLE[(d - 2) % CYCLE.length] === "gift") earlier++;
    const npc = NPCS[here[earlier % here.length].id];
    const wants = [...npc.loves, ...npc.likes].filter((g) => GIFTS[g]);
    const giftId = wants[(day * 3) % wants.length];
    const gift = GIFTS[giftId];
    return {
      day, kind, npcId: npc.id, giftId,
      note: `${npc.name.th}: "วันนี้${wantVerb(giftId)}${gift.name.th}มาก ใครแวะห้องเก็บของ ฝากหน่อยนะ"`,
      goal: `เอา${gift.name.th}ไปให้${npc.name.th}`,
      cash: gift.cost * 2 + 40, xp: 0, friend: 10,
    };
  }
  if (kind === "clean") {
    const npc = NPCS[SENIOR[phase]];
    return {
      day, kind, npcId: npc.id,
      note: `${npc.name.th}: "ขอสักเคสวันนี้ที่ทำถูกทุกขั้น ไม่ต้องเร็ว ขอให้ถูก"`,
      goal: "ดูแลคนไข้ให้ถูกทุกขั้นหนึ่งคน",
      cash: 120, xp: 25, friend: 6,
    };
  }
  if (kind === "social") {
    const npc = NPCS[CHARGE[phase]];
    return {
      day, kind, npcId: npc.id,
      note: `${npc.name.th}: "ทีมเราเหนื่อยกันมาหลายวัน วันนี้แวะทักทายทุกคนหน่อยนะ"`,
      goal: "คุยกับทุกคนในทีมวันนี้",
      cash: 80, xp: 10, friend: 6,
    };
  }
  const npc = NPCS[CHARGE[phase]];
  return {
    day, kind, npcId: npc.id, giftId: "dried_fish",
    note: `${npc.name.th}: "ขนมไม่ยอมกินข้าวมาสองมื้อแล้ว ใครมีปลาแห้ง ช่วยเอาไปให้หน่อย"`,
    goal: "ให้ปลาแห้งกับขนม",
    cash: 60, xp: 0, friend: 4,
  };
}

/** Everyone working at the place that day, for the social request */
export function teamFor(day: number): string[] {
  return rosterOn(day, phaseForDay(day)).map((r) => r.id);
}
