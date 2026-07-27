import { World } from "miniplex";

export type Entity = {
  isPatient?: boolean;
  health?: number;
  toxicity?: number;
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  spO2?: number;
  respRate?: number;
  temperature?: number;
};

export const world = new World<Entity>();

// Initial patient entity
world.add({
  isPatient: true,
  health: 100,
  toxicity: 0,
  heartRate: 85,
  systolic: 120,
  diastolic: 80,
  spO2: 98,
  respRate: 16,
  temperature: 37.0,
});
