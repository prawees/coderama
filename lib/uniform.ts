import type { Rank } from "./erStore";

/**
 * What each year wears on the ward, like a real faculty dress code: year 5 a long white coat with
 * short sleeves, externs the short coat, interns and residents may also wear scrubs, and attendings
 * the long-sleeved long coat. The rest stay locked until the rank that earns them.
 */
export type UniformId = "gown_long" | "gown_short" | "scrubs" | "gown_sleeves";

export const UNIFORMS: { id: UniformId; label: string }[] = [
  { id: "gown_long", label: "กาวน์ยาว" },
  { id: "gown_short", label: "กาวน์สั้น" },
  { id: "scrubs", label: "สครับ" },
  { id: "gown_sleeves", label: "กาวน์แขนยาว" },
];

const STAFF: Rank[] = ["Asst. Prof", "Assoc. Prof", "Prof"];

export function allowedUniforms(rank: Rank): UniformId[] {
  if (rank === "MS5") return ["gown_long"];
  if (rank === "MS6") return ["gown_short"];
  if (STAFF.includes(rank)) return ["gown_long", "scrubs", "gown_sleeves"];
  return ["gown_long", "scrubs"];
}

/** Why a uniform is locked for this rank, said the way a senior would */
export function lockNote(id: UniformId, rank: Rank): string {
  if (id === "gown_short") return "กาวน์สั้นใส่ตอนเป็น extern ปี 6";
  if (id === "gown_long") return "extern ใส่กาวน์สั้นนะ กาวน์ยาวได้ใส่อีกทีตอนเป็น intern";
  if (id === "scrubs") return "สครับได้ใส่ตอนเป็น intern";
  return rank === "MS5" || rank === "MS6" ? "กาวน์แขนยาวสำหรับอาจารย์" : "กาวน์แขนยาวได้ใส่ตอนเป็นอาจารย์";
}

/** The uniform actually worn: the player's pick if their rank allows it, else what their year wears */
export function uniformFor(rank: Rank, picked?: string): UniformId {
  const ok = allowedUniforms(rank);
  const legacy = picked === "top_2" ? "scrubs" : picked === "top_1" ? "gown_long" : picked;
  return ok.includes(legacy as UniformId) ? (legacy as UniformId) : ok[0];
}
