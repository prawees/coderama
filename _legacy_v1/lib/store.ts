import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { PlayerEvent } from '@/components/simulator/types';

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

export type GameOverReason = { event: "won" | "patientDied" | "timeOut", description: string };

interface GameState {
  gameStarted: boolean;
  gameOver: boolean;
  gameOverReason: GameOverReason | null;
  elapsed: number;
  minutes: number;
  seconds: number;
  health: number;
  playerEvents: PlayerEvent[];
  
  startGame: () => void;
  endGame: (reason: GameOverReason) => void;
  tickTimer: (totalGameSeconds: number) => void;
  addPlayerEvent: (event: PlayerEvent) => void;
  resetGame: (durationMinutes: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameStarted: false,
  gameOver: false,
  gameOverReason: null,
  elapsed: 0,
  minutes: 30,
  seconds: 0,
  health: 100,
  playerEvents: [],

  startGame: () => set({ gameStarted: true, gameOver: false }),
  endGame: (reason) => set({ gameOver: true, gameOverReason: reason }),
  tickTimer: (totalGameSeconds) => set((state) => {
    if (!state.gameStarted || state.gameOver) return state;
    
    let m = state.minutes;
    let s = state.seconds - 1;
    let newGameOver = false;
    let newReason = state.gameOverReason;

    if (s < 0) {
      m -= 1;
      s = 59;
    }
    
    if (m < 0) {
      m = 0;
      s = 0;
      newGameOver = true;
      newReason = { event: "timeOut", description: "Time has expired." };
    }

    const newHealth = Math.max(0, state.health - (100 / totalGameSeconds));
    
    return {
      elapsed: state.elapsed + 1,
      minutes: m,
      seconds: s,
      health: newHealth,
      gameOver: newGameOver,
      gameOverReason: newReason,
    };
  }),
  addPlayerEvent: (event) => set((state) => ({ playerEvents: [...state.playerEvents, event] })),
  resetGame: (durationMinutes) => set({
    gameStarted: false,
    gameOver: false,
    gameOverReason: null,
    elapsed: 0,
    minutes: durationMinutes,
    seconds: 0,
    health: 100,
    playerEvents: [],
  })
}));

// --- PROFILE STORE (Persisted natively via Capacitor) ---
interface AvatarCustomization {
  scrubColor: string;
  stethoscopeColor: string;
  maskType: "none" | "surgical" | "n95";
  glasses: "none" | "square" | "round";
}

interface ProfileState {
  xp: number;
  avatar: AvatarCustomization;
  addXp: (amount: number) => void;
  updateAvatar: (updates: Partial<AvatarCustomization>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      xp: 0,
      avatar: {
        scrubColor: "#14b8a6",
        stethoscopeColor: "#333333",
        maskType: "none",
        glasses: "none",
      },
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      updateAvatar: (updates) => set((state) => ({ 
        avatar: { ...state.avatar, ...updates } 
      })),
    }),
    {
      name: 'code-rama-profile',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);
