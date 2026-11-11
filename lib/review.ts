import { PATIENTS } from "./patients";

/**
 * There are 51 cases and about three patients a shift for 31 shifts, so some conditions
 * come round again. When one does, it is someone new with the same condition, the way an
 * ER sees dengue or DKA many times a year: a review case. They get their own name, so the
 * person you already sent home (and who may have written to you) does not walk back in.
 */

/** Sex of each case's patient, from the case files (checked by scripts/validate-cases.mjs) */
export const CASE_SEX: Record<string, "M" | "F"> = {
  case_01: "M", case_02_fluids: "F", case_03_cardiac: "M", case_04_svt: "F", case_05_asthma: "M", case_06_trauma: "M",
  case_07: "F", case_07_vip: "M", case_08: "M", case_09: "F", case_10: "M", case_11: "F", case_12: "M", case_13: "M",
  case_14: "M", case_15: "F", case_16: "F", case_17: "M", case_18: "F", case_19: "M", case_20: "M", case_21: "M",
  case_22: "M", case_23: "F", case_24: "F", case_25: "F", case_26: "M", case_27: "M", case_28: "M", case_29: "M",
  case_30: "F", case_31: "M", case_32: "M", case_33: "M", case_34: "F", case_35: "F", case_36: "F", case_37: "M",
  case_38: "M", case_39: "M", case_40: "F", case_41: "F", case_42: "M", case_43: "M", case_44: "M", case_45: "M",
  case_46: "M", case_47: "F", case_48: "F", case_49: "M", case_50: "M",
};

const PREFIXES = ["คุณ", "ลุง", "ป้า", "น้อง", "ยาย", "ตา", "พี่", "โก"];
// Given names for adults, nicknames for the young ones called น้อง
const MEN = ["ประยูร", "สุรเชษฐ์", "วีระ", "อนุชา", "ธนพล", "พงศ์ศักดิ์", "สมพงษ์", "เกรียงไกร"];
const WOMEN = ["วันเพ็ญ", "สุนีย์", "กาญจนา", "พรทิพย์", "อรุณี", "ศิริพร", "ปราณี", "รัตนา"];
const BOYS = ["ภูมิ", "นนท์", "เต้ย", "ฟลุ๊ค", "ปั๊บ", "ก้อง"];
const GIRLS = ["ใบเตย", "น้ำหวาน", "ขิม", "ฟ้า", "เมย์", "ปิ่น"];

function split(name: string) {
  const prefix = PREFIXES.find((x) => name.startsWith(x)) ?? "";
  return { prefix, given: name.slice(prefix.length) };
}

/** A new person with the same condition: same title (ลุง, ป้า, น้อง...) and sex, a different name */
export function reviewName(caseId: string, seed: number): string {
  const p = PATIENTS[caseId];
  if (!p) return "คนไข้";
  const { prefix, given } = split(p.name.th);
  const young = prefix === "น้อง";
  const female = CASE_SEX[caseId] === "F";
  const pool = (young ? (female ? GIRLS : BOYS) : (female ? WOMEN : MEN)).filter((n) => n !== given);
  return (prefix || "คุณ") + pool[Math.abs(seed) % pool.length];
}

/** The companion's words on the patient card, with the review patient's name in place of the original */
export function reviewQuote(caseId: string, alias: string): string {
  const p = PATIENTS[caseId];
  if (!p) return "";
  const { given } = split(p.name.th);
  const { given: aliasGiven } = split(alias);
  return given ? p.quote.th.split(given).join(aliasGiven) : p.quote.th;
}
