/** Gifts you can buy in the Supply Closet and give to coworkers (and the cat). */
export interface Gift {
  id: string;
  name: { en: string; th: string };
  blurb: { en: string; th: string };
  cost: number;
  icon: string; // key into the pixel icon set
}

export const GIFTS: Record<string, Gift> = {
  thai_tea: { id: "thai_tea", name: { en: "Thai Iced Tea", th: "ชาเย็น" }, blurb: { en: "Orange, sweet, and dangerously large.", th: "สีส้ม หวาน และแก้วใหญ่เกินไป" }, cost: 40, icon: "tea" },
  coffee: { id: "coffee", name: { en: "Specialty Coffee", th: "กาแฟดริป" }, blurb: { en: "Single origin. The barista judged you.", th: "กาแฟซิงเกิลออริจิน บาริสต้ามองคุณแปลกๆ" }, cost: 50, icon: "coffee" },
  khanom_krok: { id: "khanom_krok", name: { en: "Khanom Krok", th: "ขนมครก" }, blurb: { en: "Coconut pancakes, still warm.", th: "ขนมครกร้อนๆ หอมกะทิ" }, cost: 35, icon: "krok" },
  mango_sticky_rice: { id: "mango_sticky_rice", name: { en: "Mango Sticky Rice", th: "ข้าวเหนียวมะม่วง" }, blurb: { en: "In season. Mostly.", th: "มะม่วงหน้านี้กำลังดี" }, cost: 80, icon: "mango" },
  garland: { id: "garland", name: { en: "Jasmine Garland", th: "พวงมาลัยมะลิ" }, blurb: { en: "Smells like temple mornings.", th: "หอมเหมือนเช้าวันพระ" }, cost: 60, icon: "garland" },
  orchid: { id: "orchid", name: { en: "Orchid Pot", th: "กระถางกล้วยไม้" }, blurb: { en: "Purple, patient, hard to kill.", th: "สีม่วง อดทน ตายยาก" }, cost: 70, icon: "orchid" },
  energy_drink: { id: "energy_drink", name: { en: "Energy Drink", th: "เครื่องดื่มชูกำลัง" }, blurb: { en: "Tiny bottle, enormous regret.", th: "ขวดเล็ก ใจสั่นใหญ่" }, cost: 20, icon: "energy" },
  handbook: { id: "handbook", name: { en: "Pocket Handbook", th: "หนังสือคู่มือพกพา" }, blurb: { en: "Dog-eared, highlighted, beloved.", th: "มุมพับ ไฮไลต์เต็ม เป็นที่รัก" }, cost: 120, icon: "book" },
  durian: { id: "durian", name: { en: "Durian", th: "ทุเรียน" }, blurb: { en: "The king of fruit. Divisive monarch.", th: "ราชาผลไม้ ที่คนรักและเกลียดพอๆ กัน" }, cost: 90, icon: "durian" },
  dried_fish: { id: "dried_fish", name: { en: "Dried Fish", th: "ปลาแห้ง" }, blurb: { en: "For a very specific coworker.", th: "สำหรับเพื่อนร่วมงานบางตัวโดยเฉพาะ" }, cost: 15, icon: "fish" },
};

export type Taste = "love" | "like" | "neutral" | "hate";

export const TASTE_POINTS: Record<Taste, number> = { love: 16, like: 8, neutral: 4, hate: -8 };
