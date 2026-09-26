"use client";
import { create } from "zustand";

/**
 * Screen-wipe transition bus. Any page calls wipeTo('/simulator/play/x') and
 * the <ScreenWipe/> overlay in the root layout covers the stage with a
 * stepped diagonal wipe, navigates, then reveals the new page.
 */
interface TransitionState {
  phase: 'idle' | 'covering' | 'covered' | 'revealing';
  label: string;
  target: string | null;
  navigate: ((path: string) => void) | null;
  setNavigator: (fn: (path: string) => void) => void;
  wipeTo: (path: string, label?: string) => void;
  _setPhase: (p: TransitionState['phase']) => void;
}

export const useTransition = create<TransitionState>((set, get) => ({
  phase: 'idle',
  label: '',
  target: null,
  navigate: null,
  setNavigator: (fn) => set({ navigate: fn }),
  wipeTo: (path, label = '') => {
    if (get().phase !== 'idle') return;
    set({ phase: 'covering', target: path, label });
    setTimeout(() => {
      set({ phase: 'covered' });
      get().navigate?.(path);
      setTimeout(() => set({ phase: 'revealing' }), 250);
      setTimeout(() => set({ phase: 'idle', target: null }), 700);
    }, 430);
  },
  _setPhase: (p) => set({ phase: p }),
}));
