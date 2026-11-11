/**
 * The campaign is told in chapters, so a player is always a few shifts away from the next
 * promotion or the next hospital rather than looking at a 31-day list.
 * Chapter breaks match the pages in app/summary/year-end.
 */
export interface Chapter {
  n: number;
  first: number;
  last: number;
  title: string;
  /** What finishing this chapter gets you, in a few words */
  reward?: string;
}

export const CHAPTERS: Chapter[] = [
  { n: 1, first: 1, last: 5, title: "เวรแรก", reward: "ขึ้นเป็น extern ปี 6" },
  { n: 2, first: 6, last: 10, title: "ขึ้นปี 6", reward: "ย้ายไปโคราช" },
  { n: 3, first: 11, last: 15, title: "โคราช", reward: "เรียนจบ เป็น intern" },
  { n: 4, first: 16, last: 25, title: "เลิฟลี่", reward: "กลับรามาฯ เป็น R1" },
  { n: 5, first: 26, last: 30, title: "กลับบ้าน", reward: "เป็นอาจารย์แพทย์" },
  { n: 6, first: 31, last: 31, title: "ER นี้เป็นของเรา" },
];

export function chapterOf(day: number): Chapter | null {
  return CHAPTERS.find((c) => day >= c.first && day <= c.last) ?? null;
}

/** Where a shift sits inside its chapter: which pip it is, and how many are left after it */
export function shiftInChapter(day: number) {
  const chapter = chapterOf(day);
  if (!chapter) return null;
  const total = chapter.last - chapter.first + 1;
  const position = day - chapter.first + 1;
  return { chapter, total, position, left: total - position };
}
