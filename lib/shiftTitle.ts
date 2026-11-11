/**
 * The name a shift earns and the line under it, for the Story cards. These lines are the one place the game
 * talks like a friend posting, a little Gen Z and no more: a stretched vowel, the odd ><, never in clinical text.
 */
export interface ShiftTitle { title: string; line: string }

type G = "clean" | "minor" | "poor" | "critical" | string;

export function shiftTitle(grades: G[], fainted = false): ShiftTitle {
  const n = grades.length;
  const clean = grades.filter((g) => g === "clean").length;
  const good = grades.filter((g) => g === "clean" || g === "minor").length;
  const bad = grades.filter((g) => g === "critical").length;
  if (fainted) return { title: "หลับคาชั้นวางของ", line: "พี่ๆ มาเจอตอนเช้า ยังกอด chart อยู่เลย" };
  if (n === 0) return { title: "หมอสายหลบ", line: "ทั้งเวรไม่มีใครเห็นตัวเลย หายไปไหนมาาา" };
  if (clean === n && n >= 3) return { title: "มือทอง ER", line: "ถูกทุกขั้นทุกเคส พี่ๆ เริ่มมองหน้ากันละ ><" };
  if (clean === n) return { title: "เนี้ยบทุกเคส", line: "ถูกทุกขั้น เนี้ยบมากกก" };
  if (good === n) return { title: "รอดแบบมีสไตล์", line: "คนไข้กลับบ้านครบ พลาดนิดเดียว ชู่ว อย่าบอกใครน้า" };
  if (bad === 0 && good > 0) return { title: "มือสั่นแต่เอาอยู่", line: "มีพลาดบ้างนิดหน่อย แต่คนไข้รอดครบเลยย" };
  if (bad === 0) return { title: "รอดแบบฟลุ๊กๆ", line: "คนไข้รอดครบนะ แต่พี่ๆ ขอคุยด้วยหน่อย แง" };
  if (bad >= n) return { title: "เวรนี้ขอลืม", line: "ขอไปกอดหมอนก่อน เวรหน้าเอาใหม่น้า" };
  return { title: "กลับไปอ่านหนังสือ", line: "มีเคสที่อยากย้อนเวลากลับไปทำใหม่ ฮือ" };
}

/** A doctor's type, worked out from how the whole run has been played */
export function doctorType(stats: { stars: number; patients: number; catFriendship: number; friendTotal: number; saved: number }) {
  const { stars, patients, catFriendship, friendTotal, saved } = stats;
  if (patients >= 3 && stars / patients >= 0.6) return { title: "เป๊ะปัง", line: "guideline อยู่ในหัวตลอด ไม่ต้องเปิดเลยจ้า" };
  if (catFriendship >= 20) return { title: "ทาสแมววอร์ด", line: "ขนมเลือกแล้ว จะนอนตักคนนี้แหละ ><" };
  if (friendTotal >= 60) return { title: "ขวัญใจวอร์ด", line: "รู้หมดว่าใครชอบกินอะไร พี่ๆ เลยร้ากก ><" };
  if (saved >= 10) return { title: "ลุยไม่ถอย", line: "เคสมาเท่าไหร่ก็รับ เหนื่อยแค่ไหนก็ยังไหวอยู่น้า" };
  return { title: "เด็กปั้น ER", line: "รองเท้ายังขาวอยู่ แต่เริ่มเลอะละ แง" };
}
