import { useERStore } from "./erStore";
import { GIFTS } from "./gifts";

/**
 * Two tiny games of luck. The capsule machine at the supply closet (กาชาปอง) and the fortune
 * sticks under the courtyard tree (เซียมซี, once a day). Small prizes only, nothing that matters
 * to the cases: they are there for a laugh between patients.
 */
export const GACHA_COST = 30;

export type Prize = { kind: "gift"; giftId: string; rare: boolean } | { kind: "coins"; amount: number } | { kind: "energy"; amount: number };

const COMMON = ["thai_tea", "energy_drink", "khanom_krok", "dried_fish", "coffee"];
const RARE = ["durian", "handbook", "orchid", "mango_sticky_rice", "garland"];

export function rollGacha(rand = Math.random): Prize {
  const r = rand();
  if (r < 0.02) return { kind: "coins", amount: 300 };                                   // jackpot
  if (r < 0.17) return { kind: "gift", giftId: RARE[Math.floor(rand() * RARE.length)], rare: true };
  if (r < 0.25) return { kind: "energy", amount: 20 };
  if (r < 0.55) return { kind: "coins", amount: 10 + Math.floor(rand() * 6) * 10 };
  return { kind: "gift", giftId: COMMON[Math.floor(rand() * COMMON.length)], rare: false };
}

/** Spend the coins and hand over the prize. Returns null when the player cannot afford a turn. */
export function playGacha(): Prize | null {
  const st = useERStore.getState();
  if (st.currency < GACHA_COST) return null;
  const prize = rollGacha();
  useERStore.setState({ currency: st.currency - GACHA_COST + (prize.kind === "coins" ? prize.amount : 0) });
  if (prize.kind === "gift") st.receiveGift(prize.giftId);
  if (prize.kind === "energy") st.restoreEnergy(prize.amount);
  return prize;
}

export function prizeText(p: Prize) {
  if (p.kind === "coins") return p.amount >= 300 ? `แจ็กพอต! ได้ ${p.amount} เหรียญ` : `ได้เหรียญคืน ${p.amount} เหรียญ`;
  if (p.kind === "energy") return `ลูกอมกาแฟ ฟื้นพลังงาน ${p.amount}`;
  return `${p.rare ? "ของหายาก! " : ""}ได้${GIFTS[p.giftId]?.name.th ?? p.giftId}`;
}

/** เซียมซี: twelve sticks, each with a ward fortune and sometimes a small blessing */
export const FORTUNES: { n: number; text: string; gift?: { coins?: number; energy?: number; xp?: number } }[] = [
  { n: 1, text: "ใบที่ 1 ดีมาก วันนี้ IV ติดตั้งแต่เข็มแรก", gift: { xp: 15 } },
  { n: 2, text: "ใบที่ 2 ดี ญาติคนไข้จะเอาขนมมาฝาก", gift: { energy: 10 } },
  { n: 3, text: "ใบที่ 3 พอใช้ แล็บจะออกช้า แต่ออกครบ" },
  { n: 4, text: "ใบที่ 4 ดี เจอเหรียญตกอยู่ใต้รถเข็นยา", gift: { coins: 20 } },
  { n: 5, text: "ใบที่ 5 ระวัง ห้ามพูดคำว่าเงียบ วันนี้ยิ่งห้ามกว่าทุกวัน" },
  { n: 6, text: "ใบที่ 6 ดีมาก อาจารย์อารมณ์ดี ราวด์จบก่อนเที่ยง", gift: { xp: 15 } },
  { n: 7, text: "ใบที่ 7 พอใช้ printer ห้องยาจะกระดาษติดสองรอบ" },
  { n: 8, text: "ใบที่ 8 ดี ขนมจะมานอนตัก ห้ามลุก", gift: { energy: 10 } },
  { n: 9, text: "ใบที่ 9 ปานกลาง เวรนี้ได้กินข้าว แต่เย็นแล้ว" },
  { n: 10, text: "ใบที่ 10 ดีมาก คนไข้ที่เคยดูแลจะส่งจดหมายมาขอบคุณ", gift: { coins: 30 } },
  { n: 11, text: "ใบที่ 11 ระวัง ultrasound เครื่องซ้ายยังเจอนิ่วทุกถุงน้ำดีเหมือนเดิม" },
  { n: 12, text: "ใบที่ 12 ดีที่สุด ทั้งเวรไม่มีใครโค้ด", gift: { xp: 20, energy: 10 } },
];

/** Shake once a day. Returns the fortune, or null if today's stick has already fallen. */
export function shakeFortune(day: number): (typeof FORTUNES)[number] | null {
  const st = useERStore.getState();
  if (st.propDaily?.siamsi === day) return null;
  const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
  useERStore.setState({ propDaily: { ...(st.propDaily ?? {}), siamsi: day } });
  if (f.gift?.coins) useERStore.setState({ currency: useERStore.getState().currency + f.gift.coins });
  if (f.gift?.energy) st.restoreEnergy(f.gift.energy);
  if (f.gift?.xp) st.addXp(f.gift.xp);
  return f;
}
