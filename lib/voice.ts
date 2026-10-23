/**
 * The player's own words in Thai depend on who they are. Story text writes the forms
 * with a slash ("ผม/ฉัน", "ครับ/ค่ะ"); this picks one when the line is shown.
 * Women juniors call themselves หนู to seniors, the way a Thai ward talks; from
 * residency on they use ฉัน. Players who chose not to say use เรา and drop the particle.
 */
export type Gender = "M" | "F" | "O";

export function inVoice(text: string, gender: Gender, day: number): string {
  if (!text || !text.includes("/")) return text;
  const self = gender === "M" ? "ผม" : gender === "F" ? (day >= 26 ? "ฉัน" : "หนู") : "เรา";
  const polite = gender === "M" ? "ครับ" : gender === "F" ? "ค่ะ" : "";
  const ask = gender === "M" ? "ครับ" : gender === "F" ? "คะ" : "";
  return text
    .replace(/ผม\/ฉัน|ฉัน\/ผม/g, self)
    .replace(/ครับ\/คะ|คะ\/ครับ/g, ask)
    .replace(/ครับ\/ค่ะ|ค่ะ\/ครับ/g, polite);
}
