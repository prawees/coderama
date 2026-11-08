import type { HairStyle, Look } from "@/lib/pixel/characters";
import { uniformFor } from "@/lib/uniform";
import { shade } from "@/lib/pixel/grid";
import type { PlayerAppearance, Rank } from "@/lib/erStore";

/**
 * The player's sprite comes from the character creator, and their outfit grows with them:
 * a short-sleeved shirt as a student, a white coat from internship on.
 */
export function playerLookFrom(appearance: PlayerAppearance | undefined, rank: Rank): Look {
  const a = appearance ?? { skinColor: "#f4c7a1", hairColor: "#2c2328", topColor: "#ffffff", bottomColor: "#333333", shoeColor: "#000000", hairStyle: "short", topStyle: "gown_long" };
  const uniform = uniformFor(rank, a.topStyle);
  const scrubColor = normalise(a.topColor, "#5b7fbf");
  const scrubs = uniform === "scrubs";
  return {
    skin: normalise(a.skinColor, "#f4c7a1"),
    hair: normalise(a.hairColor, "#2c2328"),
    hairStyle: hairStyleFrom(a.hairStyle),
    glasses: !!a.glasses,
    outfit: scrubs ? "scrubs" : "coat",
    coatLength: uniform === "gown_short" ? "short" : "long",
    sleeves: uniform === "gown_sleeves" ? "long" : "short",
    // Scrubs are a set in one colour; under a white coat it is the white shirt of the uniform
    main: scrubs ? scrubColor : "#fbf7ee",
    accent: scrubs ? shade(scrubColor, 0.8) : "#e6ebf2",
    pants: scrubs ? scrubColor : normalise(a.bottomColor, "#2c2328"),
    shoes: normalise(a.shoeColor, "#3b2a2f"),
    stethoscope: !scrubs || rank !== "MS5",
  };
}

const STYLES: HairStyle[] = ["short", "sidepart", "spiky", "curly", "long", "bob", "bun", "ponytail"];

/** Old saves hold hair_1 (short) and hair_2 (long); newer ones the style name */
function hairStyleFrom(v?: string): HairStyle {
  if (v === "hair_2") return "long";
  return STYLES.includes(v as HairStyle) ? (v as HairStyle) : "short";
}

/** Pure black and pure white read badly in pixel art; nudge them into the palette */
function normalise(c: string | undefined, fallback: string): string {
  if (!c || !/^#[0-9a-f]{6}$/i.test(c)) return fallback;
  const v = c.toLowerCase();
  if (v === "#000000") return "#2c2328";
  if (v === "#ffffff") return "#fbf7ee";
  return v;
}
