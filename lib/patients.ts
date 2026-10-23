import type { GiftId } from "./gifts";

/**
 * The people behind the cases. A patient arrives as a person with a name and their own
 * words, the diagnosis is revealed only when the case ends, and the ones who go home
 * write back. Thai honorifics follow how a ward would address them: Lung and Pa for
 * older neighbours, Yai for a grandmother, Nong for the young, Khun for everyone else.
 */
export type L = { en: string; th: string };

export interface Patient {
  name: L;
  age: L;
  /** Who is speaking on the patient card */
  by: L;
  quote: L;
  /** Short line for the pager when they arrive */
  pager: L;
  /** Revealed at the end of the case and kept in the scrapbook */
  dx: L;
  /** The letter that arrives the morning after a good outcome. Null when there is none. */
  letter: L | null;
  /** Signature when someone else writes on the patient's behalf */
  from?: L;
  gift?: GiftId;
  /** Written large, because the writer cannot see well */
  big?: boolean;
}

const l = (en: string, th: string): L => ({ en, th });
const yrs = (n: number) => l(String(n), `${n} ปี`);

export const PATIENTS: Record<string, Patient> = {
  case_01: {
    name: l("Lung Somsak", "ลุงสมศักดิ์"), age: yrs(72),
    by: l("His neighbour", "เพื่อนบ้าน"),
    quote: l("I found him on the kitchen floor, and his pill bottle was empty.", "ป้าเจอลุงเขานอนอยู่ที่พื้นครัว ขวดยาก็ว่างเปล่าเลยหมอ"),
    pager: l("Found collapsed at home, very slow pulse", "หมดสติที่บ้าน HR 35 ขวด digoxin ว่างเปล่าค่ะ"),
    dx: l("Digoxin toxicity", "Digoxin toxicity"),
    letter: l(
      "The pharmacist puts my pills in a box with the days of the week on it now, and my granddaughter checks it every evening before her cartoons. I am told I gave everyone a fright. Thank you for not giving up on an old man.",
      "ตอนนี้เภสัชกรจัดยาใส่กล่องแยกวันให้ลุงแล้ว หลานสาวก็คอยเช็กทุกเย็นก่อนดูการ์ตูน ได้ยินว่าลุงทำให้ทุกคนตกใจกันมาก ขอบใจหมอมากที่ไม่ทิ้งคนแก่คนนี้"),
  },
  case_02_fluids: {
    name: l("Khun Ratree", "คุณราตรี"), age: yrs(45),
    by: l("Her daughter", "ลูกสาว"),
    quote: l("Mum has been drinking plain water all day, and now she doesn't know who I am.", "แม่ดื่มแต่น้ำเปล่าทั้งวัน ตอนนี้จำหนูไม่ได้แล้วค่ะ"),
    pager: l("Three days of diarrhoea, now confused", "ถ่ายเหลวมา 3 วัน ตอนนี้ซึม สับสนค่ะ"),
    dx: l("Severe hyponatraemia with hypovolaemia", "Severe hypovolemic hyponatremia"),
    letter: l(
      "The heart clinic changed my water pill. When my stomach is upset I drink rehydration salts now, not plain water, and I keep the sachets in my handbag. My daughter says I make more sense than I used to. That is rude, but she is right.",
      "คลินิกหัวใจเปลี่ยนยาขับปัสสาวะให้แล้ว เวลาท้องเสียตอนนี้ดื่มเกลือแร่แทนน้ำเปล่า มีซองติดกระเป๋าไว้ตลอด ลูกสาวบอกว่าตอนนี้แม่พูดรู้เรื่องกว่าเดิม ฟังแล้วเสียมารยาทนิดหนึ่ง แต่ก็จริง"),
  },
  case_03_cardiac: {
    name: l("Khun Wichai", "คุณวิชัย"), age: yrs(55),
    by: l("A nurse in the waiting room", "พยาบาลหน้าห้องตรวจ"),
    quote: l("He grabbed his chest and went down. No pulse.", "กุมหน้าอกแล้วล้มลงเลยค่ะ คลำ pulse ไม่ได้"),
    pager: l("Collapsed in the waiting room", "ล้มในห้องรอตรวจ คลำ pulse ไม่ได้ค่ะ!"),
    dx: l("Cardiac arrest from ventricular fibrillation", "Cardiac arrest (VF)"),
    letter: l(
      "I have a stent, a pill box and a new habit of walking round Lumphini Park at six in the morning. My wife says I came back from somewhere far away. I am glad it was your waiting room I fell down in.",
      "ตอนนี้ผมมีขดลวดในหัวใจ มีกล่องยา และมีนิสัยใหม่คือเดินรอบสวนลุมฯ ตอนหกโมงเช้า ภรรยาบอกว่าผมเพิ่งกลับมาจากที่ไกลมาก ดีใจที่ผมล้มในห้องรอตรวจของพวกหมอ"),
  },
  case_04_svt: {
    name: l("Khun Nicha", "คุณณิชา"), age: yrs(35),
    by: l("Khun Nicha", "คุณณิชา"),
    quote: l("My heart is racing so fast, and the room won't stop spinning.", "ใจสั่นเร็วมากเลยค่ะ ห้องหมุนไม่หยุด"),
    pager: l("Racing heart, dizzy and pale", "ใจสั่นเร็วมาก หน้ามืด ตัวซีดค่ะ"),
    dx: l("Unstable supraventricular tachycardia", "Unstable SVT"),
    letter: l(
      "The cardiologist burned away the extra wire in my heart. Two months of a normal heartbeat now. Yesterday I climbed all the stairs at the BTS without stopping, just to see if I could.",
      "หมอหัวใจจี้ทางเดินไฟฟ้าส่วนเกินออกแล้วค่ะ หัวใจเต้นปกติมาสองเดือนแล้ว เมื่อวานลองเดินขึ้นบันไดบีทีเอสรวดเดียวไม่หยุดพัก แค่อยากรู้ว่าทำได้ไหม"),
  },
  case_05_asthma: {
    name: l("Nong Pun", "น้องปั้น"), age: yrs(6),
    by: l("His mother", "คุณแม่"),
    quote: l("He can't finish a sentence, and his inhaler isn't working any more.", "ลูกพูดไม่จบประโยค พ่นยาที่บ้านแล้วก็ไม่ดีขึ้นเลยค่ะ"),
    pager: l("Child, severe wheeze, smoky season", "เด็กหอบ มี wheeze พ่นยาที่บ้านไม่ดีขึ้นค่ะ"),
    dx: l("Severe asthma attack", "Severe asthma exacerbation"),
    letter: l(
      "Pun has a spacer now, and a mask for the smoky days. He drew you a picture. You are the tall one, and the stethoscope is as big as your arm because he says it was very important.",
      "ตอนนี้ปั้นมีกระบอกพ่นยาแล้ว และมีหน้ากากไว้ใส่วันที่ฝุ่นเยอะ เขาวาดรูปมาให้คุณหมอด้วยค่ะ คนตัวสูงๆ คือคุณหมอ หูฟังใหญ่เท่าแขนเพราะเขาบอกว่ามันสำคัญมาก"),
    from: l("Pun's mother", "แม่ของปั้น"),
  },
  case_06_trauma: {
    name: l("Nong Tee", "น้องตี๋"), age: yrs(22),
    by: l("The rescue volunteer", "อาสากู้ภัย"),
    quote: l("Hit a pole at speed, no helmet. He hasn't answered us since.", "ชนเสาไฟความเร็วสูง ไม่ใส่หมวก เรียกแล้วไม่ตอบเลยครับ"),
    pager: l("Motorbike crash, no helmet, drowsy", "มอไซค์ชนเสา ไม่ใส่หมวก ซึมค่ะ"),
    dx: l("Major trauma with haemorrhagic shock", "Multiple trauma with hemorrhagic shock"),
    letter: l(
      "There is a rod in my leg now. I bought a helmet with the first money I earned after I got out. My mother made me send you a photo of me wearing it, so here it is. I look silly. I am alive.",
      "ตอนนี้ขาผมมีเหล็กดามอยู่ ผมซื้อหมวกกันน็อกด้วยเงินก้อนแรกที่หาได้หลังออกจากโรงพยาบาล แม่บังคับให้ส่งรูปตอนใส่หมวกมาให้หมอดู ก็เลยส่งมาครับ หน้าตาดูไม่ได้เลย แต่ยังมีชีวิตอยู่"),
  },
  case_07: {
    name: l("Khun Ploy", "คุณพลอย"), age: yrs(27),
    by: l("Khun Ploy", "คุณพลอย"),
    quote: l("My throat feels tight. I only had shrimp fried rice.", "คอแน่นไปหมดเลยค่ะ กินแค่ข้าวผัดกุ้งเอง"),
    pager: l("Rash and wheeze after a meal", "ผื่นขึ้น หายใจมี wheeze หลังกินกุ้งค่ะ"),
    dx: l("Anaphylaxis", "Anaphylaxis"),
    letter: l(
      "I carry two adrenaline pens in my bag now, and I made all my friends practise on an orange. Still no shrimp. Still everything else.",
      "ตอนนี้พกปากกา adrenalineสองด้ามติดกระเป๋า แล้วก็ให้เพื่อนทุกคนฝึกฉีดกับส้ม ยังงดกุ้งอยู่ค่ะ แต่อย่างอื่นกินได้หมด"),
  },
  case_07_vip: {
    name: l("Khun Thanakorn", "คุณธนากร"), age: yrs(55),
    by: l("Khun Thanakorn", "คุณธนากร"),
    quote: l("It's just a little pressure. Can we please hurry this up?", "แค่แน่นๆ นิดหน่อยเอง เร็วๆ หน่อยได้ไหมครับ"),
    pager: l("Chest discomfort, hospital board member", "เคส VIP แน่นหน้าอก เป็นกรรมการโรงพยาบาลค่ะ"),
    dx: l("Suspected acute coronary syndrome", "Suspected ACS"),
    letter: l(
      "My cardiologist found two narrowings and fixed one of them. I am told the treadmill is my friend now. My assistant sends coffee for your night shift. I arranged myself a walk, which was harder.",
      "หมอหัวใจเจอเส้นเลือดตีบสองเส้น แก้ไปแล้วหนึ่ง ได้ยินว่าลู่วิ่งคือเพื่อนใหม่ของผม เลขาส่งกาแฟมาให้หมอไว้กินตอนเวรดึก ส่วนผมจัดเวลาไปเดินออกกำลังกาย ซึ่งยากกว่าเยอะ"),
    gift: "coffee",
  },
  case_08: {
    name: l("Khun Arthit", "คุณอาทิตย์"), age: yrs(32),
    by: l("The paramedic", "เจ้าหน้าที่กู้ชีพ"),
    quote: l("Short of breath since the crash, and worse every minute in the truck.", "หายใจเหนื่อยตั้งแต่รถล้ม แล้วแย่ลงเรื่อยๆ บนรถครับ"),
    pager: l("Crash victim who can't breathe", "รถล้ม เหนื่อยมากขึ้นเรื่อยๆ ค่ะ"),
    dx: l("Tension pneumothorax", "Tension pneumothorax"),
    letter: l(
      "My ribs still complain when I laugh. I laugh anyway. The drain scar is my new party trick, and my nephew believes I was shot by pirates.",
      "ซี่โครงยังเจ็บเวลาหัวเราะ แต่ผมก็ยังหัวเราะอยู่ดี แผลใส่สายระบายกลายเป็นของอวดเพื่อนอันใหม่ หลานชายเชื่อว่าผมโดนโจรสลัดยิง"),
  },
  case_09: {
    name: l("Nong Mint", "น้องมิ้นท์"), age: yrs(19),
    by: l("Her roommate", "เพื่อนร่วมห้อง"),
    quote: l("She's been so thirsty for weeks, and now she's breathing strangely.", "มิ้นท์กระหายน้ำมาหลายอาทิตย์แล้ว ตอนนี้หายใจแปลกๆ ค่ะ"),
    pager: l("Student, vomiting and drowsy", "นักศึกษา อาเจียน ซึม หายใจแปลกๆ ค่ะ"),
    dx: l("Diabetic ketoacidosis, new type 1 diabetes", "DKA, new-onset T1DM"),
    letter: l(
      "I count carbs the way I count lecture slides now. My insulin pen is pink. My roommate knows what a hypo looks like and keeps juice boxes in her bag for me. Thank you for telling me straight.",
      "ตอนนี้หนูนับคาร์บเหมือนนับสไลด์เลกเชอร์เลยค่ะ ปากกา insulin เป็นสีชมพู เพื่อนร่วมห้องรู้แล้วว่าน้ำตาลต่ำเป็นยังไง พกน้ำผลไม้กล่องไว้ให้หนูตลอด ขอบคุณที่บอกหนูตรงๆ นะคะ"),
  },
  case_10: {
    name: l("Khun Ton", "คุณต้น"), age: yrs(34),
    by: l("His brother", "พี่ชาย"),
    quote: l("He was in the bathroom, barely breathing. There was a needle.", "เจอน้องอยู่ในห้องน้ำ แทบไม่หายใจ มีเข็มตกอยู่ครับ"),
    pager: l("Unresponsive, breathing very slowly", "เรียกไม่ตื่น หายใจช้ามากค่ะ"),
    dx: l("Opioid overdose", "Opioid overdose"),
    letter: l(
      "I go to the methadone clinic every morning before work. Four months now. My brother still checks on me at night, and I have stopped minding.",
      "ผมไปคลินิก methadone ทุกเช้าก่อนไปทำงาน สี่เดือนแล้ว พี่ชายยังแวะมาดูผมตอนกลางคืนอยู่ แต่ผมไม่รำคาญแล้วครับ"),
  },
  case_11: {
    name: l("Khun Fon", "คุณฝน"), age: yrs(27),
    by: l("Khun Fon", "คุณฝน"),
    quote: l("Sudden pain low on the right, and I fainted at work.", "ปวดท้องน้อยขวาขึ้นมาทันที แล้วเป็นลมที่ทำงานค่ะ"),
    pager: l("Sudden abdominal pain, fainted", "ปวดท้องน้อยขวาทันที แล้วเป็นลมค่ะ"),
    dx: l("Ruptured ectopic pregnancy", "Ruptured ectopic pregnancy"),
    letter: l(
      "My sister says I was very rude to the anaesthetist. I am told that is a good sign. We are healing slowly, the body and the rest of it. Thank you for telling me before the operation and not after.",
      "พี่สาวบอกว่าฉันพูดจาไม่ดีกับวิสัญญีแพทย์มาก ได้ยินว่าเป็นสัญญาณที่ดี ตอนนี้ค่อยๆ หายทั้งร่างกายและเรื่องอื่นๆ ขอบคุณที่บอกฉันก่อนผ่าตัด ไม่ใช่หลังจากนั้นนะคะ"),
  },
  case_12: {
    name: l("Nong Bank", "น้องแบงก์"), age: yrs(21),
    by: l("His mother", "แม่"),
    quote: l("The fever went away this morning, but now he's cold and so sleepy.", "ไข้ลงตั้งแต่เช้าแล้วนะหมอ แต่ตอนนี้ตัวเย็น ซึมมากเลย"),
    pager: l("Day five fever, now cold and drowsy", "ไข้วันที่ 5 ไข้ลงแล้ว แต่ตัวเย็น ซึมค่ะ"),
    dx: l("Dengue shock syndrome", "Dengue shock syndrome"),
    letter: l(
      "I am back in the field, in long sleeves, under the net my mother insists on. The neighbour's daughter came home well. Our village scrubs the water jars every Sunday now, and the old men complain about it every Sunday too.",
      "ผมกลับไปทำนาแล้วครับ ใส่เสื้อแขนยาว นอนกางมุ้งตามที่แม่สั่ง ลูกสาวบ้านข้างๆ ก็กลับบ้านมาแข็งแรงดี ตอนนี้ทั้งหมู่บ้านขัดโอ่งน้ำทุกวันอาทิตย์ ลุงๆ ก็บ่นกันทุกวันอาทิตย์เหมือนกัน"),
  },
  case_13: {
    name: l("Khun Sombat", "คุณสมบัติ"), age: yrs(45),
    by: l("A neighbour", "เพื่อนบ้าน"),
    quote: l("We found him by his sprayer, foaming at the mouth. We can't wake him.", "เจอเขาอยู่ข้างถังพ่นยา น้ำลายฟูมปาก ปลุกไม่ตื่นเลย"),
    pager: l("Farmer, frothing, very slow pulse", "เกษตรกร น้ำลายฟูมปาก HR ช้ามากค่ะ"),
    dx: l("Organophosphate poisoning", "Organophosphate poisoning"),
    letter: l(
      "I still see the doctor at the mental health clinic every month. The harvest was poor again, and I am still here for it. The chemicals are locked in the shed now, and my wife keeps the key on her necklace.",
      "ผมยังไปพบหมอที่คลินิกสุขภาพจิตทุกเดือน ปีนี้ผลผลิตก็ไม่ดีอีก แต่ผมยังอยู่ตรงนี้ สารเคมีล็อกไว้ในโรงเก็บของแล้ว ภรรยาเก็บกุญแจห้อยคอไว้เอง"),
  },
  case_14: {
    name: l("Nong Benz", "น้องเบนซ์"), age: yrs(17),
    by: l("The rescue volunteer", "อาสากู้ภัย"),
    quote: l("Thrown off the bike. He's pale, and he says his hips are on fire.", "กระเด็นจากรถ ตัวซีด บอกว่าปวดสะโพกเหมือนไฟไหม้ครับ"),
    pager: l("Teen motorbike crash, in shock", "วัยรุ่น มอไซค์ล้ม ปวดสะโพก ตัวซีดค่ะ"),
    dx: l("Pelvic fracture with haemorrhage", "Pelvic fracture with hemorrhagic shock"),
    letter: l(
      "A frame, then a stick, and now I just walk slowly. My mum tells everyone at the market about you. I promised her about the helmet. I wear it now, really, even to the 7-Eleven.",
      "จากเดินด้วยวอล์กเกอร์ เป็นไม้เท้า ตอนนี้เดินช้าๆ ได้เองแล้วครับ แม่เล่าเรื่องหมอให้ทุกคนในตลาดฟัง ผมสัญญากับแม่เรื่องหมวกกันน็อกแล้ว ตอนนี้ใส่จริงๆ ใส่แม้แต่ไปเซเว่น"),
  },
  case_15: {
    name: l("Khun Mai", "คุณใหม่"), age: yrs(34),
    by: l("Khun Mai", "คุณใหม่"),
    quote: l("Can I just get a drip and an antibiotic shot? I fly on Sunday.", "ขอน้ำเกลือกับยาฉีดฆ่าเชื้อได้ไหมคะ วันอาทิตย์ต้องบินแล้ว"),
    pager: l("Walk-in with a runny nose and cough", "walk-in มีน้ำมูก ไอ ขอให้น้ำเกลือค่ะ"),
    dx: l("A common cold, not an emergency", "Common cold ไม่ใช่เคส emergency"),
    letter: l(
      "I flew to Chiang Mai, coughed for a week like you said, and got better like you said. I brought you a jasmine garland from the temple on Doi Suthep. No antibiotics were involved.",
      "ไปเชียงใหม่มาแล้วค่ะ ไอไปอาทิตย์หนึ่งอย่างที่หมอบอก แล้วก็หายอย่างที่หมอบอก ฝากพวงมาลัยมะลิจากวัดพระธาตุดอยสุเทพมาให้ด้วยค่ะ ไม่มียาฆ่าเชื้อเกี่ยวข้องเลย"),
    gift: "garland",
  },
  case_16: {
    name: l("Pa Kham", "ป้าคำ"), age: yrs(52),
    by: l("Pa Kham", "ป้าคำ"),
    quote: l("A short brown snake with spots, in the rice. Now my gums are bleeding.", "งูสีน้ำตาลตัวสั้นๆ ลายจุด อยู่ในนา ตอนนี้เลือดออกตามไรฟันจ้ะ"),
    pager: l("Snakebite with bleeding gums", "งูกัดในนา เลือดออกตามไรฟันค่ะ"),
    dx: l("Russell's viper envenomation", "Russell's viper bite (งูแมวเซา)"),
    letter: l(
      "My foot is still a little fat, but I am back for the harvest, in boots even though they are hot. My grandson calls them my doctor boots. I sent you dried fish from the canal, the good kind.",
      "เท้าป้ายังบวมอยู่นิดหน่อย แต่กลับมาเกี่ยวข้าวได้แล้ว ใส่บู๊ตด้วยนะ ถึงจะร้อนก็ตาม หลานเรียกว่ารองเท้าหมอ ป้าฝากปลาแห้งจากคลองมาให้ ของดีนะ"),
    gift: "dried_fish",
  },
  case_17: {
    name: l("Ko Aung", "โกอ่อง"), age: yrs(29),
    by: l("His co-worker, translating", "เพื่อนร่วมงานช่วยแปล"),
    quote: l("Six days of fever. He shook all over, then he fitted in the truck.", "ไข้มาหกวัน หนาวสั่น แล้วชักบนรถครับ"),
    pager: l("Migrant worker with fever and a seizure", "แรงงานพม่า ไข้ 6 วัน ชักบนรถค่ะ"),
    dx: l("Severe falciparum malaria", "Severe falciparum malaria"),
    letter: l(
      "My friend writes this in Thai for me. I sleep under the net now. All the workers were tested, and two were treated before they got sick. Nobody asked me for money before you treated me. I will remember that.",
      "เพื่อนเขียนภาษาไทยให้ผมครับ ตอนนี้ผมนอนกางมุ้งทุกคืน คนงานทุกคนได้ตรวจเลือด สองคนได้รักษาก่อนจะป่วย ไม่มีใครถามเรื่องเงินก่อนรักษาผม ผมจะจำไว้"),
  },
  case_18: {
    name: l("Khun Kaew", "คุณแก้ว"), age: yrs(24),
    by: l("The midwife", "พยาบาลผดุงครรภ์"),
    quote: l("She delivered forty minutes ago, and she will not stop bleeding.", "คลอดได้สี่สิบนาทีแล้ว เลือดยังไม่หยุดเลยค่ะ"),
    pager: l("Heavy bleeding after delivery", "คลอดได้ 40 นาที เลือดออกไม่หยุดค่ะ"),
    dx: l("Postpartum haemorrhage", "Postpartum hemorrhage"),
    letter: l(
      "My son is fat and loud and perfect. We call him Khao Hom, like the rice, because he smells that good. My mother cried when she saw your name on the discharge papers.",
      "ลูกชายอ้วนท้วน เสียงดัง สมบูรณ์แบบ เราเรียกเขาว่าข้าวหอม เหมือนข้าว เพราะตัวหอมแบบนั้นเลย แม่ร้องไห้ตอนเห็นชื่อหมอในใบจำหน่าย"),
  },
  case_19: {
    name: l("Nong Tonkla", "น้องต้นกล้า"), age: yrs(4),
    by: l("His sister, who is eleven", "พี่สาววัยสิบเอ็ดขวบ"),
    quote: l("I pulled him out of the canal. He wasn't moving.", "หนูดึงน้องขึ้นมาจากคลอง น้องไม่ขยับเลย"),
    pager: l("Child pulled from a canal", "เด็กจมน้ำในคลอง พี่สาวดึงขึ้นมาค่ะ"),
    dx: l("Drowning with hypoxic brain injury", "Drowning with hypoxic brain injury"),
    letter: l(
      "Tonkla can say my name again, and he laughs at cartoons. The village built a fence along the canal. I am learning to swim at school. When I grow up I want to be a nurse, or the person who teaches swimming.",
      "ต้นกล้าเรียกชื่อหนูได้แล้ว แล้วก็หัวเราะตอนดูการ์ตูน หมู่บ้านทำรั้วกั้นริมคลองแล้ว หนูกำลังเรียนว่ายน้ำที่โรงเรียน โตขึ้นหนูอยากเป็นพยาบาล หรือไม่ก็เป็นครูสอนว่ายน้ำค่ะ"),
    from: l("Fai, his big sister", "พี่ฝ้าย พี่สาวต้นกล้า"),
  },
  case_20: {
    name: l("Pi Chai", "พี่ชัย"), age: yrs(38),
    by: l("His co-worker", "เพื่อนร่วมงาน"),
    quote: l("The cane machine caught his hand. We brought the hand in a bag of ice.", "เครื่องตัดอ้อยดึงมือเขาเข้าไป เราเอามือใส่ถุงน้ำแข็งมาด้วยครับ"),
    pager: l("Hand caught in farm machinery", "มือขาดจากเครื่องตัดอ้อย เอามือมาด้วยค่ะ"),
    dx: l("Traumatic hand amputation", "Traumatic hand amputation"),
    letter: l(
      "My thumb works. I can hold a spoon, a cup and my daughter's hand. The new machine has its guard back on, and I am the one who checks it every morning.",
      "นิ้วโป้งใช้ได้ครับ ถือช้อน ถือแก้ว จับมือลูกสาวได้ เครื่องใหม่ใส่ที่ครอบกลับเข้าไปแล้ว และผมเป็นคนตรวจมันทุกเช้าเอง"),
  },
  case_21: {
    name: l("Lung Boonma", "ลุงบุญมา"), age: yrs(56),
    by: l("His son", "ลูกชาย"),
    quote: l("He was out in the field since six. Then he stopped making sense, and he shook.", "พ่อทำนาตั้งแต่หกโมงเช้า แล้วก็พูดไม่รู้เรื่อง ชักเกร็งครับ"),
    pager: l("Collapsed in a rice field, burning hot", "ล้มในนา ตัวร้อนจี๋ ชักเกร็งค่ะ"),
    dx: l("Exertional heat stroke", "Exertional heat stroke"),
    letter: l(
      "I work in the early mornings now and rest under the tamarind tree when the sun is high. My son brings iced water to the field in a red cooler. The health centre changed my blood pressure pill to one that does not dry me out.",
      "ตอนนี้ลุงทำนาแต่เช้า แดดแรงก็พักใต้ต้นมะขาม ลูกชายเอาน้ำเย็นใส่กระติกสีแดงมาให้ที่นา หมออนามัยเปลี่ยนยาความดันเป็นตัวที่ไม่ทำให้ตัวแห้งแล้ว"),
  },
  case_22: {
    name: l("Khun Sak", "คุณศักดิ์"), age: yrs(41),
    by: l("His wife", "ภรรยา"),
    quote: l("Fever for days, and now his eyes are yellow and he's coughing blood.", "ไข้มาหลายวัน ตอนนี้ตาเหลือง ไอเป็นเลือดค่ะ"),
    pager: l("Fever, jaundice, coughing blood", "ไข้ ตาเหลือง ไอเป็นเลือดค่ะ"),
    dx: l("Leptospirosis with pulmonary haemorrhage", "Leptospirosis with pulmonary hemorrhage"),
    letter: l(
      "Boots in the paddy now, every time. Two neighbours fell sick, but they got medicine early because you told the district. The doctor says my kidneys work as if nothing happened.",
      "ตอนนี้ใส่บู๊ตลงนาทุกครั้งครับ เพื่อนบ้านป่วยสองคน แต่ได้ยาเร็วเพราะหมอแจ้งอำเภอไว้ หมอบอกว่าไตกลับมาทำงานเหมือนไม่เคยเป็นอะไรเลย"),
  },
  case_23: {
    name: l("Khun Jane", "คุณเจน"), age: yrs(29),
    by: l("Khun Jane", "คุณเจน"),
    quote: l("I found a lump in my neck. I need a PET scan tonight, please.", "เจอก้อนที่คอค่ะ ขอทำ PET scan คืนนี้เลยได้ไหมคะ"),
    pager: l("Worried about a lump in the neck", "กังวลก้อนที่คอ ขอทำ PET scan คืนนี้ค่ะ"),
    dx: l("A reactive lymph node, and health anxiety", "Reactive lymph node กับ health anxiety"),
    letter: l(
      "The lump is gone. I stopped touching it, which you said would help and which I did not believe. I see a psychologist every two weeks now. My father would have liked you.",
      "ก้อนหายไปแล้วค่ะ ฉันเลิกคลำมัน อย่างที่หมอบอกว่าจะช่วย ซึ่งตอนนั้นฉันไม่เชื่อ ตอนนี้ไปพบนักจิตวิทยาทุกสองสัปดาห์ ถ้าพ่อยังอยู่ พ่อคงชอบหมอ"),
  },
  case_24: {
    name: l("Khun Orn", "คุณอร"), age: yrs(44),
    by: l("The recovery suite nurse", "พยาบาลห้องพักฟื้น"),
    quote: l("She's grey and cold, and her compression garment is very tight.", "ตัวซีดเย็น ชุดกระชับรัดแน่นมากค่ะ"),
    pager: l("Faint the morning after cosmetic surgery", "หน้ามืดตอนเช้า หลังผ่าตัดหน้าท้องที่คลินิกค่ะ"),
    dx: l("Bleeding after abdominoplasty", "Bleeding after abdominoplasty"),
    letter: l(
      "The scar is long, and I do not hate it. I asked for my full records like you said. The clinic changed its rules. I hope nobody else needs a night like mine.",
      "แผลเป็นยาว แต่ฉันไม่ได้เกลียดมัน ฉันขอเวชระเบียนทั้งหมดตามที่หมอแนะนำ คลินิกเปลี่ยนกฎแล้ว หวังว่าจะไม่มีใครต้องเจอคืนแบบฉันอีก"),
  },
  case_25: {
    name: l("Khun Bee", "คุณบี"), age: yrs(36),
    by: l("Her partner", "คู่ชีวิต"),
    quote: l("She can't catch her breath, and she isn't making sense.", "เธอหายใจไม่ทัน แล้วก็พูดไม่รู้เรื่องครับ"),
    pager: l("Breathless and confused after liposuction", "หอบ สับสน หลังดูดไขมันค่ะ"),
    dx: l("Fat embolism syndrome", "Fat embolism syndrome"),
    letter: l(
      "I missed the launch. My team ran it without me and it went fine, which was humbling. My memory came back in pieces and then all at once. I walk the dog more slowly now, and I enjoy it more.",
      "ฉันพลาดงานเปิดตัวสินค้า ทีมทำกันเองได้ดีมาก ซึ่งทำให้ถ่อมตัวลงเยอะ ความจำค่อยๆ กลับมาทีละนิด แล้วก็กลับมาทั้งหมดในทีเดียว ตอนนี้พาหมาเดินช้าลง แต่มีความสุขขึ้น"),
  },
  case_26: {
    name: l("Khun Kittisak", "คุณกิตติศักดิ์"), age: yrs(58),
    by: l("Khun Kittisak", "คุณกิตติศักดิ์"),
    quote: l("Pressure in my chest. My driver brought me up to the VIP floor.", "แน่นหน้าอกครับ คนขับรถพามาที่ชั้นวีไอพี"),
    pager: l("Chest pain on the VIP floor", "เจ็บหน้าอก อยู่ชั้น VIP ค่ะ"),
    dx: l("Inferior STEMI with right ventricular infarction", "Inferior STEMI with RV infarction"),
    letter: l(
      "I stopped smoking on the day of my stent and I have kept it up, mostly out of spite. The VIP entrance now goes through your department first. I am told it took two of us to change it.",
      "ผมเลิกบุหรี่วันที่ใส่ขดลวด และยังเลิกได้ ส่วนใหญ่เพราะความดื้อ ตอนนี้ทางเข้า VIP ต้องผ่าน ER ของหมอก่อน ได้ยินว่าต้องใช้ถึงสองคนกว่าจะเปลี่ยนได้"),
  },
  case_27: {
    name: l("Khun Krit", "คุณกฤษ"), age: yrs(51),
    by: l("Khun Krit", "คุณกฤษ"),
    quote: l("My friend has pancreatic cancer. I want a whole-body MRI tonight.", "เพื่อนผมเป็นมะเร็งตับอ่อน ผมขอ MRI ทั้งตัวคืนนี้เลย"),
    pager: l("Wants a scan tonight, no symptoms", "ไม่มีอาการ แต่ขอ MRI ทั้งตัวคืนนี้ค่ะ"),
    dx: l("No emergency, only reflux and worry", "GERD กับความกังวล ไม่ใช่ emergency"),
    letter: l(
      "I had my first colonoscopy. They removed one small polyp that apparently mattered. The reflux is better since I stopped eating at midnight. My assistant has instructions to tell me no more often.",
      "ผมส่องกล้องลำไส้ครั้งแรกแล้ว ตัดติ่งเนื้อเล็กๆ ออกไปหนึ่งอัน ซึ่งปรากฏว่าสำคัญ กรดไหลย้อนดีขึ้นตั้งแต่เลิกกินตอนเที่ยงคืน ผมสั่งเลขาไว้ว่าให้ปฏิเสธผมบ่อยขึ้น"),
  },
  case_28: {
    name: l("Lung Chom", "ลุงชม"), age: yrs(63),
    by: l("His wife", "ภรรยา"),
    quote: l("His jaw is locked, and his whole body cramps every time a door slams.", "กรามแข็งอ้าปากไม่ได้ ประตูปิดดังทีไรก็เกร็งทั้งตัวเลยจ้ะ"),
    pager: l("Locked jaw and painful spasms", "อ้าปากไม่ได้ เกร็งกระตุกทั้งตัวค่ะ"),
    dx: l("Generalised tetanus", "Generalized tetanus"),
    letter: l(
      "He had all three vaccine shots and made me have mine too. He still fishes in the same pond, in boots now, and he complains about the boots every single day. I like hearing him complain.",
      "ลุงฉีดวัคซีนครบสามเข็ม แล้วยังพาป้าไปฉีดด้วย ลุงยังตกปลาบ่อเดิม แต่ใส่บู๊ตแล้ว บ่นเรื่องบู๊ตทุกวัน ป้าชอบได้ยินลุงบ่นนะ"),
    from: l("Pa Saeng, his wife", "ป้าแสง ภรรยาลุงชม"),
  },
  case_29: {
    name: l("Khun Somkiat", "คุณสมเกียรติ"), age: yrs(47),
    by: l("His wife", "ภรรยา"),
    quote: l("He drank at the funeral. Now he says he can't see.", "เขาดื่มเหล้าที่งานศพ ตอนนี้บอกว่ามองไม่เห็นค่ะ"),
    pager: l("Can't see after home-made liquor", "ดื่มเหล้าต้มที่งานศพ ตอนนี้มองไม่เห็นค่ะ"),
    dx: l("Methanol poisoning", "Methanol poisoning"),
    letter: l(
      "I see shapes and colours, and my grandson's face when he comes close. They found where the bottles came from. I am learning to read with a magnifier. I wanted to write this myself, so it is very large.",
      "ผมเห็นรูปร่างกับสี และเห็นหน้าหลานตอนเขาเข้ามาใกล้ เขาเจอแหล่งที่มาของเหล้าแล้ว ผมกำลังหัดอ่านด้วยแว่นขยาย อยากเขียนจดหมายนี้เอง ตัวหนังสือเลยใหญ่มาก"),
    big: true,
  },
  case_30: {
    name: l("Nong Ice", "น้องไอซ์"), age: yrs(22),
    by: l("Her brother", "พี่ชาย"),
    quote: l("She drank something blue from a bottle in the shed. She's sorry.", "น้องดื่มน้ำสีฟ้าจากขวดในโรงเก็บของ ตอนนี้น้องเสียใจแล้วครับ"),
    pager: l("Swallowed herbicide, mouth pain", "กินยาฆ่าหญ้า เจ็บปาก เจ็บคอค่ะ"),
    dx: l("Paraquat poisoning", "Paraquat poisoning"),
    letter: null,
  },
  case_31: {
    name: l("Nong Khaotom", "น้องข้าวต้ม"), age: l("9 months", "9 เดือน"),
    by: l("His mother", "แม่"),
    quote: l("He screams and pulls his legs up, and now he's so sleepy.", "ลูกร้องกรี๊ดแล้วงอขา ตอนนี้ซึมมากเลยค่ะ"),
    pager: l("Baby with screaming spells, now floppy", "ร้องเป็นพักๆ งอขา ตอนนี้ซึมค่ะ"),
    dx: l("Intussusception", "Intussusception"),
    letter: l(
      "Khaotom eats everything now, including a sock last week. It came out. Thank you for believing me that it was not colic.",
      "ตอนนี้ข้าวต้มกินทุกอย่าง อาทิตย์ที่แล้วกินถุงเท้าไปด้วย ออกมาแล้วค่ะ ขอบคุณที่เชื่อแม่ว่ามันไม่ใช่โคลิก"),
    from: l("Khaotom's mother", "แม่ของข้าวต้ม"),
  },
  case_32: {
    name: l("Nong Pai", "น้องปาย"), age: l("5 months", "5 เดือน"),
    by: l("His mother", "แม่"),
    quote: l("He won't feed, and he stopped breathing twice today.", "ลูกไม่ยอมกินนม วันนี้หยุดหายใจไปสองรอบค่ะ"),
    pager: l("Baby with a cold, working hard to breathe", "เป็นหวัด หอบ หยุดหายใจไป 2 รอบค่ะ"),
    dx: l("Severe RSV bronchiolitis", "Severe RSV bronchiolitis"),
    letter: l(
      "Pai is round and noisy and sleeps through the night, sometimes. His sister washes her hands before she touches him now, very seriously, like a surgeon.",
      "ปายตัวกลม เสียงดัง นอนยาวทั้งคืนได้แล้ว บางคืนนะคะ พี่สาวล้างมือก่อนจับน้องทุกครั้ง ทำหน้าจริงจังเหมือนหมอผ่าตัดเลย"),
    from: l("Pai's mother", "แม่ของปาย"),
  },
  case_33: {
    name: l("Nong Kla", "น้องกล้า"), age: l("12 days", "12 วัน"),
    by: l("His mother", "แม่"),
    quote: l("He's just not right. He won't feed, and he feels cold.", "ลูกดูไม่เหมือนเดิม ไม่ยอมดูดนม ตัวเย็นๆ ค่ะ"),
    pager: l("Newborn, not feeding, cold", "ทารกไม่ดูดนม ตัวเย็นค่ะ"),
    dx: l("Group B streptococcal sepsis and meningitis", "GBS sepsis with meningitis"),
    letter: l(
      "His hearing test was normal, and he grabs my hair very hard. At his last check the doctor said he is right on time with everything. Thank you for believing me when all I could say was that he was not right.",
      "ผลตรวจการได้ยินปกติ แล้วก็ดึงผมแม่แรงมาก ตรวจครั้งล่าสุดหมอบอกว่าพัฒนาการตรงตามวัยทุกอย่าง ขอบคุณที่เชื่อแม่ ตอนที่แม่พูดได้แค่ว่าลูกดูไม่เหมือนเดิม"),
    from: l("Kla's mother", "แม่ของกล้า"),
  },
  case_34: {
    name: l("Khun Dao", "คุณดาว"), age: yrs(22),
    by: l("The ambulance nurse", "พยาบาล EMS"),
    quote: l("Thirty-four weeks. She fitted at home, and again in the ambulance.", "GA 34 wk ค่ะ ชักที่บ้าน แล้วชักอีกรอบบนรถ"),
    pager: l("Pregnant, 34 weeks, seizures", "GA 34 wk ชักที่บ้าน แล้วชักอีกรอบบนรถค่ะ"),
    dx: l("Eclampsia with HELLP syndrome", "Eclampsia with HELLP syndrome"),
    letter: l(
      "My son came home at three weeks, small and furious. My blood pressure is normal now. Next time I will take the aspirin early, I promise. My husband came back from sea and cried in the car park.",
      "ลูกชายกลับบ้านตอนสามสัปดาห์ ตัวเล็กแต่โวยวายเก่งมาก ความดันฉันปกติแล้ว ท้องหน้าจะกิน aspirin ตั้งแต่เนิ่นๆ สัญญาค่ะ สามีกลับจากทะเลมาร้องไห้อยู่ที่ลานจอดรถ"),
  },
  case_35: {
    name: l("Khun Mook", "คุณมุก"), age: yrs(31),
    by: l("The midwife", "พยาบาลผดุงครรภ์"),
    quote: l("She said she felt cold and frightened. Then she collapsed.", "เธอบอกว่ารู้สึกหนาวและกลัวมาก แล้วก็ฟุบไปเลยค่ะ"),
    pager: l("Collapse in the labour room", "ห้องคลอด คนไข้วูบหมดสติค่ะ!"),
    dx: l("Amniotic fluid embolism", "Amniotic fluid embolism"),
    letter: l(
      "My daughter is called Fah, the sky. I do not remember that night. My husband remembers all of it and still cannot talk about it. Thank you to every one of you who was in that room.",
      "ลูกสาวชื่อฟ้าค่ะ ฉันจำคืนนั้นไม่ได้เลย สามีจำได้ทุกอย่าง และยังพูดถึงมันไม่ได้ ขอบคุณทุกคนที่อยู่ในห้องนั้นนะคะ"),
  },
  case_36: {
    name: l("Khun Duangjai", "คุณดวงใจ"), age: yrs(49),
    by: l("Khun Duangjai", "คุณดวงใจ"),
    quote: l("I fainted at the baggage belt. I can't get my breath.", "เป็นลมที่สายพานกระเป๋าค่ะ หายใจไม่ทันเลย"),
    pager: l("Collapsed after a long flight", "เป็นลมที่สนามบินหลังบินไกล หอบค่ะ"),
    dx: l("Massive pulmonary embolism", "Massive PE"),
    letter: l(
      "I take my tablet every morning with my tea. The new knee is wonderful, of all things. I explain to anyone who will listen why the injections after surgery matter. My friends have stopped listening. I keep explaining.",
      "ฉันกินยาทุกเช้าพร้อมชา เข่าใหม่ดีมากเลย ใครจะเชื่อ ฉันอธิบายให้ทุกคนที่ยอมฟังว่ายาฉีดหลังผ่าตัดสำคัญยังไง เพื่อนๆ เลิกฟังแล้ว แต่ฉันก็ยังอธิบายต่อ"),
  },
  case_37: {
    name: l("Khun Prasert", "คุณประเสริฐ"), age: yrs(62),
    by: l("His daughter", "ลูกสาว"),
    quote: l("A tearing pain in his back, like something ripped, when he lifted the suitcase.", "พ่อปวดหลังเหมือนมีอะไรฉีกขาด ตอนยกกระเป๋าเดินทางค่ะ"),
    pager: l("Tearing pain through to the back", "ปวดหลังเหมือนถูกฉีก ตอนยกกระเป๋าค่ะ"),
    dx: l("Type A aortic dissection", "Type A aortic dissection"),
    letter: l(
      "My blood pressure was 118 over 70 this morning. I write it in my little book. My daughter is being watched for her own aorta, which was your idea. I think I owe you two lives.",
      "เช้านี้ความดัน 118/70 ผมจดในสมุดเล่มเล็กทุกวัน ลูกสาวผมได้ตรวจติดตามหลอดเลือดแดงใหญ่ของเธอด้วย ซึ่งเป็นความคิดของหมอ ผมว่าผมติดหนี้หมอสองชีวิต"),
  },
  case_38: {
    name: l("Khun Somporn", "คุณสมพร"), age: yrs(54),
    by: l("His wife", "ภรรยา"),
    quote: l("He vomited a bucket of blood. He's been muddled for two days.", "เขาอาเจียนเป็นเลือดเต็มถัง สับสนมาสองวันแล้วค่ะ"),
    pager: l("Vomiting fresh blood", "อาเจียนเป็นเลือดสดเต็มถังค่ะ"),
    dx: l("Bleeding oesophageal varices", "Variceal bleeding"),
    letter: l(
      "Six months without a drink. I go for my banding like a haircut. My wife has stopped hiding the car keys.",
      "หกเดือนแล้วที่ไม่แตะเหล้า ไปรัดหลอดเลือดขอดเหมือนไปตัดผม ภรรยาเลิกซ่อนกุญแจรถแล้วครับ"),
  },
  case_39: {
    name: l("Khun Chaiwat", "คุณชัยวัฒน์"), age: yrs(57),
    by: l("Khun Chaiwat", "คุณชัยวัฒน์"),
    quote: l("My leg hurts like nothing I've ever felt. I cut it on an oyster crate.", "ขาเจ็บแบบที่ไม่เคยเจ็บมาก่อน โดนลังหอยนางรมบาดครับ"),
    pager: l("Severe leg pain and fever, liver disease", "ปวดขามาก ไข้ มีโรคตับอยู่เดิมค่ะ"),
    dx: l("Necrotising fasciitis from Vibrio vulnificus", "Necrotizing fasciitis (Vibrio vulnificus)"),
    letter: l(
      "I walk with a stiff leg and a cane, and I am back at the market. My son wears gloves now and shouts at anyone who does not. I sent you dried fish from the stall.",
      "ผมเดินขาแข็งๆ กับไม้เท้า แต่กลับมาขายของที่ตลาดแล้ว ลูกชายใส่ถุงมือทุกวัน ใครไม่ใส่โดนตะโกนใส่ ส่งปลาแห้งจากแผงมาฝากหมอด้วยครับ"),
    gift: "dried_fish",
  },
  case_40: {
    name: l("Khun Nok", "คุณนก"), age: yrs(33),
    by: l("Her mother", "แม่"),
    quote: l("She's burning hot, her heart is racing, and she's confused. She's 22 weeks pregnant.", "ลูกตัวร้อนจี๋ ใจสั่นเร็ว สับสน ท้องได้ 22 สัปดาห์ค่ะ"),
    pager: l("Pregnant, fever, racing heart", "ท้อง 22 wk ไข้สูง ใจสั่น สับสนค่ะ"),
    dx: l("Thyroid storm", "Thyroid storm"),
    letter: l(
      "My daughter was born at 38 weeks and she is perfect. I take my thyroid pills and I only read what my doctor tells me to. I am sorry I stopped them. Thank you for not making me feel stupid.",
      "ลูกสาวคลอดตอน 38 สัปดาห์ สมบูรณ์ดีทุกอย่าง ฉันกินยาไทรอยด์ทุกวัน และอ่านแต่ที่หมอบอกให้อ่าน ขอโทษที่เคยหยุดยาเองค่ะ ขอบคุณที่ไม่ทำให้ฉันรู้สึกโง่"),
  },
  case_41: {
    name: l("Yai Bua", "ยายบัว"), age: yrs(71),
    by: l("Her neighbour", "เพื่อนบ้าน"),
    quote: l("I found her on the floor, cold as anything, and I couldn't wake her.", "เจอยายนอนอยู่ที่พื้น ตัวเย็นเฉียบ ปลุกไม่ตื่นเลย"),
    pager: l("Found cold and unrousable at home", "พบตัวเย็นที่บ้าน ปลุกไม่ตื่นค่ะ"),
    dx: l("Myxoedema coma", "Myxedema coma"),
    letter: l(
      "The pharmacy delivers my thyroid pills now. A nurse visits on Fridays, and we have tea while she checks my pills. I am warm again. I did not know how cold I had been. I sent you a tin of the tea we drink.",
      "ตอนนี้ร้านยาส่งยาไทรอยด์มาถึงบ้าน มีพยาบาลมาเยี่ยมทุกวันศุกร์ เรานั่งดื่มชาด้วยกันระหว่างที่เขาเช็กยาให้ ยายอุ่นขึ้นแล้ว ไม่รู้ตัวเลยว่าที่ผ่านมาหนาวขนาดไหน ฝากชาที่เราดื่มกันมาให้หนึ่งกระป๋องนะ"),
    gift: "thai_tea",
  },
  case_42: {
    name: l("Khun Golf", "คุณกอล์ฟ"), age: yrs(26),
    by: l("His foreman", "หัวหน้าคนงาน"),
    quote: l("He's been fitting nonstop for twenty-five minutes. He ran out of pills.", "เขาชักไม่หยุดมายี่สิบห้านาทีแล้ว ยากันชักหมดครับ"),
    pager: l("A seizure that won't stop", "ชักไม่หยุดมา 25 นาทีแล้วค่ะ!"),
    dx: l("Status epilepticus from neurocysticercosis", "Status epilepticus จาก neurocysticercosis"),
    letter: l(
      "I take my pills at eight every morning with an alarm on my phone. The hospital near the site gives me three months at a time. No seizures since. My foreman lets me go to clinic without losing a day's pay.",
      "ผมกินยาตอนแปดโมงเช้าทุกวัน ตั้งปลุกในมือถือไว้ โรงพยาบาลใกล้ไซต์ให้ยาครั้งละสามเดือน ไม่ชักอีกเลย หัวหน้าให้ไปหาหมอได้โดยไม่หักค่าแรงครับ"),
  },
  case_43: {
    name: l("Khun Tum", "คุณตั้ม"), age: yrs(39),
    by: l("Khun Tum", "คุณตั้ม"),
    quote: l("Ten out of ten. Pethidine works. Nothing else does.", "ปวดสิบเต็มสิบครับ ขอ pethidine เถอะ ตัวอื่นไม่ช่วยเลย"),
    pager: l("Back pain, asking for pethidine", "ปวดหลัง ขอ pethidine ค่ะ"),
    dx: l("Chronic back pain with opioid use disorder", "Chronic back pain กับ opioid use disorder"),
    letter: l(
      "I am on methadone, and I go to the pain clinic on Tuesdays. The pain is still there, but it does not run my life. You were the first one who did not write me off.",
      "ตอนนี้ผมกิน methadone ไปคลินิกระงับปวดทุกวันอังคาร ยังปวดอยู่ แต่มันไม่ได้คุมชีวิตผมแล้ว หมอเป็นคนแรกที่ไม่ตัดสินผมครับ"),
  },
  case_44: {
    name: l("Khun Nat", "คุณณัฐ"), age: yrs(28),
    by: l("His colleague", "เพื่อนร่วมงาน"),
    quote: l("The ladder touched the power line, and he flew off the roof.", "บันไดไปโดนสายไฟแรงสูง เขากระเด็นลงจากหลังคาครับ"),
    pager: l("Electrocuted, fell from a roof", "ไฟดูด ตกจากหลังคาค่ะ"),
    dx: l("High-voltage electrical injury", "High-voltage electrical injury"),
    letter: l(
      "My hand opens and closes. Not perfectly, but it holds a cup. The aluminium ladders were taken off every site. I am training to be a safety officer, which my mother finds very funny.",
      "มือผมกำและแบได้แล้ว ไม่ได้ดีที่สุด แต่ถือแก้วได้ บันไดอะลูมิเนียมถูกเก็บออกจากทุกไซต์ ผมกำลังเรียนเป็นเจ้าหน้าที่ความปลอดภัย แม่ขำมาก"),
  },
  case_45: {
    name: l("Khun Joe", "คุณโจ้"), age: yrs(34),
    by: l("A co-worker", "เพื่อนร่วมงาน"),
    quote: l("The gas tank blew up in the kitchen, and he was stuck inside.", "ถังแก๊สระเบิดในครัว เขาติดอยู่ข้างในครับ"),
    pager: l("Kitchen explosion, burns, hoarse voice", "ถังแก๊สระเบิด ไฟไหม้ เสียงแหบค่ะ"),
    dx: l("Major burns with inhalation injury", "Major burn with inhalation injury"),
    letter: l(
      "Pressure garments for two years, they tell me. I am back in a kitchen, an open one, with an extinguisher by every door. On Fridays I cook for the burns ward. I sent you khanom krok from my stall.",
      "ต้องใส่ชุดรัดอีกสองปี เขาว่าอย่างนั้น ผมกลับมาทำครัวแล้ว เป็นครัวเปิด มีถังดับเพลิงทุกประตู ทุกวันศุกร์ผมทำอาหารให้ผู้ป่วยหอไฟไหม้ ส่งขนมครกจากร้านมาฝากหมอด้วยครับ"),
    gift: "khanom_krok",
  },
  case_46: {
    name: l("Khun Boy", "คุณบอย"), age: yrs(26),
    by: l("A police officer", "ตำรวจ"),
    quote: l("He was running into traffic and fighting us. We had to cuff him.", "วิ่งตัดหน้ารถ ต่อสู้กับเจ้าหน้าที่ ต้องใส่กุญแจมือครับ"),
    pager: l("Agitated and hot, brought by police", "คลุ้มคลั่ง ตัวร้อน ตำรวจพามาค่ะ"),
    dx: l("Stimulant toxicity with hyperthermia", "Stimulant toxicity with hyperthermia"),
    letter: l(
      "I do not remember any of it. My friends say I was lucky you turned me over first. I am in a programme now, and I sleep at night. I wanted to say thank you while I still mean it. I do.",
      "ผมจำอะไรไม่ได้เลย เพื่อนบอกว่าโชคดีที่หมอพลิกตัวผมก่อนเป็นอย่างแรก ตอนนี้ผมเข้าโปรแกรมบำบัดแล้ว นอนหลับตอนกลางคืนได้ อยากขอบคุณตอนที่ยังรู้สึกแบบนี้อยู่ ซึ่งผมรู้สึกจริงๆ ครับ"),
  },
  case_47: {
    name: l("Pa Somsri", "ป้าสมศรี"), age: yrs(66),
    by: l("Her daughter", "ลูกสาว"),
    quote: l("Mum can't speak, and her right side has gone floppy.", "แม่พูดไม่ได้ แขนขาขวาอ่อนแรงค่ะ"),
    pager: l("Sudden weakness, can't speak", "แขนขาขวาอ่อนแรง พูดไม่ได้ทันทีค่ะ"),
    dx: l("Acute ischaemic stroke", "Acute ischemic stroke"),
    letter: l(
      "I walk to the market again. Some words hide from me, but my daughter finds them. When my nose bleeds I phone the stroke nurse instead of stopping my pill. She always answers. I sent you an orchid from my garden.",
      "ป้าเดินไปตลาดได้อีกแล้ว คำบางคำยังหลบหน้าอยู่ แต่ลูกสาวช่วยหาให้ เวลาเลือดกำเดาไหล ป้าโทรหาพยาบาลคลินิกสโตรกแทนที่จะหยุดยาเอง เธอรับสายทุกครั้ง ส่งกล้วยไม้จากสวนป้ามาให้ด้วยนะ"),
    gift: "orchid",
  },
  case_48: {
    name: l("Nong Praew", "น้องแพรว"), age: yrs(17),
    by: l("The school nurse", "พยาบาลประจำโรงเรียน"),
    quote: l("Fever and leg pain since last night, and now a rash that won't fade.", "ไข้กับปวดขาตั้งแต่เมื่อคืน ตอนนี้มีผื่นที่กดแล้วไม่จางค่ะ"),
    pager: l("Teen with fever and a spreading rash", "ไข้ ผื่นจ้ำเลือดลามเร็วค่ะ"),
    dx: l("Meningococcal septicaemia", "Meningococcemia"),
    letter: l(
      "I am back at school with a slightly different foot. I am learning to run again. Everyone in my dorm got vaccinated. Mum says nine hours is a number she will never forget, and neither will I.",
      "หนูกลับไปเรียนแล้ว เท้าหน้าตาเปลี่ยนไปนิดหน่อย กำลังหัดวิ่งใหม่ เพื่อนในหอพักฉีดวัคซีนกันทุกคน แม่บอกว่าเก้าชั่วโมงเป็นตัวเลขที่แม่ไม่มีวันลืม หนูก็เหมือนกันค่ะ"),
  },
  case_49: {
    name: l("Khun Yod", "คุณยอด"), age: yrs(45),
    by: l("The rescue team", "ทีมกู้ภัย"),
    quote: l("Pinned under a slab for six hours. He's been talking to us the whole time.", "ติดอยู่ใต้แผ่นปูนหกชั่วโมง คุยกับเราตลอดเลยครับ"),
    pager: l("Freed after six hours under concrete", "ติดใต้แผ่นปูน 6 ชั่วโมง เพิ่งช่วยออกมาค่ะ"),
    dx: l("Crush syndrome", "Crush syndrome"),
    letter: l(
      "I walk on my new leg, and on my old one as much as it lets me. My kidneys woke up. I am back on site as a foreman now, and I check the shoring myself.",
      "ผมเดินด้วยขาใหม่ และขาเดิมเท่าที่มันยอม ไตผมตื่นแล้ว ตอนนี้กลับไปไซต์ในฐานะหัวหน้าคนงาน และตรวจค้ำยันเองทุกครั้ง"),
  },
  case_50: {
    name: l("Mr Hiro", "คุณฮิโระ"), age: yrs(34),
    by: l("The paramedic", "เจ้าหน้าที่กู้ชีพ"),
    quote: l("Tour bus passenger. Can't breathe, belly's tight, and there are thirty more behind him.", "ผู้โดยสารรถทัวร์ หายใจไม่ออก ท้องแข็ง ข้างหลังยังมีอีกสามสิบคนครับ"),
    pager: l("Mass casualty, first wave arriving", "mass casualty รถทัวร์คว่ำ ระลอกแรกกำลังมาค่ะ!"),
    dx: l("Mass casualty triage, splenic and chest injuries", "Mass casualty triage: splenic injury กับ chest trauma"),
    letter: l(
      "I am home in Osaka. My Thai is still very bad, but I learned one sentence to write to you myself: khob khun mak khrap.",
      "ผมกลับบ้านที่โอซาก้าแล้ว ภาษาไทยของผมยังแย่มาก แต่หัดเขียนประโยคนี้เองเพื่อหมอ ขอบคุณมากครับ"),
  },
};

export const patientFor = (caseId: string): Patient | undefined => PATIENTS[caseId];
