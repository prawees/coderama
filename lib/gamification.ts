export type RankTier = "Medical Student" | "Intern" | "Resident" | "Fellow" | "Attending" | "Chief of Staff";

export interface RankDef {
  name: RankTier;
  minXp: number;
}

export const RANKS: RankDef[] = [
  { name: "Medical Student", minXp: 0 },
  { name: "Intern", minXp: 1000 },
  { name: "Resident", minXp: 3000 },
  { name: "Fellow", minXp: 7000 },
  { name: "Attending", minXp: 12000 },
  { name: "Chief of Staff", minXp: 20000 },
];

export function getRankForXp(xp: number): RankTier {
  let currentRank: RankTier = "Medical Student";
  for (const rank of RANKS) {
    if (xp >= rank.minXp) {
      currentRank = rank.name;
    } else {
      break;
    }
  }
  return currentRank;
}

export interface XpBreakdown {
  survivalBonus: number;
  timeBonus: number;
  correctDiagnosis: number;
  total: number;
}

export function calculateXp(
  health: number,
  elapsedSeconds: number,
  totalGameSeconds: number,
  isDiagnosisCorrect: boolean,
  won: boolean
): XpBreakdown {
  // Base XP for survival / win
  const survivalBonus = won ? Math.round(health * 2) : 0; // Max 200

  // Time bonus (faster = better)
  const timeBonus = won ? Math.round(Math.max(0, (totalGameSeconds - elapsedSeconds) / 10)) : 0; 
  
  // Diagnosis bonus
  const correctDiagnosis = isDiagnosisCorrect ? 500 : 0;

  const total = survivalBonus + timeBonus + correctDiagnosis;

  return {
    survivalBonus,
    timeBonus,
    correctDiagnosis,
    total,
  };
}

export function saveXpLocally(xpGained: number): { totalXp: number; oldRank: RankTier; newRank: RankTier } {
  if (typeof window === "undefined") {
    return { totalXp: 0, oldRank: "Medical Student", newRank: "Medical Student" };
  }
  
  const currentXp = parseInt(localStorage.getItem("toxico_xp") || "0", 10);
  const oldRank = getRankForXp(currentXp);
  
  const newXp = currentXp + xpGained;
  const newRank = getRankForXp(newXp);
  
  localStorage.setItem("toxico_xp", newXp.toString());
  
  return {
    totalXp: newXp,
    oldRank,
    newRank,
  };
}

export function getLocalXp(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("toxico_xp") || "0", 10);
}
