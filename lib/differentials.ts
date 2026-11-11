/**
 * Which diagnoses the working-diagnosis step offers (CaseEngineClient, dxGate).
 *
 * By default a case's `diagnoses` is used when it has four or more names: the first is the answer, the rest are
 * the look-alikes. Reviewing all of them showed two kinds of list that would be unfair to ask about:
 *
 * - Problem lists, where the other names are also true (a drowned child does have aspiration and hypothermia),
 *   or where the mechanism is plain on arrival (a burn, a crush, an amputation, a mass casualty). These cases are
 *   about what to do, not what it is, so they skip the step.
 * - Lists where one or two options are true alongside the answer (the retroperitoneal haematoma in a pelvic
 *   fracture, the health anxiety beside a benign node). Those options are replaced so that every wrong pick is wrong.
 *
 * The answer always stays `diagnoses[0]`. A clinician changing a case's diagnoses should recheck its entry here.
 */
export const NO_DX_STEP = new Set([
  "case_19", // drowning with arrest: aspiration, hypothermia are all present
  "case_20", // traumatic amputation
  "case_27", // worried well: several minor things are true at once
  "case_44", // high-voltage injury: rhabdomyolysis, compartment syndrome, arrhythmia together
  "case_45", // major burn with inhalation: CO and cyanide are part of it
  "case_49", // crush syndrome: hyperkalaemia, compartment syndrome, AKI together
  "case_50", // mass casualty incident
]);

/** The look-alikes offered beside the answer, for the cases whose own list had true co-diagnoses in it */
const LOOKALIKES: Record<string, string[]> = {
  case_02_fluids: ["SIADH", "Heart failure decompensation", "Psychogenic polydipsia"],
  case_10: ["Hypoglycaemia", "Pontine haemorrhage", "Organophosphate poisoning"],
  // Shock after blunt trauma: where is the blood, and is it blood at all
  case_14: ["Intra-abdominal haemorrhage", "Massive haemothorax", "Neurogenic shock from spinal injury", "Traumatic brain injury"],
  case_18: ["Genital tract trauma", "Uterine inversion", "Coagulopathy"],
  case_23: ["Lymphoma", "Thyroid nodule", "Tuberculous lymphadenitis"],
  case_24: ["Venous thromboembolism", "Wound infection", "Anaesthetic reaction"],
  case_42: ["Meningoencephalitis", "Alcohol withdrawal seizure", "Psychogenic non-epileptic seizure"],
  case_43: ["Renal colic", "Cauda equina syndrome", "Vertebral osteomyelitis"],
};

/** The options for a case, answer first; empty when the case has no working-diagnosis step */
export function differentialFor(caseId: string, diagnoses: unknown): string[] {
  const list = Array.isArray(diagnoses) ? (diagnoses as string[]).filter((d) => typeof d === "string" && d.trim()) : [];
  if (!list.length || NO_DX_STEP.has(caseId)) return [];
  if (LOOKALIKES[caseId]) return [list[0], ...LOOKALIKES[caseId]];
  return list.length >= 4 ? list.slice(0, 6) : [];
}
