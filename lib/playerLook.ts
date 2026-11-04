import type { Look } from "@/lib/pixel/characters";
import type { PlayerAppearance, Rank } from "@/lib/erStore";

/**
 * The player's sprite comes from the character creator, and their outfit grows with them:
 * a short-sleeved shirt as a student, a white coat from internship on.
 */
export function playerLookFrom(appearance: PlayerAppearance | undefined, rank: Rank): Look {
  const a = appearance ?? { skinColor: "#f4c7a1", hairColor: "#2c2328", topColor: "#ffffff", bottomColor: "#333333", shoeColor: "#000000", hairStyle: "hair_1", topStyle: "top_1" };
  const student = rank === "MS5" || rank === "MS6";
  const top = normalise(a.topColor, "#ffffff");
  return {
    skin: normalise(a.skinColor, "#f4c7a1"),
    hair: normalise(a.hairColor, "#2c2328"),
    hairStyle: a.hairStyle === "hair_2" ? "long" : "short",
    outfit: student ? (a.topStyle === "top_2" ? "scrubs" : "casual") : "coat",
    main: student ? top : "#ffffff",
    accent: student ? "#5b7fbf" : top === "#fbf7ee" ? "#5f9e8e" : top,
    pants: normalise(a.bottomColor, "#3f4a6b"),
    shoes: normalise(a.shoeColor, "#3b2a2f"),
    stethoscope: !student,
  };
}

/** Pure black and pure white read badly in pixel art; nudge them into the palette */
function normalise(c: string | undefined, fallback: string): string {
  if (!c || !/^#[0-9a-f]{6}$/i.test(c)) return fallback;
  const v = c.toLowerCase();
  if (v === "#000000") return "#2c2328";
  if (v === "#ffffff") return "#fbf7ee";
  return v;
}
