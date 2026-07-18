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

// ---- AVATAR & PROFILE SYSTEM ----

export interface AvatarCustomization {
  scrubColor: string; // hex
  stethoscopeColor: string; // hex
  maskType: "none" | "surgical" | "n95";
  glasses: "none" | "square" | "round";
}

export interface UserProfile {
  xp: number;
  avatar: AvatarCustomization;
}

export const COSMETICS = {
  scrubs: [
    { id: "teal", color: "#14b8a6", name: "Student Teal", requiredRank: "Medical Student" as RankTier },
    { id: "blue", color: "#3b82f6", name: "Resident Blue", requiredRank: "Resident" as RankTier },
    { id: "black", color: "#0f172a", name: "Attending Black", requiredRank: "Attending" as RankTier },
  ],
  stethoscopes: [
    { id: "black", color: "#333333", name: "Standard Black", requiredRank: "Medical Student" as RankTier },
    { id: "red", color: "#ef4444", name: "Cardiology Red", requiredRank: "Intern" as RankTier },
    { id: "gold", color: "#eab308", name: "Chief Gold", requiredRank: "Chief of Staff" as RankTier },
  ]
};

export const DEFAULT_AVATAR: AvatarCustomization = {
  scrubColor: "#14b8a6",
  stethoscopeColor: "#333333",
  maskType: "none",
  glasses: "none",
};

export function getLocalProfile(): UserProfile {
  if (typeof window === "undefined") return { xp: 0, avatar: DEFAULT_AVATAR };
  
  const xp = getLocalXp();
  const storedAvatar = localStorage.getItem("toxico_avatar");
  
  let avatar = DEFAULT_AVATAR;
  if (storedAvatar) {
    try {
      avatar = JSON.parse(storedAvatar);
    } catch (e) {
      console.error("Failed to parse avatar");
    }
  }
  
  return { xp, avatar };
}

export function saveAvatarLocally(avatar: AvatarCustomization) {
  if (typeof window === "undefined") return;
  localStorage.setItem("toxico_avatar", JSON.stringify(avatar));
}
