"use client";

import { useMemo } from "react";
import { useERStore } from "@/lib/erStore";

/**
 * Procedural 16x16 pixel bust for dialogue speakers.
 * Most story portraits point at image files that were never drawn, so every
 * speaker is rendered here from their name and role instead. The same name
 * always produces the same face, and the main cast have fixed looks.
 */

type HairStyle = "short" | "long" | "bun" | "messy" | "receding" | "bob";
type Outfit = "coat" | "nurse" | "scrubs" | "suit" | "student" | "plain";

interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  outfit: Outfit;
  outfitColor: string;
  accent: string; // tie, collar or inner shirt
  glasses?: boolean;
  stubble?: boolean;
  cap?: boolean;
  bg: string;
}

const SKINS = ["#f1c27d", "#e0ac69", "#c68642", "#ffdbac", "#d8a47f", "#b97a56"];
const DARK_HAIR = ["#1b1b1b", "#2b1d14", "#3b2a1e", "#121212"];
const SCRUBS = ["#2f6f73", "#3c5a99", "#4f7a3a", "#6b4c8a"];
const PLAIN = ["#9b4d3a", "#3d6b8f", "#7a7a2e", "#8f5a8f", "#4a4a4a"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const pick = <T,>(arr: T[], h: number, salt: number) => arr[(h >>> salt) % arr.length];

// Fixed looks for the recurring cast, matched on a lowercase substring of the speaker name
const CAST: Array<[string, Partial<Look>]> = [
  ["somchai", { hair: "#b8b8b8", hairStyle: "receding", outfit: "coat", accent: "#7a1f1f", glasses: true, skin: "#e0ac69" }],
  ["director", { hair: "#9a9a9a", hairStyle: "receding", outfit: "suit", outfitColor: "#24262e", accent: "#8a6d1f", glasses: true }],
  ["nurse ann", { hair: "#1b1b1b", hairStyle: "long", outfit: "nurse", cap: true, skin: "#f1c27d" }],
  ["bob", { hair: "#3b2a1e", hairStyle: "messy", outfit: "coat", accent: "#3c5a99", stubble: true }],
  ["grump", { hair: "#8a8a8a", hairStyle: "receding", outfit: "coat", accent: "#2f4f2f", glasses: true, stubble: true }],
  ["ekkarat", { hairStyle: "short", outfit: "scrubs", outfitColor: "#3c5a99", stubble: true }],
  ["somjai", { hair: "#3a3a3a", hairStyle: "bun", outfit: "nurse", cap: true }],
];

function lookFor(speaker: string, player?: { skin: string; hair: string; top: string; hairStyle: string }): Look | null {
  const name = speaker.trim();
  const lower = name.toLowerCase();
  if (!name || lower === "system" || lower === "narrator") return null;

  const h = hash(lower);
  const look: Look = {
    skin: pick(SKINS, h, 0),
    hair: pick(DARK_HAIR, h, 3),
    hairStyle: pick<HairStyle>(["short", "long", "bun", "messy", "bob"], h, 6),
    outfit: "plain",
    outfitColor: pick(PLAIN, h, 9),
    accent: "#e5e5e5",
    bg: "#1d2433",
  };

  if (lower === "you" || lower === "player") {
    if (player) {
      look.skin = player.skin;
      look.hair = player.hair;
      look.hairStyle = player.hairStyle === "hair_2" ? "long" : "short";
      look.outfit = "coat";
      look.accent = player.top;
    }
    look.bg = "#1f3a2a";
    return look;
  }

  if (/nurse|^pi jai|พยาบาล/.test(lower)) {
    look.outfit = "nurse";
    look.cap = true;
  } else if (/^(dr\.?|prof\.?|ajarn|aj\.|attending|อ\.|หมอ)/.test(lower) || lower.includes("dr.") || lower.includes("prof")) {
    look.outfit = "coat";
    look.accent = pick(SCRUBS, h, 12);
    if (lower.includes("prof")) {
      look.glasses = true;
      look.hair = "#a0a0a0";
      look.hairStyle = "receding";
    }
  } else if (/director|board|dean|ผอ/.test(lower)) {
    look.outfit = "suit";
    look.outfitColor = "#24262e";
    look.accent = "#8a6d1f";
  } else if (/intern|resident|extern|student|นศพ|beam|wachira/.test(lower) || lower.includes("(")) {
    // Named colleagues with nicknames, e.g. "Wachira (Beam)", are treated as junior staff in scrubs
    look.outfit = "scrubs";
    look.outfitColor = pick(SCRUBS, h, 12);
  }

  for (const [key, override] of CAST) {
    if (lower.includes(key)) Object.assign(look, override);
  }
  if (look.outfit === "nurse") look.bg = "#33222b";
  return look;
}

type Px = [number, number, string];

function draw(look: Look): Px[] {
  const px: Px[] = [];
  const put = (x: number, y: number, c: string) => px.push([x, y, c]);
  const fill = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c);
  };
  const shade = (hex: string, f: number) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b = Math.min(255, Math.round((n & 255) * f));
    return `rgb(${r},${g},${b})`;
  };
  const skinDark = shade(look.skin, 0.78);
  const ink = "#141414";

  // Long hair sits behind the head
  if (look.hairStyle === "long") {
    fill(3, 4, 4, 12, look.hair);
    fill(11, 4, 12, 12, look.hair);
  }
  if (look.hairStyle === "bob") {
    fill(3, 4, 4, 9, look.hair);
    fill(11, 4, 12, 9, look.hair);
  }

  // Body and outfit
  const body = look.outfit === "coat" ? "#f2f2f2" : look.outfit === "nurse" ? "#f2a7c3" : look.outfitColor;
  fill(2, 13, 13, 15, body);
  fill(3, 12, 12, 12, body);
  if (look.outfit === "coat") {
    fill(6, 12, 9, 15, look.accent); // shirt or scrubs under the coat
    put(5, 12, "#cfcfcf"); put(10, 12, "#cfcfcf"); // lapels
    put(5, 13, "#cfcfcf"); put(10, 13, "#cfcfcf");
    put(3, 14, "#9aa3ad"); // stethoscope
    put(4, 15, "#9aa3ad");
  } else if (look.outfit === "suit") {
    fill(6, 12, 9, 13, "#e8e8e8");
    fill(7, 12, 8, 15, look.accent); // tie
  } else if (look.outfit === "nurse") {
    put(7, 12, "#ffffff"); put(8, 12, "#ffffff");
  } else if (look.outfit === "scrubs") {
    put(7, 12, look.skin); put(8, 12, look.skin); put(7, 13, shade(body, 0.75)); put(8, 13, shade(body, 0.75)); // V-neck
  } else {
    fill(6, 12, 9, 12, shade(body, 0.8)); // collar
  }

  // Neck, head, ears
  fill(6, 11, 9, 11, skinDark);
  fill(4, 3, 11, 10, look.skin);
  put(4, 3, "transparent"); put(11, 3, "transparent");
  put(4, 10, "transparent"); put(11, 10, "transparent");
  put(3, 6, look.skin); put(3, 7, skinDark);
  put(12, 6, look.skin); put(12, 7, skinDark);
  fill(5, 10, 10, 10, skinDark); // jaw shadow

  // Hair on top
  const top = () => { fill(5, 2, 10, 2, look.hair); fill(4, 3, 11, 3, look.hair); };
  switch (look.hairStyle) {
    case "short":
      top(); put(4, 4, look.hair); put(11, 4, look.hair); fill(5, 4, 7, 4, look.hair);
      break;
    case "long":
    case "bob":
      top(); fill(4, 4, 11, 4, look.hair); put(4, 5, look.hair); put(11, 5, look.hair);
      break;
    case "bun":
      top(); fill(6, 0, 9, 1, look.hair); put(4, 4, look.hair); put(11, 4, look.hair);
      break;
    case "messy":
      top(); put(5, 1, look.hair); put(8, 1, look.hair); put(10, 1, look.hair);
      fill(4, 4, 6, 4, look.hair); put(9, 4, look.hair); put(11, 4, look.hair); put(11, 5, look.hair);
      break;
    case "receding":
      fill(4, 4, 4, 6, look.hair); fill(11, 4, 11, 6, look.hair); put(5, 3, look.hair); put(10, 3, look.hair);
      break;
  }

  if (look.cap) {
    fill(5, 1, 10, 2, "#ffffff");
    put(7, 1, "#d23b3b"); put(8, 1, "#d23b3b");
  }

  // Face
  put(6, 7, ink); put(9, 7, ink);
  put(7, 9, shade(look.skin, 0.62)); put(8, 9, shade(look.skin, 0.62));
  if (look.stubble) {
    put(5, 9, skinDark); put(10, 9, skinDark); put(6, 10, shade(look.skin, 0.6)); put(9, 10, shade(look.skin, 0.6));
  }
  if (look.glasses) {
    const g = "#2a2a2a";
    fill(5, 6, 7, 6, g); put(5, 7, g); put(7, 7, g);
    fill(8, 6, 10, 6, g); put(8, 7, g); put(10, 7, g);
  }
  // Last write wins per pixel; "transparent" erases (used to round the head corners)
  const grid = new Map<string, Px>();
  for (const p of px) {
    const k = `${p[0]},${p[1]}`;
    if (p[2] === "transparent") grid.delete(k);
    else grid.set(k, p);
  }
  return Array.from(grid.values());
}

export function PixelPortrait({ speaker, className = "" }: { speaker?: string; className?: string }) {
  const appearance = useERStore((s) => s.appearance);
  const look = useMemo(
    () =>
      lookFor(speaker || "", appearance && {
        skin: appearance.skinColor,
        hair: appearance.hairColor,
        top: appearance.topColor,
        hairStyle: appearance.hairStyle,
      }),
    [speaker, appearance]
  );
  if (!look) return null;
  const pixels = draw(look);
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={speaker}
      style={{ background: look.bg, imageRendering: "pixelated" }}
    >
      {pixels.map(([x, y, c]) => (
        <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={c} />
      ))}
    </svg>
  );
}

/** Whether a speaker gets a portrait at all (System lines do not). */
export function hasPortrait(speaker?: string) {
  const lower = (speaker || "").trim().toLowerCase();
  return Boolean(lower) && lower !== "system" && lower !== "narrator";
}

/** Patient bust: hospital gown, skin tone from the case file, hair by sex and age group. */
export function PatientPortrait({
  seed,
  sex,
  ageGroup,
  skinTone,
  className = "",
}: {
  seed: string;
  sex?: string;
  ageGroup?: string;
  skinTone?: string;
  className?: string;
}) {
  const h = hash(seed || "patient");
  const female = /^f/i.test(sex || "");
  const elderly = /elder|old|geriatric/i.test(ageGroup || "");
  const look: Look = {
    skin: skinTone && /^#[0-9a-f]{6}$/i.test(skinTone) ? skinTone : pick(SKINS, h, 0),
    hair: elderly ? "#c4c4c4" : pick(DARK_HAIR, h, 3),
    hairStyle: elderly ? (female ? "bun" : "receding") : female ? pick<HairStyle>(["long", "bob", "bun"], h, 6) : pick<HairStyle>(["short", "messy"], h, 6),
    outfit: "plain",
    outfitColor: "#8fb4cf",
    accent: "#6f94af",
    bg: "#1a1f29",
  };
  const pixels = draw(look);
  // gown pattern dots
  const dots: Px[] = [[4, 14, "#6f94af"], [8, 15, "#6f94af"], [11, 14, "#6f94af"]];
  return (
    <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" role="img" aria-label="Patient" style={{ background: look.bg, imageRendering: "pixelated" }}>
      {[...pixels, ...dots].map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={c} />
      ))}
    </svg>
  );
}
