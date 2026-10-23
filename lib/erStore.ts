import { useEffect as _useEffect, useState as _useState } from 'react';
import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { QUEST_DATABASE } from './quests';

// Custom Capacitor Storage Engine for Zustand Persist.
// Writes are ignored until the saved game has been read back: Capacitor storage is async,
// and any state change before that (cloud sync reporting "signed out", a quest starting)
// would otherwise overwrite the player's save with the default state.
let saveLoaded = false;
const capacitorStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!saveLoaded) return;
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};

export type ShiftMode = 'off-duty' | 'on-call' | 'on-shift' | 'boss-battle';

export type Era = 'MED_Y5' | 'MED_Y6' | 'INTERN' | 'RESIDENT' | 'PROFESSOR';

/** Training stage by story day: year five and six at Rama, the year-six externship
 *  at Korat, internship at Lovely, residency back at Rama, then attending. */
export const getEra = (day: number): Era => {
  if (day <= 5) return 'MED_Y5';
  if (day <= 15) return 'MED_Y6';
  if (day <= 25) return 'INTERN';
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

const RANK_ORDER: Rank[] = ['MS5', 'MS6', 'Intern', 'R1', 'R2', 'R3', 'Asst. Prof', 'Assoc. Prof', 'Prof'];

/** The rank the story says you hold on a given day. Reaching a chapter promotes you to at least this. */
export const rankFloorForDay = (day: number): Rank =>
  day >= 31 ? 'Asst. Prof' : day >= 26 ? 'R1' : day >= 16 ? 'Intern' : day >= 6 ? 'MS6' : 'MS5';

/** The highest rank XP can earn before the story moves you on. From day 31 the promotion exam takes over. */
export const rankCeilingForDay = (day: number): Rank =>
  day >= 31 ? 'Prof' : day >= 26 ? 'R3' : day >= 16 ? 'Intern' : day >= 6 ? 'MS6' : 'MS5';

/** Lifetime XP cap for the story chapter, one point below the next rank. Infinity once the campaign is over. */
export const chapterXpCap = (day: number): number => {
  if (day >= 31) return Infinity;
  const next = RANK_ORDER[RANK_ORDER.indexOf(rankCeilingForDay(day)) + 1];
  return RANK_THRESHOLDS[next] - 1;
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
  'littmann_classic': { id: 'littmann_classic', name: 'หูฟัง Littmann Classic', type: 'stethoscope', statBonus: 'XP_BOOST', bonusValue: 1.1, cost: 500 },
  'neon_scrubs': { id: 'neon_scrubs', name: 'ชุดสครับสีนีออน', type: 'scrubs', statBonus: 'CASH_BOOST', bonusValue: 1.2, cost: 800 },
  'running_shoes': { id: 'running_shoes', name: 'รองเท้าวิ่ง', type: 'shoes', statBonus: 'TIME_EXTENSION', bonusValue: 60, cost: 300 }, // +60 seconds to shift
  'special_coffee': { id: 'special_coffee', name: 'กาแฟพิเศษ', type: 'shoes', statBonus: 'TIME_EXTENSION', bonusValue: 0, cost: 50 }, // Used as a gift
};

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export const UPGRADES_DATABASE: Record<string, UpgradeItem> = {
  'upg_espresso': { id: 'upg_espresso', name: 'เครื่องชงเอสเพรสโซ่', description: 'เริ่มเวรทุกครั้งได้พลังงานคืน 10', cost: 800, icon: 'coffee' },
  'upg_pager': { id: 'upg_pager', name: 'เพจเจอร์รุ่นพรีเมียม', description: 'ได้เงินจากทุกเคสเพิ่ม 10%', cost: 1500, icon: 'zap' },
  'upg_lounge': { id: 'upg_lounge', name: 'โซฟาห้องพักเจ้าหน้าที่', description: 'นอนแล้วได้พลังงานคืนเพิ่มอีก 20', cost: 1200, icon: 'sofa' },
};

export interface PlayerAppearance {
  skinColor: string; // hex string e.g. '#ffcc99'
  hairColor: string;
  topColor: string;
  bottomColor: string;
  shoeColor: string;
  hairStyle: string;
  topStyle: string;
}

export interface PatientRecord {
  /** Day of the first recorded outcome */
  day: number;
  good: boolean;
  letterRead: boolean;
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

  // Social: gifts and friendships
  gifts: Record<string, number>; // gift id -> count owned
  npcDaily: Record<string, { talkDay?: number; giftDay?: number }>;
  knownTastes: Record<string, Record<string, string>>; // npc -> gift -> taste discovered by giving it
  heartEventsSeen: string[];
  propDaily: Record<string, number>; // prop or activity -> day last used
  /** Patients you have treated, first good or bad outcome per case, and whether their letter was read */
  patientLog: Record<string, PatientRecord>;

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
  buyGift: (giftId: string, cost: number) => boolean;
  recordPatient: (caseId: string, good: boolean) => void;
  readLetter: (caseId: string) => void;
  useGift: (giftId: string) => boolean;
  markNpc: (npcId: string, field: 'talkDay' | 'giftDay', day: number) => void;
  learnTaste: (npcId: string, giftId: string, taste: string) => void;
  markHeartEvent: (key: string) => void;
  useProp: (key: string, day: number) => void;
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
      gifts: {},
      npcDaily: {},
      knownTastes: {},
      heartEventsSeen: [],
      propDaily: {},
      patientLog: {},

      friendships: {},
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
        skinColor: '#ffcc99',
        hairColor: '#000000',
        topColor: '#ffffff',
        bottomColor: '#333333',
        shoeColor: '#000000',
        hairStyle: 'hair_1',
        topStyle: 'top_1'
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

        // During the campaign the story sets the pace: rank can rise within the chapter,
        // but not past it. Spendable XP keeps accumulating for skills either way.
        if (state.currentDay <= 30) {
          return {
            xp: state.xp + (amount * boost),
            lifetimeXp: Math.max(state.lifetimeXp, Math.min(newLifetimeXp, chapterXpCap(state.currentDay))),
            shiftStats: {
              ...state.shiftStats,
              xpEarned: state.shiftStats.xpEarned + (amount * boost)
            }
          };
        }

        // After the campaign, cap lifetimeXp at nextThreshold - 1 so promotion needs the end-of-year exam.
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
      setupPlayer: (name, gender, _language, appearance, university) => set({ 
        playerName: name, 
        playerGender: gender,
        language: 'th',
        appearance,
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
        isPendingPromotion: false,
        hospitalUpgrades: [],
        unlockedSkills: [],
        maxEnergy: 100,
        clockMinutes: 0,
        completedQuests: [],
        tutorialCompleted: false,
        shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0 },
        gifts: {},
        npcDaily: {},
        knownTastes: {},
        heartEventsSeen: [],
        propDaily: {},
        patientLog: {}
      }),
      resetShiftStats: () => set((state) => ({
        shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0 }
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
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('questComplete', { detail: questId }));
      },
      completeTutorial: () => set({ tutorialCompleted: true }),
      setSyncEnabled: (sync: boolean) => set({ syncEnabled: sync }),
      incrementDay: () => set((state) => {
        const currentDay = state.currentDay + 1;
        // A new chapter brings the promotion the story describes
        const floor = RANK_THRESHOLDS[rankFloorForDay(currentDay)];
        return { currentDay, lifetimeXp: Math.max(state.lifetimeXp, floor) };
      }),
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
      buyGift: (giftId, cost) => {
        const { currency } = get();
        if (currency < cost) return false;
        set((state) => ({ currency: state.currency - cost, gifts: { ...state.gifts, [giftId]: (state.gifts[giftId] || 0) + 1 } }));
        if (get().activeQuests.includes('q_gear_up')) get().completeQuest('q_gear_up');
        return true;
      },
      useGift: (giftId) => {
        const n = get().gifts[giftId] || 0;
        if (n <= 0) return false;
        set((state) => ({ gifts: { ...state.gifts, [giftId]: n - 1 } }));
        return true;
      },
      markNpc: (npcId, field, day) => set((state) => ({
        npcDaily: { ...state.npcDaily, [npcId]: { ...state.npcDaily[npcId], [field]: day } }
      })),
      learnTaste: (npcId, giftId, taste) => set((state) => ({
        knownTastes: { ...state.knownTastes, [npcId]: { ...state.knownTastes[npcId], [giftId]: taste } }
      })),
      recordPatient: (caseId, good) => set((state) => {
        const prev = state.patientLog[caseId];
        // Keep the first good outcome. A later good result can replace an earlier bad one.
        if (prev && (prev.good || !good)) return {};
        return { patientLog: { ...state.patientLog, [caseId]: { day: state.currentDay, good, letterRead: false } } };
      }),
      readLetter: (caseId) => set((state) => {
        const rec = state.patientLog[caseId];
        if (!rec || rec.letterRead) return {};
        return { patientLog: { ...state.patientLog, [caseId]: { ...rec, letterRead: true } } };
      }),
      markHeartEvent: (key) => set((state) => ({ heartEventsSeen: [...state.heartEventsSeen, key] })),
      useProp: (key, day) => set((state) => ({ propDaily: { ...state.propDaily, [key]: day } })),
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
      // The game speaks one language now: Thai the way it is spoken on the ward.
      // Older saves that picked English are moved over when they load.
      merge: (persisted, current) => ({ ...current, ...(persisted as object), language: 'th' }),
      onRehydrateStorage: () => (_state, error) => {
        if (error || typeof window === 'undefined') return;
        saveLoaded = true;
        // persist what we have now that the save is merged in
        const s = useERStore.getState();
        useERStore.setState({ lastSaved: s.lastSaved });
      },
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
        // Purchases and progression that were previously lost on reload
        hospitalUpgrades: state.hospitalUpgrades,
        unlockedSkills: state.unlockedSkills,
        maxEnergy: state.maxEnergy,
        karma: state.karma,
        shiftStats: state.shiftStats,
        sfxVolume: state.sfxVolume,
        musicVolume: state.musicVolume,
        gifts: state.gifts,
        npcDaily: state.npcDaily,
        knownTastes: state.knownTastes,
        heartEventsSeen: state.heartEventsSeen,
        propDaily: state.propDaily,
        patientLog: state.patientLog,
      })
    }
  )
);

/** True once the saved game has been loaded from storage (Capacitor storage is async) */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = _useState(() => useERStore.persist.hasHydrated());
  _useEffect(() => {
    if (useERStore.persist.hasHydrated()) setHydrated(true);
    return useERStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
