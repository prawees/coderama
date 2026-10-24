import { PATIENTS } from "./patients";

/**
 * The casebook: every patient in the game as a collection, the way a museum or a fish
 * collection works in a farming game. Meeting a patient fills their page; a good outcome
 * earns a star. Each page keeps the key steps of the case, taken from the case itself,
 * so the collection doubles as revision cards.
 */
export const CASEBOOK_IDS = Object.keys(PATIENTS).sort((a, b) => caseNumber(a) - caseNumber(b) || a.localeCompare(b));

function caseNumber(id: string) {
  return parseInt(id.replace(/^case_(\d+).*$/, "$1"), 10) || 0;
}

export interface Milestone {
  count: number;
  title: string;
  cash: number;
  giftId?: string;
}

/** Rewards for pages filled, claimed from the casebook */
export const CASEBOOK_MILESTONES: Milestone[] = [
  { count: 5, title: "ห้าคนแรก", cash: 100 },
  { count: 15, title: "หมอที่คนไข้จำได้", cash: 250, giftId: "handbook" },
  { count: 30, title: "สมุดเล่มหนา", cash: 400, giftId: "orchid" },
  { count: CASEBOOK_IDS.length, title: "ครบทุกคน", cash: 1000, giftId: "mango_sticky_rice" },
];

export function claimableMilestones(filled: number, claimed: number[]): Milestone[] {
  return CASEBOOK_MILESTONES.filter((m) => filled >= m.count && !claimed.includes(m.count));
}

/**
 * The steps that matter in a case, in order. Newer cases list them as required steps;
 * the older branching cases teach through the narrative of each correct turn.
 */
export function keySteps(caseData: any): string[] {
  const nodes = caseData?.managementGraph?.nodes ?? caseData?.nodes;
  if (Array.isArray(nodes)) {
    return nodes.filter((n: any) => n.type === "required" && n.data?.label).map((n: any) => n.data.label as string);
  }
  return Object.entries(nodes ?? {})
    .filter(([id, n]: [string, any]) => id.startsWith("correct") && n?.narrative)
    .map(([, n]: [string, any]) => n.narrative as string);
}
