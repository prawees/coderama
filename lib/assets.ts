// Utility to generate perfectly crisp SVG pixel art from string matrices

// Utility to generate perfectly crisp SVG pixel art from string matrices

export function generatePixelSvg(grid: string[], palette: Record<string, string>): string {
  const height = grid.length;
  const width = grid[0].length;
  let rects = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = grid[y][x];
      if (char !== ' ' && palette[char]) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[char]}" />`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function mergeMatrices(...matrices: string[][]): string[] {
  const result: string[] = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    for (let x = 0; x < 16; x++) {
      let char = ' ';
      // Topmost layer is last in the array, so we go backwards
      for (let m = matrices.length - 1; m >= 0; m--) {
        if (matrices[m] && matrices[m][y][x] !== ' ') {
          char = matrices[m][y][x];
          break;
        }
      }
      row += char;
    }
    result.push(row);
  }
  return result;
}

// ---------------------------------------------
// PALETTES
// ---------------------------------------------
const pal = {
  'K': '#000000', // Black outline
  'W': '#ffffff', // White
  'S': '#ffc0cb', // Skin
  'B': '#1f6feb', // Blue (Scrubs)
  'D': '#0b397d', // Dark Blue (Scrubs shade)
  'G': '#7ee787', // Green
  'R': '#ff7b72', // Red
  'C': '#c9d1d9', // Gray/Silver
  'L': '#8b4513', // Brown (Hair/Wood)
  'H': '#58a6ff', // Hospital Bed Blue
  'F': '#161b22', // Floor Dark
  'f': '#21262d', // Floor Light Check
  'w': '#30363d', // Wall 
  'x': '#1f2428', // Wall Top
  'P': '#8a2be2', // Waiting Chair Purple
  'T': '#e0ffff', // Glass Door / Light Blue
  't': '#008b8b', // Glass Door Frame
  'A': '#d3d3d3', // Triage Floor
  'a': '#a9a9a9', // Triage Floor Dark
};

// ---------------------------------------------
// DOCTOR SPRITES (16x16)
// ---------------------------------------------
const docIdle = [
  "      KKKK      ",
  "     KLLLLK     ",
  "    KLLLLLLK    ",
  "    KLLLLLLK    ",
  "    KSKSSKSK    ",
  "    KSKSSKSK    ",
  "     KSSSSK     ",
  "   KKKWKWWKKK   ",
  "  KWKWWKWWKWK   ",
  " KSKWWWKWWWKSK  ",
  " KSKWWKKKWWKSK  ",
  " KKKBWWKWWCBKK  ",
  "  KKBBBKBBBKK   ",
  "    DBBBKBD     ",
  "    KDK KDK     ",
  "   KKK   KKK    "
];

const docWalk1 = [
  "      KKKK      ",
  "     KLLLLK     ",
  "    KLLLLLLK    ",
  "    KLLLLLLK    ",
  "    KSKSSKSK    ",
  "    KSKSSKSK    ",
  "     KSSSSK     ",
  "   KKKWKWWKKK   ",
  "  KWKWWKWWKWK   ",
  " KSKWWWKWWWKSK  ",
  " KKWWWKKKWWKSK  ",
  " K BWWKWWCBKKK  ",
  " KKBBBKBBBKK    ",
  "    DBBBDK      ",
  "    KDK KKK     ",
  "   KKK          "
];

const docWalk2 = [
  "      KKKK      ",
  "     KLLLLK     ",
  "    KLLLLLLK    ",
  "    KLLLLLLK    ",
  "    KSKSSKSK    ",
  "    KSKSSKSK    ",
  "     KSSSSK     ",
  "   KKKWKWWKKK   ",
  "  KWKWWKWWKWK   ",
  " KSKWWWKWWWKSK  ",
  " KSKWWKKKWWWKK  ",
  " KKKBCWWKWWBBK  ",
  "    KKBBBKBKK   ",
  "      KDBBBD    ",
  "     KKK KDK    ",
  "          KKK   "
];

// ---------------------------------------------
// PATIENT IN BED (16x16)
// ---------------------------------------------
const patientBed = [
  "KKKKKKKKKKKKKKKK",
  "KWWWWWWWWWWWWWWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHKKKKHHHHWK",
  "KWHHHKSSSSKHHHWK",
  "KWHHHKKSSKKHHHWK",
  "KWHHHKWWWWKHHHWK",
  "KWHHHWWWWWWHHHWK",
  "KWHHHWWWWWWHHHWK",
  "KWHHHWWWWWWHHHWK",
  "KWHHHWWWWWWHHHWK",
  "KWHHHWWWWWWHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWWWWWWWWWWWWWWK",
  "KKKKKKKKKKKKKKKK"
];

// ---------------------------------------------
// EMPTY BED (16x16)
// ---------------------------------------------
const emptyBed = [
  "KKKKKKKKKKKKKKKK",
  "KWWWWWWWWWWWWWWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHKKKKKKKKHHWK",
  "KWHHKWWWWWWWKHWK",
  "KWHHKWWWWWWWKHWK",
  "KWHHKKKKKKKKHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWHHHHHHHHHHHHWK",
  "KWWWWWWWWWWWWWWK",
  "KKKKKKKKKKKKKKKK"
];

// ---------------------------------------------
// DESK (16x16)
// ---------------------------------------------
const desk = [
  "                ",
  "                ",
  "                ",
  "                ",
  "  KKKKKKKKKKKK  ",
  " KWWWWWWWWWWWWK ",
  " KWWWWWWWWWWWWK ",
  " KKKKKKKKKKKKKK ",
  " KLLLKKKKKKLLLK ",
  " KLKLK    KLKLK ",
  " KLLLKKKKKKLLLK ",
  " KLKLK    KLKLK ",
  " KLLLKKKKKKLLLK ",
  " KK KK    KK KK ",
  " KK KK    KK KK ",
  "                "
];

// ---------------------------------------------
// FLOOR TILE (16x16)
// ---------------------------------------------
const floorTile = [
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF",
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF",
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF",
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF",
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF",
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF",
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF",
  "FfFfFfFfFfFfFfFf",
  "fFfFfFfFfFfFfFfF"
];

// ---------------------------------------------
// WALL TILE (16x16)
// ---------------------------------------------
const wallTile = [
  "xxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxx",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "KKKKKKKKKKKKKKKK",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "KKKKKKKKKKKKKKKK",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "KKKKKKKKKKKKKKKK",
  "wwwwwwwwwwwwwwww"
];

// ---------------------------------------------
// WAITING CHAIR (16x16)
// ---------------------------------------------
const waitingChair = [
  "                ",
  "                ",
  "  PPPPPPPPPPPP  ",
  "  PPPPPPPPPPPP  ",
  "  PPPPPPPPPPPP  ",
  "  PPPPPPPPPPPP  ",
  "  PPPPPPPPPPPP  ",
  "  PPPPPPPPPPPP  ",
  "  PPPPPPPPPPPP  ",
  "  KKKKKKKKKKKK  ",
  "   K        K   ",
  "   K        K   ",
  "   K        K   ",
  "  KKK      KKK  ",
  "                ",
  "                "
];

// ---------------------------------------------
// GLASS DOOR (16x16)
// ---------------------------------------------
const glassDoor = [
  "tttttttttttttttt",
  "tTTTTTTTTTTTTTTt",
  "tTTTTTTTttttTTTt",
  "tTTTTTTtTTTTtTTt",
  "tTTTTTTtTTTTtTTt",
  "tTTTTTTTttttTTTt",
  "tTTTTTTTTTTTTTTt",
  "tTTTTTTTTTTTTTTt",
  "tTTTTTTTttttTTTt",
  "tTTTTTTtTTTTtTTt",
  "tTTTTTTtTTTTtTTt",
  "tTTTTTTTttttTTTt",
  "tTTTTTTTTTTTTTTt",
  "tTTTTTTTTTTTTTTt",
  "tTTTTTTTTTTTTTTt",
  "tttttttttttttttt"
];

// ---------------------------------------------
// TRIAGE FLOOR (16x16)
// ---------------------------------------------
const triageFloor = [
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA",
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA",
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA",
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA",
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA",
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA",
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA",
  "AaAaAaAaAaAaAaAa",
  "aAaAaAaAaAaAaAaA"
];

// ---------------------------------------------
// COFFEE MACHINE (16x16)
// ---------------------------------------------
const coffeeMachine = [
  "   BBBBBBBBBB   ",
  "   BWWWWWWWWB   ",
  "   BWWWWWWWWB   ",
  "   BBBBBBBBBB   ",
  "   B        B   ",
  "   B  OOOO  B   ",
  "   B  O  O  B   ",
  "   BBBBBBBBBB   ",
  "   BWWWWWWWWB   ",
  "   BWWWWWWWWB   ",
  "   BWWWWWWWWB   ",
  "   BWWWWWWWWB   ",
  "   BBBBBBBBBB   ",
  "   BBBBBBBBBB   ",
  "   BBBBBBBBBB   ",
  "   BBBBBBBBBB   ",
];

// ---------------------------------------------
// OR TABLE (16x16)
// ---------------------------------------------
const orTable = [
  "                ",
  "   WWWWWWWWWW   ",
  "   W  RRRR  W   ",
  "   W  RRRR  W   ",
  "   WWWWWWWWWW   ",
  "   W        W   ",
  "   WWWWWWWWWW   ",
  "      WWWW      ",
  "      WWWW      ",
  "      WWWW      ",
  "      WWWW      ",
  "    WWWWWWWW    ",
  "    WWWWWWWW    ",
  "                ",
  "                ",
  "                "
];

// ---------------------------------------------
// PHARMACY COUNTER (16x16)
// ---------------------------------------------
const pharmacyCounter = [
  "   wwwwwwwwww   ",
  "   wRRRRRRRRw   ",
  "   wwwwwwwwww   ",
  "   KBBBBBBBBK   ",
  "   KBBBBBBBBK   ",
  "   KBBBBBBBBK   ",
  "   KBBBBBBBBK   ",
  "   KBBBBBBBBK   ",
  "   KBBBBBBBBK   ",
  "   KBBBBBBBBK   ",
  "   wwwwwwwwww   ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                "
];

export const PIXEL_ASSETS = {
  BedEmpty: generatePixelSvg(emptyBed, pal),
  BedPatient: generatePixelSvg(patientBed, pal),
  Desk: generatePixelSvg(desk, pal),
  Floor: generatePixelSvg(floorTile, pal),
  Wall: generatePixelSvg(wallTile, pal),
  WaitingChair: generatePixelSvg(waitingChair, pal),
  GlassDoor: generatePixelSvg(glassDoor, pal),
  TriageFloor: generatePixelSvg(triageFloor, pal),
  CoffeeMachine: generatePixelSvg(coffeeMachine, pal),
  ORTable: generatePixelSvg(orTable, pal),
  PharmacyCounter: generatePixelSvg(pharmacyCounter, pal),
};

export const generateDoctorSprites = (appearance: { hairColor: string, scrubsColor: string, skinColor: string }) => {
  const customPal = {
    ...pal,
    'L': appearance.hairColor,
    'B': appearance.scrubsColor,
    'D': appearance.scrubsColor, // We could darken it, but keeping it same for simplicity or we can calculate dark version
    'S': appearance.skinColor,
  };
  
  return {
    DoctorIdle: generatePixelSvg(docIdle, customPal),
    DoctorWalk1: generatePixelSvg(docWalk1, customPal),
    DoctorWalk2: generatePixelSvg(docWalk2, customPal),
  };
};

export const generatePatientSprite = (appearance: { skinTone?: string, shirtColor?: string }) => {
  const customPal = {
    ...pal,
    'S': appearance.skinTone || pal['S'],
    'W': appearance.shirtColor || pal['W'],
  };
  return generatePixelSvg(patientBed, customPal);
};
import { LAYERED_SPRITES } from './spriteData';

export const generateLayeredDoctorSprites = (appearance: { hairColor: string, scrubsColor: string, skinColor: string }) => {
  const customPal = {
    ...pal,
    'L': appearance.hairColor,
    'B': appearance.scrubsColor,
    'D': appearance.scrubsColor,
    'S': appearance.skinColor,
  };

  const gen = (bodyMatrix: string[], scrubsMatrix: string[], hairMatrix: string[]) => {
    return generatePixelSvg(mergeMatrices(bodyMatrix, scrubsMatrix, hairMatrix), customPal);
  };

  return {
    frontIdle: gen(LAYERED_SPRITES.body.front.idle, LAYERED_SPRITES.scrubs.front.idle, LAYERED_SPRITES.hair.front),
    frontWalk1: gen(LAYERED_SPRITES.body.front.walk1, LAYERED_SPRITES.scrubs.front.walk1, LAYERED_SPRITES.hair.front),
    frontWalk2: gen(LAYERED_SPRITES.body.front.walk2, LAYERED_SPRITES.scrubs.front.walk2, LAYERED_SPRITES.hair.front),
    
    backIdle: gen(LAYERED_SPRITES.body.back.idle, LAYERED_SPRITES.scrubs.back.idle, LAYERED_SPRITES.hair.back),
    backWalk1: gen(LAYERED_SPRITES.body.back.walk1, LAYERED_SPRITES.scrubs.back.walk1, LAYERED_SPRITES.hair.back),
    backWalk2: gen(LAYERED_SPRITES.body.back.walk2, LAYERED_SPRITES.scrubs.back.walk2, LAYERED_SPRITES.hair.back),
    
    sideIdle: gen(LAYERED_SPRITES.body.side.idle, LAYERED_SPRITES.scrubs.side.idle, LAYERED_SPRITES.hair.side),
    sideWalk1: gen(LAYERED_SPRITES.body.side.walk1, LAYERED_SPRITES.scrubs.side.walk1, LAYERED_SPRITES.hair.side),
    sideWalk2: gen(LAYERED_SPRITES.body.side.walk2, LAYERED_SPRITES.scrubs.side.walk2, LAYERED_SPRITES.hair.side),
  };
};
