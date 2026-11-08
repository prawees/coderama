/**
 * Thai has no full stop, so a long line reads as one run-on block. This lays a line out the way a
 * light novel would: each sentence on its own line, with a little air between them, and the English
 * clinical words and numbers picked out in a quiet colour so the eye can find them.
 *
 * A space ends a sentence only after a sentence-final word or mark (ค่ะ, ครับ, นะ, !, ?, ...), so the
 * spaces Thai puts around English words and between phrases are left alone.
 */
// A dot ends a sentence only after "..." or an English word or number: Thai abbreviations (ผอ. นศพ. รพ.) keep going
const END = /(?:ค่ะ|คะ|ครับ|ฮะ|นะ|น้า|จ้ะ|จ้า|ไหม|มั้ย|สิ|ล่ะ|เลย|เลยย|แล้ว|ด้วย|[!?…]|\.\.\.|[A-Za-z0-9]\.)["”']?$/;
const MIN = 10; // a "sentence" shorter than this joins the next one, so lines are never a word long

export function sentences(text: string): string[] {
  // A line the writer broke by hand stays exactly as written
  if (text.includes("\n")) return text.split("\n").map((part) => part.trim()).filter(Boolean);
  const parts = text.split(/(?<=\S) (?=\S)/);
  const out: string[] = [];
  let cur = "";
  for (const p of parts) {
    cur = cur ? `${cur} ${p}` : p;
    if (END.test(p) && cur.length >= MIN) { out.push(cur); cur = ""; }
  }
  if (cur) out.length && cur.length < 6 ? (out[out.length - 1] += ` ${cur}`) : out.push(cur);
  return out;
}

