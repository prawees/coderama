/**
 * หมอ ER สายไหน: a one-minute personality quiz built from real ER moments, made to be posted to an IG Story.
 * Every option is a reasonable way to work in an ER, so there is no wrong answer; the questions sort people by how
 * they like to work, and each result comes with one pearl that is genuinely useful. A result names a "best partner"
 * type, which is what gets friends tagged.
 */
export type TypeId = "hands" | "sleuth" | "heart" | "calm";

export interface DoctorType {
  id: TypeId;
  title: string;
  line: string;
  strength: string;
  watch: string;
  pearl: string;
  partner: TypeId;
  /** a cast member who works this way */
  mascot: "bob" | "pim" | "ann" | "ek";
}

export const TYPES: Record<TypeId, DoctorType> = {
  hands: {
    id: "hands", title: "สายลงมือ", mascot: "bob", partner: "sleuth",
    line: "เห็นคนไข้ปุ๊บ มือไปก่อนสมอง (แต่สมองตามทัน)",
    strength: "เปิดเส้นเร็ว ทำหัตถการนิ่ง",
    watch: "อย่าลืมเงยหน้าดูภาพรวมบ้าง",
    pearl: "ช็อกแล้วเปิด IV ไม่ได้ใน 90 วินาที ไป IO เลย",
  },
  sleuth: {
    id: "sleuth", title: "สายนักสืบ", mascot: "pim", partner: "hands",
    line: "ยังไม่ได้ Dx คือยังไม่ได้นอน",
    strength: "จับ finding เล็กๆ ที่คนอื่นมองข้าม",
    watch: "คนไข้ไม่ stable รักษาไปก่อน หาสาเหตุตามทีหลัง",
    pearl: "ทุก arrest ไล่ 5H 5T เสมอ สาเหตุที่แก้ได้ซ่อนอยู่ในนั้น",
  },
  heart: {
    id: "heart", title: "สายใจฟู", mascot: "ann", partner: "calm",
    line: "ญาติทั้ง ER รู้จักชื่อคุณ",
    strength: "คุยข่าวร้ายได้ ทำให้คนไข้ไว้ใจ",
    watch: "ใจดีกับตัวเองด้วย พักบ้างนะ",
    pearl: "แจ้งข่าวร้าย ใช้ SPIKES เริ่มจากถามว่าญาติรู้อะไรมาแล้วบ้าง",
  },
  calm: {
    id: "calm", title: "สายนิ่งสยบโค้ด", mascot: "ek", partner: "heart",
    line: "ห้องวุ่นแค่ไหน เสียงคุณยังเท่าเดิม",
    strength: "คุมทีม แจกงานชัด ปิดลูป",
    watch: "บอกทีมด้วยว่ากำลังคิดอะไร ไม่ใช่นิ่งคนเดียว",
    pearl: "สั่งงานแบบ closed loop เรียกชื่อคน สั่งชัด ให้ทวนกลับ",
  },
};

export const QUESTIONS: { q: string; a: { text: string; t: TypeId }[] }[] = [
  { q: "โค้ดดังกลางดึก คุณไปยืนตรงไหน", a: [
    { text: "ข้างอก พร้อมกดเลย", t: "hands" },
    { text: "หน้าจอ monitor ดู rhythm", t: "sleuth" },
    { text: "ข้างญาติที่หน้าห้อง", t: "heart" },
    { text: "ปลายเตียง สั่งงานทั้งทีม", t: "calm" },
  ] },
  { q: "ตีสาม ไม่มีคนไข้ใหม่ คุณทำอะไร", a: [
    { text: "ซ้อมใส่ ET tube กับหุ่น", t: "hands" },
    { text: "อ่าน chart เคสเมื่อกี้อีกรอบ", t: "sleuth" },
    { text: "ไปคุยกับยายเตียงห้าที่นอนไม่หลับ", t: "heart" },
    { text: "เช็ครถ emergency ให้พร้อม", t: "calm" },
  ] },
  { q: "ญาติถามคำถามเดิมเป็นรอบที่ห้า", a: [
    { text: "พาไปดูคนไข้ให้เห็นกับตา", t: "hands" },
    { text: "ถามว่าเขากังวลเรื่องไหนที่สุด", t: "sleuth" },
    { text: "ตอบใหม่ใจเย็นๆ อีกรอบ", t: "heart" },
    { text: "นัดเวลาอัปเดตทุกครึ่งชั่วโมง", t: "calm" },
  ] },
  { q: "เคสที่คุณจำไม่ลืมคือ", a: [
    { text: "ใส่ chest drain สำเร็จครั้งแรก", t: "hands" },
    { text: "Dx ที่ทุกคนพลาด แต่คุณเจอ", t: "sleuth" },
    { text: "คนไข้ที่เขียนจดหมายมาขอบคุณ", t: "heart" },
    { text: "คืนที่ ER เต็มแต่ทุกคนรอด", t: "calm" },
  ] },
  { q: "ของในกระเป๋าเสื้อกาวน์ที่ขาดไม่ได้", a: [
    { text: "tourniquet กับ IV cath", t: "hands" },
    { text: "pocket handbook ที่จดเต็มเล่ม", t: "sleuth" },
    { text: "ลูกอมไว้แจกเด็ก", t: "heart" },
    { text: "ปากกาสามสี กับกระดาษจดงาน", t: "calm" },
  ] },
  { q: "รุ่นน้องโทรมาว่า คนไข้ดูไม่ดีเลยพี่", a: [
    { text: "วิ่งไปดูเองเลย", t: "hands" },
    { text: "ถาม vital signs ก่อนสามตัว", t: "sleuth" },
    { text: "บอกว่าไม่เป็นไรนะ พี่มาแล้ว", t: "heart" },
    { text: "สั่ง O2 monitor เปิดเส้น ระหว่างเดินไป", t: "calm" },
  ] },
];

/** The type with most answers; a tie goes to the last answer's type, so the final question settles it */
export function resultOf(answers: TypeId[]): TypeId {
  const n: Record<TypeId, number> = { hands: 0, sleuth: 0, heart: 0, calm: 0 };
  answers.forEach((t) => (n[t] += 1));
  const top = Math.max(...Object.values(n));
  const tied = (Object.keys(n) as TypeId[]).filter((t) => n[t] === top);
  return tied.includes(answers[answers.length - 1]) ? answers[answers.length - 1] : tied[0];
}

/** How much of each type, for the bars on the result */
export function mixOf(answers: TypeId[]): Record<TypeId, number> {
  const n: Record<TypeId, number> = { hands: 0, sleuth: 0, heart: 0, calm: 0 };
  answers.forEach((t) => (n[t] += 1));
  return n;
}
