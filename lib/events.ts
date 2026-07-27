import EventEmitter from 'eventemitter3';

// Central event bus for decoupled game actions
export const gameEvents = new EventEmitter();

// Event types
export type GameEventTypes = {
  administer_med: (medicationId: string, dose: string) => void;
  patient_crash: () => void;
  vital_alarm: (vital: string, type: 'high' | 'low') => void;
  play_sound: (soundId: string) => void;
};
