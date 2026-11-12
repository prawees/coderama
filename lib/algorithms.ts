/**
 * Emergency algorithms for the ordering challenge (ลำดับชีวิต). Each is the order of actions for one situation,
 * with a short reason per step, written from the guideline named in `source`. Doses are adult doses.
 * A clinician should review this file before it is used for teaching or a competition, and again when a
 * guideline changes: the steps are short on purpose, and the order is what the player is marked on.
 */
export interface Algorithm {
  id: string;
  title: string;
  scene: string;
  source: string;
  steps: { text: string; why: string }[];
}

export const ALGORITHMS: Algorithm[] = [
  {
    id: "vf", title: "VF / pulseless VT", source: "AHA ACLS 2020, adult cardiac arrest",
    scene: "ชายอายุ 58 ปี ล้มหน้าห้องตรวจ ไม่ตอบสนอง ไม่หายใจ",
    steps: [
      { text: "ยืนยันว่าไม่ตอบสนอง ไม่หายใจ คลำ pulse ไม่ได้ เรียกทีมและขอ defibrillator", why: "เช็ค pulse ไม่เกิน 10 วินาที แล้วขอความช่วยเหลือก่อนเริ่ม" },
      { text: "เริ่ม CPR 30:2 แล้วติด monitor และแผ่น pad", why: "กดหน้าอกก่อน ไม่รอเครื่อง" },
      { text: "rhythm เป็น VF: shock biphasic 120 ถึง 200 J", why: "VF รักษาด้วยไฟฟ้า ยิ่งเร็วยิ่งรอด" },
      { text: "CPR ต่อทันที 2 นาที ระหว่างนั้นเปิด IV หรือ IO", why: "ไม่หยุดเช็ค pulse หลัง shock" },
      { text: "ยังเป็น VF: shock ครั้งที่ 2 CPR ต่อ แล้วให้ adrenaline 1 mg IV ทุก 3 ถึง 5 นาที", why: "adrenaline ให้หลัง shock ครั้งที่ 2" },
      { text: "ยังเป็น VF: shock ครั้งที่ 3 CPR ต่อ แล้วให้ amiodarone 300 mg IV bolus", why: "amiodarone สำหรับ VF ที่ดื้อต่อ shock" },
      { text: "หาและแก้สาเหตุ 5H 5T", why: "ถ้าไม่แก้สาเหตุ rhythm จะกลับมาอีก" },
    ],
  },
  {
    id: "pea", title: "PEA / asystole", source: "AHA ACLS 2020, adult cardiac arrest",
    scene: "หญิงอายุ 70 ปี บนวอร์ด หมดสติ monitor ยังมี rhythm แต่คลำ pulse ไม่ได้",
    steps: [
      { text: "ยืนยัน cardiac arrest เรียกทีม", why: "มี rhythm บนจอไม่ได้แปลว่ามี pulse" },
      { text: "เริ่ม CPR 30:2 ติด monitor", why: "CPR คุณภาพดีคือการรักษาหลัก" },
      { text: "rhythm เป็น PEA: ไม่ shock CPR ต่อ 2 นาที", why: "PEA กับ asystole ไม่ใช่ shockable rhythm" },
      { text: "เปิด IV หรือ IO ให้ adrenaline 1 mg ทันที แล้วซ้ำทุก 3 ถึง 5 นาที", why: "ใน non-shockable ให้ adrenaline เร็วที่สุด" },
      { text: "เช็ค rhythm ทุก 2 นาที เปลี่ยนคนกด", why: "คนกดล้าเร็วกว่าที่รู้ตัว" },
      { text: "หาและแก้สาเหตุ 5H 5T", why: "PEA มักมีสาเหตุที่แก้ได้ เช่น hypovolemia หรือ tension pneumothorax" },
    ],
  },
  {
    id: "brady", title: "Unstable bradycardia", source: "AHA ACLS 2020, adult bradycardia",
    scene: "ชายอายุ 74 ปี หน้ามืด HR 34 BP 76/40 เหงื่อแตก",
    steps: [
      { text: "ประเมิน airway กับ breathing ให้ O2 ถ้า hypoxemia", why: "hypoxemia เป็นสาเหตุของ bradycardia ที่พบบ่อย" },
      { text: "ติด monitor เปิด IV ทำ EKG 12 lead โดยไม่ทำให้การรักษาช้า", why: "ต้องรู้ rhythm แต่ไม่รอผล" },
      { text: "ให้ atropine 1 mg IV ซ้ำได้ทุก 3 ถึง 5 นาที รวมไม่เกิน 3 mg", why: "ยาตัวแรกของ bradycardia ที่มีอาการ" },
      { text: "ไม่ได้ผล: transcutaneous pacing หรือ dopamine หรือ adrenaline drip", why: "อย่ารอ atropine ครบถ้าคนไข้แย่ลง" },
      { text: "consult cardiology พิจารณา transvenous pacing และหาสาเหตุ", why: "pacing ผ่านผิวหนังเป็นแค่สะพาน" },
    ],
  },
  {
    id: "tachy", title: "Unstable tachycardia", source: "AHA ACLS 2020, adult tachycardia with a pulse",
    scene: "หญิงอายุ 35 ปี ใจสั่น HR 190 BP 78/50 ซึมลง",
    steps: [
      { text: "ประเมิน airway กับ breathing ให้ O2 ถ้า hypoxemia ติด monitor เปิด IV", why: "เริ่มจากพื้นฐานเสมอ" },
      { text: "ตัดสินว่า unstable: hypotension ซึม shock เจ็บหน้าอก หรือ heart failure", why: "คำว่า unstable เปลี่ยนการรักษาทั้งหมด" },
      { text: "ให้ยา sedate ถ้าทำได้โดยไม่เสียเวลา", why: "cardioversion เจ็บ แต่อย่าให้ล่าช้า" },
      { text: "synchronized cardioversion", why: "ต้อง sync เพื่อไม่ให้ไฟตกบน T wave" },
      { text: "ประเมินซ้ำ ถ้าไม่สำเร็จเพิ่มพลังงานแล้วทำซ้ำ", why: "ดูทั้ง rhythm และคนไข้" },
      { text: "หาสาเหตุและ consult", why: "หยุด rhythm ได้ยังไม่จบ" },
    ],
  },
  {
    id: "anaphylaxis", title: "Anaphylaxis", source: "World Allergy Organization 2020",
    scene: "หญิงอายุ 27 ปี กินกุ้ง 20 นาทีก่อน ผื่นทั้งตัว หายใจมีเสียงวี้ด BP 82/44",
    steps: [
      { text: "หยุดสิ่งกระตุ้น เรียกคนช่วย", why: "ถ้าเป็นยาที่กำลังหยด ให้หยุดก่อน" },
      { text: "adrenaline 1:1000 0.5 mg IM ที่ต้นขาด้านนอก", why: "ยาตัวแรกและตัวเดียวที่ช่วยชีวิต ห้ามรอยาอื่น" },
      { text: "ให้นอนราบยกขา ให้ O2 high flow", why: "ลุกนั่งทันทีทำให้ความดันตกจนหัวใจหยุดได้" },
      { text: "เปิด IV ให้ NSS 1 ถึง 2 L เร็วๆ ถ้าความดันต่ำ", why: "น้ำรั่วออกนอกหลอดเลือดมาก" },
      { text: "ไม่ดีขึ้นใน 5 ถึง 15 นาที: adrenaline IM ซ้ำ", why: "ซ้ำได้ ถ้ายังไม่ดีขึ้นจึงคิดถึง drip" },
      { text: "ยาเสริม antihistamine กับ steroid", why: "ช่วยอาการ ไม่ได้ช่วยชีวิต จึงมาทีหลัง" },
      { text: "สังเกตอาการอย่างน้อย 4 ถึง 6 ชม.", why: "อาการกลับมารอบสองได้" },
    ],
  },
  {
    id: "atls", title: "ATLS primary survey", source: "ATLS 10th edition",
    scene: "ชายอายุ 22 ปี มอเตอร์ไซค์ชนเสาไฟ กู้ภัยนำส่ง ซึม ซีด",
    steps: [
      { text: "A: airway พร้อมประคองกระดูกคอ", why: "ทางเดินหายใจอุดคร่าชีวิตเร็วที่สุด" },
      { text: "B: breathing ดูและฟังปอด มองหา tension pneumothorax", why: "แก้สิ่งที่คร่าชีวิตทันทีที่เจอ" },
      { text: "C: circulation ห้ามเลือด เปิด IV สองเส้น", why: "ช็อกในอุบัติเหตุคือเสียเลือดจนกว่าจะพิสูจน์ได้ว่าไม่ใช่" },
      { text: "D: disability ดู GCS กับรูม่านตา", why: "ทำหลัง ABC เพราะสมองต้องการเลือดกับออกซิเจน" },
      { text: "E: exposure ถอดเสื้อผ้าตรวจให้ทั่ว แล้วห่มผ้ากันตัวเย็น", why: "hypothermia ทำให้เลือดไม่แข็งตัว" },
      { text: "ตรวจเสริม: eFAST, CXR, film pelvis แล้วประเมินซ้ำ", why: "ทำข้างเตียง ไม่ย้ายคนไข้ที่ยัง unstable" },
      { text: "secondary survey ตรวจหัวจรดเท้า", why: "เริ่มเมื่อ primary survey ผ่านและคนไข้เริ่มนิ่ง" },
    ],
  },
  {
    id: "bls", title: "BLS ผู้ใหญ่ นอกโรงพยาบาล", source: "AHA BLS 2020, ระบบการแพทย์ฉุกเฉิน 1669",
    scene: "ชายวัยกลางคนล้มลงที่ป้ายรถเมล์ คุณอยู่ตรงนั้นพอดี",
    steps: [
      { text: "ดูว่าที่เกิดเหตุปลอดภัย", why: "ผู้ช่วยที่บาดเจ็บช่วยใครไม่ได้" },
      { text: "ปลุกเรียก ตบไหล่", why: "แยกคนหลับกับคนหมดสติ" },
      { text: "ตะโกนขอความช่วยเหลือ โทร 1669 และให้คนไปเอา AED", why: "ขอเครื่องให้เร็วที่สุด" },
      { text: "ดูการหายใจและคลำ pulse ไม่เกิน 10 วินาที", why: "หายใจเฮือกไม่นับว่าหายใจ" },
      { text: "กดหน้าอก 30 ครั้ง ลึก 5 ถึง 6 cm เร็ว 100 ถึง 120 ครั้ง/นาที", why: "ปล่อยให้หน้าอกคืนตัวเต็มที่ทุกครั้ง" },
      { text: "ช่วยหายใจ 2 ครั้ง แล้วกดต่อ", why: "ถ้าช่วยหายใจไม่ได้ ให้กดอย่างเดียว" },
      { text: "AED มาถึง: เปิดเครื่อง ติด pad ทำตามเสียงบอก", why: "เครื่องวิเคราะห์เอง ไม่ต้องอ่าน rhythm" },
    ],
  },
  {
    id: "se", title: "Status epilepticus", source: "American Epilepsy Society 2016",
    scene: "ชายอายุ 30 ปี ชักเกร็งกระตุกทั้งตัวมา 6 นาทีแล้วยังไม่หยุด",
    steps: [
      { text: "จัดท่า ดูแล airway ให้ O2 ติด monitor", why: "กันสำลักและ hypoxia ก่อน" },
      { text: "เจาะ DTX เปิด IV", why: "hypoglycemia เป็นสาเหตุที่แก้ได้ในหนึ่งนาที" },
      { text: "benzodiazepine: diazepam 10 mg IV หรือ midazolam 10 mg IM", why: "ยาตัวแรก ให้เมื่อชักเกิน 5 นาที" },
      { text: "ยังชักอยู่: ให้ benzodiazepine ซ้ำอีกหนึ่งครั้ง", why: "ซ้ำได้หนึ่งครั้ง" },
      { text: "ยากันชักตัวที่สอง: levetiracetam, phenytoin หรือ valproate IV", why: "ให้ภายใน 20 นาทีถ้ายังชัก" },
      { text: "ยังไม่หยุด: ใส่ท่อช่วยหายใจ ให้ยาสลบหยดต่อเนื่อง ย้าย ICU", why: "refractory status ต้องการ EEG และ ICU" },
    ],
  },
];

export const algorithmFor = (n: number) => ALGORITHMS[(n - 1) % ALGORITHMS.length];

/** 100 a step, less 40 a wrong tap, plus up to 300 for speed. Never below zero. */
export function algoScore(steps: number, wrong: number, secs: number): number {
  return Math.max(0, steps * 100 - wrong * 40 + Math.max(0, 300 - Math.round(secs) * 3));
}
