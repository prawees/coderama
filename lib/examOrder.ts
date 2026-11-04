/**
 * Physical exam order: findings are grouped the way students present them (ABCDE), and each
 * system maps to the body region that opens it from the 3D bedside. Works on the shipped system names
 * ("Cardiovascular") and on the designer's exam items ("Auscultation: heart sounds").
 */
export type ExamSection = "G" | "A" | "B" | "C" | "D" | "E";
export type BodyRegion = "head" | "chest" | "abdomen" | "limbs";

export const SECTION_LABEL: Record<ExamSection, string> = {
  G: "ดูภาพรวม",
  A: "A: Airway",
  B: "B: Breathing",
  C: "C: Circulation",
  D: "D: Disability (neuro)",
  E: "E: Exposure",
};
export const SECTION_ORDER: ExamSection[] = ["G", "A", "B", "C", "D", "E"];

export const REGION_LABEL: Record<BodyRegion, string> = { head: "ศีรษะ คอ", chest: "ทรวงอก", abdomen: "ท้อง", limbs: "แขนขา ผิวหนัง" };
export const REGIONS: BodyRegion[] = ["head", "chest", "abdomen", "limbs"];

export function sectionOf(system: string): ExamSection {
  const s = system || "";
  if (/general/i.test(s)) return "G";
  if (/neuro|gcs|glasgow|pupil|lateralis|mening|glucose|dtx/i.test(s)) return "D";
  if (/cardio|circul|pulse|capillary|jugular|jvp|perfusion|heart|haemorrh|hemorrh/i.test(s)) return "C";
  if (/respir|breath|chest|trachea|percussion|expansion|work of/i.test(s)) return "B";
  if (/airway|hent|heent|oropharyn|c-spine/i.test(s)) return "A";
  return "E";
}

export function regionOf(system: string): BodyRegion {
  const s = system || "";
  if (/skin|rash|extrem|limb|capillary|perfusion|pulse|lateralis|log roll|back/i.test(s)) return "limbs";
  if (/abdom|pelvi|genit|haemorrh|hemorrh/i.test(s)) return "abdomen";
  if (/cardio|heart|respir|breath|chest|percussion|expansion|work of/i.test(s)) return "chest";
  return "head";
}
