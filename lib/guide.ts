import type { ERState } from "./erStore";
import { requestFor } from "./requests";
import type { MarkTarget } from "@/components/game/ClinicWorld";

/**
 * A short quest log for the first days, so a new player always knows the next thing to do.
 * Each step names one action, points at it in the world where it can, and ticks itself off
 * when the save shows it happened. After day 4 the guide is gone.
 */
export interface GuideStep {
  id: string;
  days: [number, number];
  /** "off" before the shift, "on" during it */
  when: "off" | "on";
  text: string;
  target?: (day: number) => MarkTarget;
  done: (st: ERState, day: number) => boolean;
}

const talked = (st: ERState, id: string, day: number) => st.npcDaily?.[id]?.talkDay === day;
const ev = (st: ERState, id: string) => (st.guide ?? []).includes(`ev:${id}`);

export const GUIDE: GuideStep[] = [
  { id: "ann", days: [1, 1], when: "off", text: "ทักพี่แอน หัวหน้าเวร แตะที่ตัวพี่เขาได้เลย",
    target: () => ({ npc: "ann" }), done: (st, d) => talked(st, "ann", d) || (st.friendships?.ann ?? 0) > 0 },
  { id: "somchai", days: [1, 1], when: "off", text: "อ.สมชาย ยืนรออยู่ แวะไปสวัสดีอาจารย์หน่อย",
    target: () => ({ npc: "somchai" }), done: (st) => (st.heartEventsSeen ?? []).includes("somchai:meet") || !!st.myStethoscope },
  { id: "steth", days: [1, 1], when: "off", text: "ไปห้องเก็บของ เลือกสีและสลักชื่อ stethoscope ของตัวเอง",
    target: () => ({ tile: [14, 7] }), done: (st) => !!st.myStethoscope },
  { id: "start", days: [1, 1], when: "off", text: "พร้อมแล้ว กดปุ่ม เริ่มเวร ด้านล่าง",
    done: (st) => st.shiftMode !== "off-duty" || (st.shiftStats?.casesTreated ?? 0) > 0 },
  { id: "patient", days: [1, 1], when: "on", text: "เพจเจอร์ดังแล้ว แตะชื่อคนไข้ที่แถบเตียงด้านล่าง",
    done: (st) => (st.shiftStats?.casesTreated ?? 0) > 0 },
  { id: "board", days: [2, 3], when: "off", text: "แวะอ่านบอร์ดประกาศ มีงานฝากไว้",
    target: () => ({ tile: [11, 1] }), done: (st) => ev(st, "board") },
  { id: "shop", days: [2, 3], when: "off", text: "แวะห้องเก็บของ ซื้อของฝากติดมือไว้สักชิ้น",
    target: () => ({ tile: [14, 7] }), done: (st) => Object.values(st.gifts ?? {}).some((n) => Number(n) > 0) || ev(st, "gift") },
  { id: "gift", days: [2, 3], when: "off", text: "เอาของไปให้คนที่ขอไว้บนบอร์ด",
    target: (day) => { const r = requestFor(day); return { npc: r?.kind === "gift" ? r.npcId : "ann" }; },
    done: (st, d) => ev(st, "gift") || Object.values(st.npcDaily ?? {}).some((x) => (x as { giftDay?: number })?.giftDay === d) },
  { id: "casebook", days: [3, 4], when: "off", text: "เปิดสมุดเคสจากปุ่มภารกิจ ดูคนไข้ที่เคยดูแล",
    done: (st) => ev(st, "casebook") },
  { id: "cat", days: [3, 4], when: "off", text: "ลูบหัวขนม แมวประจำแผนก ช่วยฟื้นแรงได้นะ",
    target: () => ({ npc: "cat" }), done: (st, d) => talked(st, "cat", d) || (st.friendships?.cat ?? 0) > 0 },
];

/** Today's steps for this moment in the day, in order */
export function guideSteps(st: ERState, onShift: boolean) {
  const day = st.currentDay;
  if (day > 4) return [];
  return GUIDE.filter((g) => day >= g.days[0] && day <= g.days[1] && (g.when === "on") === onShift);
}
