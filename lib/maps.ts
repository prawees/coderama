import { MapData } from "@/components/game/Engine2D";

export const MAPS: Record<string, MapData> = {
  ER_MAIN: {
    width: 15,
    height: 10,
    walls: [
      {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, // Top wall
      {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}, // Left wall
    ],
    interactables: [
      { x: 3, y: 3, id: 'bed_1', type: 'bed' },
      { x: 7, y: 3, id: 'bed_2', type: 'bed' },
      { x: 11, y: 3, id: 'bed_3', type: 'bed' },
      { x: 7, y: 9, id: 'door_south', type: 'door', target: 'AMBULANCE_BAY' }
    ]
  },
  AMBULANCE_BAY: {
    width: 15,
    height: 10,
    walls: [
      {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, // Left block
      {x: 12, y: 0}, {x: 13, y: 0}, {x: 14, y: 0} // Right block
    ],
    interactables: [
      { x: 7, y: 0, id: 'door_north', type: 'door', target: 'ER_MAIN' }
    ]
  }
};
