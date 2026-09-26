import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { QUEST_DATABASE } from './quests';

// Custom Capacitor Storage Engine for Zustand Persist
const capacitorStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};

export type ShiftMode = 'off-duty' | 'on-call' | 'on-shift' | 'boss-battle';

export type Era = 'MED_Y5' | 'MED_Y6' | 'INTERN' | 'RESIDENT' | 'PROFESSOR';

export const getEra = (day: number): Era => {
  if (day <= 5) return 'MED_Y5';
  if (day <= 10) return 'MED_Y6';
  if (day <= 15) return 'INTERN';
  if (day <= 30) return 'RESIDENT';
  return 'PROFESSOR';
};

export type Rank = 'MS5' | 'MS6' | 'Intern' | 'R1' | 'R2' | 'R3' | 'Asst. Prof' | 'Assoc. Prof' | 'Prof';

export const RANK_THRESHOLDS: Record<Rank, number> = {
  'MS5': 0,
  'MS6': 500,
  'Intern': 1000,
  'R1': 2000,
  'R2': 4000,
  'R3': 7000,
  'Asst. Prof': 12000,
  'Assoc. Prof': 25000,
  'Prof': 60000
};

export const getRankFromXp = (xp: number): Rank => {
  if (xp >= RANK_THRESHOLDS['Prof']) return 'Prof';
  if (xp >= RANK_THRESHOLDS['Assoc. Prof']) return 'Assoc. Prof';
  if (xp >= RANK_THRESHOLDS['Asst. Prof']) return 'Asst. Prof';
  if (xp >= RANK_THRESHOLDS['R3']) return 'R3';
  if (xp >= RANK_THRESHOLDS['R2']) return 'R2';
  if (xp >= RANK_THRESHOLDS['R1']) return 'R1';
  if (xp >= RANK_THRESHOLDS['Intern']) return 'Intern';
  if (xp >= RANK_THRESHOLDS['MS6']) return 'MS6';
  return 'MS5';
};

export interface ActiveCase {
  id: string;
  caseDataId: string; // e.g., 'case_02_fluids'
  receivedAt: number;
  expiresAt: number;
  bedIndex?: number; // Added to spawn them in specific beds
  skinTone?: string;
  shirtColor?: string;
}

export type GearType = 'stethoscope' | 'scrubs' | 'shoes';
export type StatBonus = 'XP_BOOST' | 'TIME_EXTENSION' | 'CASH_BOOST';

export interface GearItem {
  id: string;
  name: string;
  type: GearType;
  statBonus: StatBonus;
  bonusValue: number; // e.g. 1.1 for +10% XP
  cost: number;
}

export const GEAR_DATABASE: Record<string, GearItem> = {
  'littmann_classic': { id: 'littmann_classic', name: 'Littmann Classic', type: 'stethoscope', statBonus: 'XP_BOOST', bonusValue: 1.1, cost: 500 },
  'neon_scrubs': { id: 'neon_scrubs', name: 'Neon Scrubs', type: 'scrubs', statBonus: 'CASH_BOOST', bonusValue: 1.2, cost: 800 },
  'running_shoes': { id: 'running_shoes', name: 'Running Shoes', type: 'shoes', statBonus: 'TIME_EXTENSION', bonusValue: 60, cost: 300 }, // +60 seconds to shift
  'special_coffee': { id: 'special_coffee', name: 'Specialty Coffee', type: 'shoes', statBonus: 'TIME_EXTENSION', bonusValue: 0, cost: 50 }, // Used as a gift
};

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export const UPGRADES_DATABASE: Record<string, UpgradeItem> = {
  'upg_espresso': { id: 'upg_espresso', name: 'Espresso Machine', description: 'Restores 10 Energy at the start of every shift.', cost: 800, icon: 'coffee' },
  'upg_pager': { id: 'upg_pager', name: 'Premium Pager', description: 'Earn 10% more Cash from all cases.', cost: 1500, icon: 'zap' },
  'upg_lounge': { id: 'upg_lounge', name: 'Staff Lounge Sofa', description: 'Sleeping restores an extra 20 Energy.', cost: 1200, icon: 'sofa' },
};

export interface PlayerAppearance {
  // v2: palette-swap ramps (see lib/palettes.ts). Hex fields below are legacy
  // and only read once by migrateAppearance() to pick the nearest ramp.
  skinRamp?: string;
  hairRamp?: string;
  topRamp?: string;
  bottomRamp?: string;
  shoeRamp?: string;
  skinColor?: string;
  hairColor?: string;
  topColor?: string;
  bottomColor?: string;
  shoeColor?: string;
  hairStyle: string; // 'short' | 'long' | 'bun' | 'messy' | 'bald'
  topStyle: string;  // 'scrubs' | 'coat'
}

/** One-time upgrade of a persisted v1 (hex-tint) appearance to v2 ramps. */
export const migrateAppearance = (a: PlayerAppearance): PlayerAppearance => {
  if (a.skinRamp && a.hairRamp && a.topRamp && a.bottomRamp && a.shoeRamp) return a;
  const { nearestRamp, SKIN_RAMPS, HAIR_RAMPS, SCRUB_RAMPS, BOTTOM_RAMPS, SHOE_RAMPS } = require('./palettes');
  return {
    hairStyle: a.hairStyle === 'hair_2' ? 'long' : a.hairStyle === 'hair_1' || a.hairStyle === 'hair_short' ? 'short' : a.hairStyle || 'short',
    topStyle: a.topStyle === 'top_2' ? 'coat' : 'scrubs',
    skinRamp: a.skinRamp || nearestRamp(a.skinColor, SKIN_RAMPS).id,
    hairRamp: a.hairRamp || nearestRamp(a.hairColor, HAIR_RAMPS).id,
    topRamp: a.topRamp || nearestRamp(a.topColor, SCRUB_RAMPS).id,
    bottomRamp: a.bottomRamp || nearestRamp(a.bottomColor, BOTTOM_RAMPS).id,
    shoeRamp: a.shoeRamp || nearestRamp(a.shoeColor, SHOE_RAMPS).id,
  };
};

import type { CaseReport } from './scorecard';

interface ERState {
  shiftMode: ShiftMode;
  activeCases: ActiveCase[];
  lastSaved: number;
  
  // Stats
  xp: number; // Available XP for spending
  lifetimeXp: number; // Used for rank progression
  currency: number;
  energy: number;
  maxEnergy: number;
  clockMinutes: number;
  isPendingPromotion: boolean;
  
  // Player Identity
  playerName: string;
  playerGender: 'M' | 'F' | 'O';
  language: 'en' | 'th';
  university: string;

  // Gear & Appearance
  inventory: string[];
  equipped: {
    stethoscope: string | null;
    scrubs: string | null;
    shoes: string | null;
  };
  hospitalUpgrades: string[];
  appearance: PlayerAppearance;
  unlockedSkills: string[];
  shiftStats: {
    casesTreated: number;
    xpEarned: number;
    cashEarned: number;
  };

  // RPG State
  friendships: Record<string, number>;
  karma: number; // For narrative engine / reputation
  activeQuests: string[];
  completedQuests: string[];
  tutorialCompleted: boolean;
  syncEnabled: boolean;
  currentDay: number; // For campaign progression
  storyFlags: Record<string, boolean | number | string>; // For narrative branching consequences
  
  // Settings
  sfxVolume: number;
  musicVolume: number;
  
  // Prestige System
  prestigeCount: number;
  legacyPerks: string[];

  // Faculty pitch: OSCE/NL report cards + attending consult
  caseReports: CaseReport[];
  lastReport: CaseReport | null;
  consultUsedThisShift: boolean;
  addCaseReport: (report: CaseReport) => void;
  clearLastReport: () => void;
  useConsultAttending: () => boolean;
  drinkCoffee: () => boolean;

  // Actions
  setShiftMode: (mode: ShiftMode) => void;
  addCase: (newCase: ActiveCase) => void;
  removeCase: (caseId: string) => void;
  resolveMissedCases: () => void;
  addXp: (amount: number) => void;
  forcePromote: () => void;
  spendXp: (amount: number) => boolean;
  unlockSkill: (skillId: string, cost: number) => boolean;
  addCurrency: (amount: number) => void;
  setupPlayer: (name: string, gender: 'M' | 'F' | 'O', language: 'en' | 'th', appearance: PlayerAppearance, university: string) => void;
  buyGear: (itemId: string, cost: number) => boolean;
  equipGear: (itemId: string, type: GearType) => void;
  buyUpgrade: (upgradeId: string, cost: number) => boolean;
  deductEnergy: (amount: number) => void;
  restoreEnergy: (amount: number) => void;
  setClock: (minutes: number) => void;
  incrementClock: (minutes: number) => void;
  setAppearance: (appearance: Partial<PlayerAppearance>) => void;
  setPendingPromotion: (status: boolean) => void;
  resetGame: () => void;
  resetShiftStats: () => void;
  updateFriendship: (npcId: string, amount: number) => void;
  addKarma: (amount: number) => void;
  startQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  completeTutorial: () => void;
  setSyncEnabled: (sync: boolean) => void;
  incrementDay: () => void;
  removeFromInventory: (itemId: string) => void;
  setStoryFlag: (key: string, value: boolean | number | string) => void;
  setSfxVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  setPlayerName: (name: string) => void;
  prestige: (perk: string) => void;
}

export const useERStore = create<ERState>()(
  persist(
    (set, get) => ({
      shiftMode: 'off-duty',
      activeCases: [],
      lastSaved: Date.now(),
      xp: 0,
      lifetimeXp: 0,
      currency: 1000,
      energy: 100,
      maxEnergy: 100,
      clockMinutes: 0,
      isPendingPromotion: false,
      prestigeCount: 0,
      legacyPerks: [],

      friendships: {
        nurse_ann: 0,
        dr_grump: 0
      },
      caseReports: [],
      lastReport: null,
      consultUsedThisShift: false,
      addCaseReport: (report) => set((state) => ({
        caseReports: [...state.caseReports.slice(-49), report],
        lastReport: report,
      })),
      clearLastReport: () => set({ lastReport: null }),
      useConsultAttending: () => {
        const s = get();
        if (s.consultUsedThisShift || (s.friendships['dr_grump'] || 0) < 3) return false;
        set({ consultUsedThisShift: true });
        return true;
      },
      drinkCoffee: () => {
        const s = get();
        if (!s.inventory.includes('special_coffee')) return false;
        s.removeFromInventory('special_coffee');
        s.restoreEnergy(25);
        return true;
      },
      karma: 0,
      activeQuests: [],
      completedQuests: [],
      tutorialCompleted: false,
      syncEnabled: false,
      currentDay: 1,
      storyFlags: {},
      sfxVolume: 0.5,
      musicVolume: 0.5,

      // Player Identity
      playerName: 'Doctor',
      playerGender: 'O',
      language: 'th',
      university: 'Rama',

      inventory: [],
      hospitalUpgrades: [],
      equipped: {
        stethoscope: null,
        scrubs: null,
        shoes: null
      },
      appearance: {
        skinRamp: 'skin_light',
        hairRamp: 'hair_black',
        topRamp: 'scrub_teal',
        bottomRamp: 'pants_charcoal',
        shoeRamp: 'shoes_white',
        hairStyle: 'short',
        topStyle: 'scrubs'
      },
      unlockedSkills: [],
      shiftStats: {
        casesTreated: 0,
        xpEarned: 0,
        cashEarned: 0,
      },

      setPlayerName: (name) => set({ playerName: name }),
      setShiftMode: (mode) => set({ shiftMode: mode }),
      addCase: (newCase) => set((state) => {
        if (newCase.bedIndex !== undefined) {
          return { activeCases: [...state.activeCases, newCase] };
        }
        // Find available bed among ER beds 0, 1, 2
        const occupiedBeds = new Set(state.activeCases.map(c => c.bedIndex));
        const availableBeds = [0, 1, 2].filter(idx => !occupiedBeds.has(idx));
        const chosenBed = availableBeds.length > 0
          ? availableBeds[Math.floor(Math.random() * availableBeds.length)]
          : Math.floor(Math.random() * 3);
        const caseWithBed = { ...newCase, bedIndex: chosenBed };
        return { activeCases: [...state.activeCases, caseWithBed] };
      }),
      removeCase: (caseId) => set((state) => ({
        activeCases: state.activeCases.filter(c => c.id !== caseId)
      })),
      resolveMissedCases: () => {
        const now = Date.now();
        const { activeCases, xp } = get();
        
        let missedCount = 0;
        const remainingCases = activeCases.filter(c => {
          if (now > c.expiresAt) {
            missedCount++;
            return false;
          }
          return true;
        });

        if (missedCount > 0) {
          set({
            activeCases: remainingCases,
            xp: Math.max(0, xp - (missedCount * 10)),
            lastSaved: now
          });
        }
      },
      addXp: (amount) => set((state) => {
        let boost = 1.0;
        if (state.equipped.stethoscope && GEAR_DATABASE[state.equipped.stethoscope]?.statBonus === 'XP_BOOST') {
           boost = GEAR_DATABASE[state.equipped.stethoscope].bonusValue;
        }
        
        const currentRank = getRankFromXp(state.lifetimeXp);
        const nextThresholds = Object.values(RANK_THRESHOLDS).filter(t => t > state.lifetimeXp);
        const nextThreshold = nextThresholds.length > 0 ? Math.min(...nextThresholds) : Infinity;
        
        const newLifetimeXp = state.lifetimeXp + (amount * boost);
        
        // Cap lifetimeXp at nextThreshold - 1 so they don't promote automatically.
        // They must take the End of Year test to push it to the nextThreshold!
        if (newLifetimeXp >= nextThreshold && currentRank !== 'Prof') {
          return {
            xp: state.xp + (amount * boost),
            lifetimeXp: nextThreshold - 1, 
            shiftStats: {
              ...state.shiftStats,
              xpEarned: state.shiftStats.xpEarned + (amount * boost)
            }
          };
        }
        
        // Normal gain
        return {
          xp: state.xp + (amount * boost),
          lifetimeXp: newLifetimeXp,
          shiftStats: {
            ...state.shiftStats,
            xpEarned: state.shiftStats.xpEarned + (amount * boost)
          }
        };
      }),
      forcePromote: () => set((state) => ({
        lifetimeXp: state.lifetimeXp + 1
      })),
      spendXp: (amount) => {
        const { xp } = get();
        if (xp >= amount) {
          set({ xp: xp - amount });
          return true;
        }
        return false;
      },
      unlockSkill: (skillId, cost) => {
        const { xp, unlockedSkills, maxEnergy } = get();
        if (xp >= cost && !unlockedSkills.includes(skillId)) {
          const updates: any = {
             xp: xp - cost,
             unlockedSkills: [...unlockedSkills, skillId]
          };
          
          if (skillId === 'IRON_BLADDER') {
            updates.maxEnergy = maxEnergy + 50;
            updates.energy = get().energy + 50; // give them the energy immediately too
          }
          
          set(updates);
          return true;
        }
        return false;
      },
      addCurrency: (amount) => set((state) => {
        let multiplier = 1.0;
        if (state.equipped.scrubs && GEAR_DATABASE[state.equipped.scrubs]?.statBonus === 'CASH_BOOST') {
          multiplier = GEAR_DATABASE[state.equipped.scrubs].bonusValue;
        }
        if (state.unlockedSkills.includes('SPEED_READER')) {
          multiplier += 0.1; // +10% cash payout
        }
        if (state.hospitalUpgrades.includes('upg_pager')) {
          multiplier += 0.1; // +10% cash payout
        }
        
        // If amount is negative (deducting cash), don't apply the positive multiplier to make them lose more!
        const earned = amount < 0 ? amount : Math.floor(amount * multiplier);
        
        return { 
          currency: state.currency + earned,
          shiftStats: { ...state.shiftStats, cashEarned: amount > 0 ? state.shiftStats.cashEarned + earned : state.shiftStats.cashEarned, casesTreated: amount > 0 ? state.shiftStats.casesTreated + 1 : state.shiftStats.casesTreated }
        };
      }),
      setupPlayer: (name, gender, language, appearance, university) => set({
        playerName: name,
        playerGender: gender,
        language,
        appearance: migrateAppearance(appearance),
        university
      }),
      buyGear: (itemId, cost) => {
        const { currency, inventory } = get();
        if (currency >= cost && !inventory.includes(itemId)) {
          set((state) => ({ 
            currency: state.currency - cost,
            inventory: [...state.inventory, itemId]
          }));
          
          // Quest logic
          if (get().activeQuests.includes('q_gear_up')) {
            get().completeQuest('q_gear_up');
          }
          
          return true;
        }
        return false;
      },
      removeFromInventory: (itemId) => set((state) => ({
        inventory: state.inventory.filter(i => i !== itemId)
      })),
      equipGear: (itemId, type) => {
        set((state) => ({
          equipped: { ...state.equipped, [type]: itemId }
        }));
      },
      buyUpgrade: (upgradeId, cost) => {
        const { currency, hospitalUpgrades } = get();
        if (currency >= cost && !hospitalUpgrades.includes(upgradeId)) {
          set((state) => ({
            currency: state.currency - cost,
            hospitalUpgrades: [...state.hospitalUpgrades, upgradeId]
          }));
          return true;
        }
        return false;
      },
      deductEnergy: (amount) => set((state) => ({ energy: Math.max(0, state.energy - amount) })),
      restoreEnergy: (amount) => set((state) => {
        const max = state.hospitalUpgrades.includes('upg_lounge') ? 120 : state.maxEnergy;
        return { energy: Math.min(max, state.energy + amount) };
      }),
      setClock: (minutes) => set({ clockMinutes: minutes }),
      incrementClock: (minutes) => set((state) => {
        let multiplier = 1.0; // 1 real sec = 1 in game min
        if (state.equipped.shoes && GEAR_DATABASE[state.equipped.shoes]?.statBonus === 'TIME_EXTENSION') {
          multiplier = 0.5; // time passes half as fast!
        }
        return { clockMinutes: state.clockMinutes + (minutes * multiplier) };
      }),
      setAppearance: (appearance) => set((state) => ({ appearance: { ...state.appearance, ...appearance } })),
      setPendingPromotion: (status) => set({ isPendingPromotion: status }),
      resetGame: () => set({
        currency: 0,
        xp: 0,
        lifetimeXp: 0,
        energy: 100,
        karma: 0,
        currentDay: 1,
        activeCases: [],
        friendships: {},
        inventory: [],
        equipped: { stethoscope: null, scrubs: null, shoes: null },
        activeQuests: [],
        storyFlags: {},
        shiftMode: 'off-duty',
        isPendingPromotion: false
      }),
      resetShiftStats: () => set(() => ({
        shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0 },
        consultUsedThisShift: false,
      })),
      updateFriendship: (npcId, amount) => set((state) => ({
        friendships: { ...state.friendships, [npcId]: (state.friendships[npcId] || 0) + amount }
      })),
      addKarma: (amount) => set((state) => ({ karma: (state.karma || 0) + amount })),
      startQuest: (questId) => set((state) => ({
        activeQuests: state.activeQuests.includes(questId) ? state.activeQuests : [...state.activeQuests, questId]
      })),
      completeQuest: (questId) => {
        const state = get();
        if (state.completedQuests.includes(questId)) return;
        
        const quest = QUEST_DATABASE[questId];
        if (quest) {
          state.addCurrency(quest.rewardCash);
          if (quest.rewardXp > 0) {
            state.addXp(quest.rewardXp);
          }
        }
        
        set((state) => ({
          activeQuests: state.activeQuests.filter(q => q !== questId),
          completedQuests: [...state.completedQuests, questId]
        }));
      },
      completeTutorial: () => set({ tutorialCompleted: true }),
      setSyncEnabled: (sync: boolean) => set({ syncEnabled: sync }),
      incrementDay: () => set((state) => ({ currentDay: state.currentDay + 1 })),
      setStoryFlag: (key, value) => set((state) => ({
        storyFlags: { ...state.storyFlags, [key]: value }
      })),
      setSfxVolume: (vol) => {
        set({ sfxVolume: vol });
        // Dispatch custom event so the non-react audio systems can hear it immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('volumeChanged', { detail: { sfxVolume: vol, musicVolume: get().musicVolume } }));
        }
      },
      setMusicVolume: (vol) => {
        set({ musicVolume: vol });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('volumeChanged', { detail: { sfxVolume: get().sfxVolume, musicVolume: vol } }));
        }
      },
      prestige: (perk) => set(state => ({
         prestigeCount: state.prestigeCount + 1,
         legacyPerks: [...state.legacyPerks, perk],
         xp: 0,
         lifetimeXp: 0,
         currentDay: 1,
         currency: 1000,
         storyFlags: {},
         activeQuests: [],
         completedQuests: [],
         friendships: {},
         isPendingPromotion: false,
         clockMinutes: 0
      }))
    }),
    {
      name: 'code-rama-storage',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        shiftMode: state.shiftMode,
        activeCases: state.activeCases,
        lastSaved: Date.now(),
        xp: state.xp,
        lifetimeXp: state.lifetimeXp,
        currency: state.currency,
        inventory: state.inventory,
        equipped: state.equipped,
        energy: state.energy,
        clockMinutes: state.clockMinutes,
        playerName: state.playerName,
        playerGender: state.playerGender,
        language: state.language,
        university: state.university,
        appearance: state.appearance,
        activeQuests: state.activeQuests,
        completedQuests: state.completedQuests,
        friendships: state.friendships,
        tutorialCompleted: state.tutorialCompleted,
        currentDay: state.currentDay,
        storyFlags: state.storyFlags,
        prestigeCount: state.prestigeCount,
        legacyPerks: state.legacyPerks,
        caseReports: state.caseReports,
        hospitalUpgrades: state.hospitalUpgrades,
        unlockedSkills: state.unlockedSkills,
        karma: state.karma,
      }),
      merge: (persisted: any, current) => {
        const merged = { ...current, ...(persisted || {}) };
        if (merged.appearance) merged.appearance = migrateAppearance(merged.appearance);
        return merged;
      },
    }
  )
);
