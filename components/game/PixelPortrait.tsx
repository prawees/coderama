"use client";

import { useMemo } from "react";
import { useERStore, getRankFromXp } from "@/lib/erStore";
import { drawCharacter, drawInfantBust, drawChildBust, Look, HairStyle } from "@/lib/pixel/characters";
import { PixelGrid, hashString } from "@/lib/pixel/grid";
import { SKIN_TONES, HAIR_COLORS } from "@/lib/pixel/palette";
import { NPCS, EXTRA_LOOKS, npcIdForSpeaker } from "@/lib/npcs";
import { playerLookFrom } from "@/lib/playerLook";

/**
 * Dialogue and case portraits are cropped from the same sprites that walk around
 * the clinic, so a face in a cutscene matches the person you just talked to.
 */

function bust(look: Look): PixelGrid {
  const full = drawCharacter(look, "down", 0);
  const g = new PixelGrid(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g.set(x, y, full.get(x, y + 1));
  return g;
}

/** Stable invented look for speakers who are not part of the cast */
function inventedLook(name: string): Look {
  const h = hashString(name.toLowerCase());
  const lower = name.toLowerCase();
  const styles: HairStyle[] = ["short", "long", "bob", "bun", "sidepart", "curly", "ponytail"];
  const look: Look = {
    skin: SKIN_TONES[h % SKIN_TONES.length],
    hair: [HAIR_COLORS.black, HAIR_COLORS.brown, HAIR_COLORS.chestnut][(h >>> 4) % 3],
    hairStyle: styles[(h >>> 7) % styles.length],
    outfit: "casual",
    main: ["#d95763", "#5b7fbf", "#86c35f", "#e8b84f", "#c98ad1"][(h >>> 10) % 5],
    accent: "#fbf7ee",
  };
  if (/nurse|พยาบาล/.test(lower)) { look.outfit = "nurse"; look.cap = "nurse"; look.main = "#9fd3e6"; look.accent = "#e07aa3"; }
  else if (/^dr|doctor|prof|หมอ|extern/.test(lower)) { look.outfit = "coat"; look.main = "#ffffff"; look.accent = "#5f9e8e"; }
  else if (/^nong|student/.test(lower)) { look.outfit = "coat"; look.main = "#ffffff"; look.accent = "#5b7fbf"; }
  else if (/son|daughter|wife|mother|father|villager/.test(lower)) { look.outfit = "casual"; }
  // older women: grey hair in a bun
  if (/mother|auntie|grand/.test(lower)) { look.hair = "#b9b4b0"; look.hairStyle = "bun"; }
  return look;
}

function bg(look: Look) {
  if (look.outfit === "nurse") return "#3a2a38";
  if (look.outfit === "coat") return "#2c3a3a";
  if (look.outfit === "suit") return "#2f2a3a";
  return "#3a3428";
}

function Pixels({ grid, background, className, label }: { grid: PixelGrid; background: string; className?: string; label?: string }) {
  const rects: JSX.Element[] = [];
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) {
    const c = grid.get(x, y);
    if (c && c.length === 7) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={c} />);
  }
  return (
    <svg viewBox={`0 0 ${grid.w} ${grid.h}`} className={className} shapeRendering="crispEdges" role="img" aria-label={label} style={{ background, imageRendering: "pixelated" }}>
      {rects}
    </svg>
  );
}

export function PixelPortrait({ speaker, className = "" }: { speaker?: string; className?: string }) {
  const appearance = useERStore((s) => s.appearance);
  const lifetimeXp = useERStore((s) => s.lifetimeXp);
  const look = useMemo<Look | null>(() => {
    const name = (speaker || "").trim();
    const lower = name.toLowerCase();
    if (!name || lower === "system" || lower === "narrator") return null;
    if (lower === "you" || lower === "คุณ") return playerLookFrom(appearance, getRankFromXp(lifetimeXp || 0));
    const id = npcIdForSpeaker(name);
    if (id && NPCS[id]) return NPCS[id].look;
    if (lower.includes("anuwat")) return EXTRA_LOOKS.anuwat;
    if (lower.includes("director")) return EXTRA_LOOKS.director;
    return inventedLook(name);
  }, [speaker, appearance, lifetimeXp]);
  const grid = useMemo(() => (look ? bust(look) : null), [look]);
  if (!look || !grid) return null;
  return <Pixels grid={grid} background={bg(look)} className={className} label={speaker} />;
}

/** Patient bust: a swaddled baby, a small child, or an adult in a hospital gown */
export function PatientPortrait({ seed, sex, ageGroup, skinTone, age, className = "" }: { seed: string; sex?: string; ageGroup?: string; skinTone?: string; age?: number; className?: string }) {
  const grid = useMemo(() => {
    const h = hashString(seed || "patient");
    const female = /^f/i.test(sex || "");
    const elderly = /elder|old|geriatric/i.test(ageGroup || "");
    const skin = skinTone && /^#[0-9a-f]{6}$/i.test(skinTone) ? skinTone : SKIN_TONES[h % SKIN_TONES.length];
    const hair = elderly ? HAIR_COLORS.grey : [HAIR_COLORS.black, HAIR_COLORS.brown][(h >>> 3) % 2];
    if (age !== undefined && age < 2) {
      const blanket = ["#f4c7d8", "#9fd3e6", "#c8ecb4", "#ffe3a3"][(h >>> 5) % 4];
      return drawInfantBust(skin, HAIR_COLORS.black, blanket, age < 0.1);
    }
    if (age !== undefined && age < 13) return drawChildBust(skin, HAIR_COLORS.black, "#a9cbe0");
    const look: Look = {
      skin,
      hair,
      hairStyle: elderly ? (female ? "bun" : "receding") : female ? (["long", "bob", "bun"] as HairStyle[])[(h >>> 6) % 3] : (["short", "spiky", "sidepart"] as HairStyle[])[(h >>> 6) % 3],
      outfit: "gown",
      main: "#a9cbe0",
      accent: "#7fa7c2",
    };
    return bust(look);
  }, [seed, sex, ageGroup, skinTone, age]);
  return <Pixels grid={grid} background="#d9eedf" className={className} label="Patient" />;
}

/** Whether a speaker gets a portrait at all (System lines do not). */
export function hasPortrait(speaker?: string) {
  const lower = (speaker || "").trim().toLowerCase();
  return Boolean(lower) && lower !== "system" && lower !== "narrator";
}
