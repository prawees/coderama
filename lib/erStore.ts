import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';

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

export type ShiftMode = 'off-duty' | 'on-call' | 'on-shift';

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
};

export interface PlayerAppearance {
  hairColor: string;
  scrubsColor: string;
  skinColor: string;
}

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
  
  // Player Identity
  playerName: string;
  playerGender: 'M' | 'F' | 'O';
  language: 'en' | 'th';

  // Gear & Appearance
  inventory: string[];
  equipped: {
    stethoscope: string | null;
    scrubs: string | null;
    shoes: string | null;
  };
  appearance: PlayerAppearance;
  unlockedSkills: string[];
  shiftStats: {
    casesTreated: number;
    xpEarned: number;
    cashEarned: number;
  };

  // Actions
  setShiftMode: (mode: ShiftMode) => void;
  addCase: (newCase: ActiveCase) => void;
  removeCase: (caseId: string) => void;
  resolveMissedCases: () => void;
  addXp: (amount: number) => void;
  spendXp: (amount: number) => boolean;
  unlockSkill: (skillId: string, cost: number) => boolean;
  addCurrency: (amount: number) => void;
  setupPlayer: (name: string, gender: 'M' | 'F' | 'O', lang: 'en' | 'th') => void;
  buyGear: (itemId: string, cost: number) => boolean;
  equipGear: (itemId: string, type: GearType) => void;
  deductEnergy: (amount: number) => void;
  restoreEnergy: (amount: number) => void;
  setClock: (minutes: number) => void;
  incrementClock: (minutes: number) => void;
  setAppearance: (appearance: Partial<PlayerAppearance>) => void;
  resetShiftStats: () => void;
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

      // Player Identity
      playerName: 'Player',
      playerGender: 'O',
      language: 'en',

      inventory: [],
      equipped: {
        stethoscope: null,
        scrubs: null,
        shoes: null
      },
      appearance: {
        hairColor: '#8b4513', // default brown
        scrubsColor: '#1f6feb', // default blue
        skinColor: '#ffc0cb', // default skin
      },
      unlockedSkills: [],
      shiftStats: {
        casesTreated: 0,
        xpEarned: 0,
        cashEarned: 0,
      },

      setShiftMode: (mode) => set({ shiftMode: mode }),
      addCase: (newCase) => set((state) => {
        // Assign a random bed (0 to 3) if not already assigned
        const caseWithBed = { ...newCase, bedIndex: newCase.bedIndex ?? Math.floor(Math.random() * 4) };
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
        let multiplier = 1.0;
        if (state.equipped.stethoscope && GEAR_DATABASE[state.equipped.stethoscope]?.statBonus === 'XP_BOOST') {
          multiplier = GEAR_DATABASE[state.equipped.stethoscope].bonusValue;
        }
        const earned = Math.floor(amount * multiplier);
        return { 
          xp: state.xp + earned,
          lifetimeXp: (state.lifetimeXp || 0) + earned,
          shiftStats: { ...state.shiftStats, xpEarned: state.shiftStats.xpEarned + earned }
        };
      }),
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
        
        // If amount is negative (deducting cash), don't apply the positive multiplier to make them lose more!
        const earned = amount < 0 ? amount : Math.floor(amount * multiplier);
        
        return { 
          currency: state.currency + earned,
          shiftStats: { ...state.shiftStats, cashEarned: amount > 0 ? state.shiftStats.cashEarned + earned : state.shiftStats.cashEarned, casesTreated: amount > 0 ? state.shiftStats.casesTreated + 1 : state.shiftStats.casesTreated }
        };
      }),
      setupPlayer: (name, gender, lang) => set({
        playerName: name,
        playerGender: gender,
        language: lang,
      }),
      buyGear: (itemId, cost) => {
        const { currency, inventory } = get();
        if (currency >= cost && !inventory.includes(itemId)) {
          set({ 
            currency: currency - cost,
            inventory: [...inventory, itemId]
          });
          return true;
        }
        return false;
      },
      equipGear: (itemId, type) => set((state) => ({
        equipped: { ...state.equipped, [type]: itemId }
      })),
      deductEnergy: (amount) => set((state) => ({ energy: Math.max(0, state.energy - amount) })),
      restoreEnergy: (amount) => set((state) => ({ energy: Math.min(state.maxEnergy, state.energy + amount) })),
      setClock: (minutes) => set({ clockMinutes: minutes }),
      incrementClock: (minutes) => set((state) => {
        let multiplier = 1.0; // 1 real sec = 1 in game min
        if (state.equipped.shoes && GEAR_DATABASE[state.equipped.shoes]?.statBonus === 'TIME_EXTENSION') {
          multiplier = 0.5; // time passes half as fast!
        }
        return { clockMinutes: state.clockMinutes + (minutes * multiplier) };
      }),
      setAppearance: (appearance) => set((state) => ({ appearance: { ...state.appearance, ...appearance } })),
      resetShiftStats: () => set({ shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0 } })
    }),
    {
      name: 'code-rama-er-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        shiftMode: state.shiftMode,
        activeCases: state.activeCases,
        lastSaved: Date.now(),
        xp: state.xp,
        currency: state.currency,
        inventory: state.inventory,
        equipped: state.equipped,
        energy: state.energy,
        clockMinutes: state.clockMinutes,
        appearance: state.appearance
      })
    }
  )
);
