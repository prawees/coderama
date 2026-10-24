import type { Look } from "@/lib/pixel/characters";
import type { MapId, Phase } from "@/lib/world/maps";
import type { Taste } from "@/lib/gifts";

/**
 * The cast you can walk up to and talk to. Each location has its own people, taken
 * from who speaks in the story on those days, plus Kanom the clinic cat everywhere.
 * Lines warm up with friendship (hearts 0-2, 3-5, 6+), and everyone has gift tastes.
 */
type L = { en: string; th: string };
const l = (en: string, th: string): L => ({ en, th });

export interface NpcDef {
  id: string;
  name: L;
  look: Look;
  voice: number; // dialogue blip pitch
  loves: string[];
  likes: string[];
  hates: string[];
  lines: [L[], L[], L[]];
  gift: Record<Taste, L>;
  /** short scenes that play once when friendship reaches the given hearts */
  heartEvents?: { hearts: number; lines: L[] }[];
}

export const NPCS: Record<string, NpcDef> = {
  ann: {
    id: "ann",
    name: l("Nurse Ann", "พี่แอน"),
    look: { skin: "#f4c7a1", hair: "#2c2328", hairStyle: "long", outfit: "nurse", main: "#9fd3e6", accent: "#e07aa3", cap: "nurse" },
    voice: 1150,
    loves: ["thai_tea", "khanom_krok"], likes: ["coffee", "garland", "mango_sticky_rice"], hates: ["durian", "energy_drink"],
    lines: [
      [l("Bay three asked for a blanket and a second opinion. I brought the blanket.", "เตียงสามขอผ้าห่มกับความเห็นที่สอง พี่เอาผ้าห่มไปให้แล้วนะ"),
       l("If you find a pen that works, guard it with your life.", "ถ้าเจอปากกาที่เขียนติด เก็บไว้ให้ดีเลยนะ"),
       l("Drink water. I'm saying it as a nurse and as a person.", "ดื่มน้ำด้วยนะ พูดในฐานะพยาบาล และในฐานะคนคนหนึ่ง")],
      [l("You remembered Prasit's name today. Patients notice that.", "วันนี้น้องจำชื่อลุงประสิทธิ์ได้ คนไข้สังเกตนะ"),
       l("I hide the good tape in the second drawer. Now you know.", "เทปดีๆ พี่ซ่อนไว้ลิ้นชักที่สอง ตอนนี้น้องรู้แล้ว"),
       l("Some nights this place feels like a lighthouse. Some nights it's just loud.", "บางคืนที่นี่เหมือนประภาคาร บางคืนก็แค่เสียงดัง")],
      [l("I'm glad it's you on shift. I sleep better on my break.", "ดีใจที่เป็นน้องเข้าเวร พี่พักได้สบายใจขึ้น"),
       l("Whatever happens upstairs, we look after the people in these beds. Deal?", "ข้างบนจะเป็นยังไงก็ช่าง เราดูแลคนบนเตียงพวกนี้กัน ตกลงนะ"),
       l("Saved you a snack. Don't tell Bob, he'll charge rent.", "เก็บขนมไว้ให้ชิ้นนึง อย่าบอกบ๊อบนะ เดี๋ยวขอค่าเช่า")],
    ],
    gift: {
      love: l("Oh! You remembered. This is exactly my favourite.", "ว้าย จำได้ด้วย ของโปรดพี่เลย"),
      like: l("That's so thoughtful, thank you.", "น่ารักมาก ขอบใจนะ"),
      neutral: l("Thank you, that's kind of you.", "ขอบใจนะ ใจดีจัง"),
      hate: l("Ah... I'll find it a good home. Somewhere far away.", "อ่า... เดี๋ยวพี่หาบ้านดีๆ ให้มันนะ ที่ไกลๆ"),
    },
    heartEvents: [
      { hearts: 2, lines: [
        l("This is exactly what I needed. You're really thoughtful.", "นี่แหละที่พี่ต้องการเลย น้องช่างใส่ใจจริงๆ"),
        l("I was having a rough day... we lost a patient this morning.", "วันนี้พี่แย่มาก... เมื่อเช้าเราเสียคนไข้ไปคนหนึ่ง"),
        l("But this helps. Thank you.", "แต่แบบนี้ช่วยได้นะ ขอบใจ"),
      ] },
      { hearts: 4, lines: [
        l("You always know how to cheer me up. I'm glad we're working together.", "น้องรู้เสมอว่าจะทำให้พี่ยิ้มได้ยังไง ดีใจที่ได้ทำงานด้วยกัน"),
        l("In this hospital it's easy to burn out. Having you around makes it bearable.", "ที่โรงพยาบาลนี้หมดไฟง่ายมาก มีน้องอยู่ด้วยทำให้มันพอไหว"),
      ] },
    ],
  },
  bob: {
    id: "bob",
    name: l("Dr. Bob", "พี่บ๊อบ"),
    look: { skin: "#e8b089", hair: "#5a3a2a", hairStyle: "spiky", outfit: "coat", main: "#ffffff", accent: "#5f9e8e", beard: true, stethoscope: true },
    voice: 520,
    loves: ["coffee", "durian"], likes: ["energy_drink", "khanom_krok"], hates: ["garland", "orchid"],
    lines: [
      [l("Rule one: never trust a quiet ER. Rule two: never say the word quiet.", "กฎข้อแรก อย่าไว้ใจ ER ที่เงียบ กฎข้อสอง ห้ามพูดคำว่าเงียบ"),
       l("If anyone asks, I've been here since six. Spiritually.", "ถ้าใครถาม พี่อยู่ตั้งแต่หกโมง ทางจิตวิญญาณ"),
       l("The coffee machine and I are both running on fumes.", "พี่กับเครื่องชงกาแฟ ตอนนี้ทำงานด้วยไอระเหยเหมือนกัน")],
      [l("You're slower than me. You're also right more often. Annoying.", "น้องช้ากว่าพี่ แต่ถูกบ่อยกว่า น่ารำคาญจริง"),
       l("Don't copy my notes. Copy Ann's. Mine are mostly arrows.", "อย่าลอกโน้ตพี่ ลอกของแอนน์ ของพี่มีแต่ลูกศร"),
       l("Some days I remember why I picked this. Usually around 4 a.m.", "บางวันพี่ก็จำได้ว่าทำไมเลือกอาชีพนี้ ส่วนใหญ่ประมาณตีสี่")],
      [l("If they ever make me pick a favourite junior, don't tell the others.", "ถ้าให้เลือกน้องคนโปรด อย่าไปบอกคนอื่นนะ"),
       l("I signed things I shouldn't have. You don't have to. Remember that.", "พี่เคยเซ็นสิ่งที่ไม่ควรเซ็น น้องไม่จำเป็นต้องทำตาม จำไว้"),
       l("Go home on time once. Just to see what it feels like.", "ลองกลับบ้านตรงเวลาสักครั้ง แค่อยากรู้ว่าเป็นยังไง")],
    ],
    gift: {
      love: l("...Okay. Okay. You get one free favour.", "...โอเค โอเค ได้สิทธิ์ขอความช่วยเหลือฟรีหนึ่งครั้ง"),
      like: l("Huh. Decent taste, for a junior.", "อือ รสนิยมใช้ได้ สำหรับเด็กใหม่"),
      neutral: l("Thanks. I'll pretend I needed this.", "ขอบใจ พี่จะทำเป็นว่าต้องการมันพอดี"),
      hate: l("Is this a test? Am I failing?", "นี่ข้อสอบเหรอ พี่สอบตกใช่ไหม"),
    },
    heartEvents: [{ hearts: 3, lines: [
      l("Want to know a secret?", "อยากรู้ความลับไหม"),
      l("I almost quit in my second year. Ann talked me out of it with a bowl of khao tom at 4 a.m.", "ปีสองพี่เกือบลาออก แอนน์เกลี้ยกล่อมด้วยข้าวต้มชามเดียวตอนตีสี่"),
      l("So if you ever want to quit, find someone with khao tom first.", "ถ้าวันไหนอยากลาออก หาคนที่มีข้าวต้มก่อนนะ"),
    ] }],
  },
  somchai: {
    id: "somchai",
    name: l("Prof. Somchai", "อ.สมชาย"),
    look: { skin: "#e8b089", hair: "#b8b2ad", hairStyle: "receding", outfit: "coat", main: "#ffffff", accent: "#7a2f3a", glasses: true, mustache: true, stethoscope: false },
    voice: 440,
    loves: ["orchid", "handbook"], likes: ["coffee", "garland"], hates: ["energy_drink", "khanom_krok", "durian"],
    lines: [
      [l("Stand up straight. Patients can smell uncertainty.", "ยืนตัวตรง คนไข้ได้กลิ่นความลังเลนะ"),
       l("Excellence is a habit. So is paperwork.", "ความเป็นเลิศเป็นนิสัย งานเอกสารก็เช่นกัน"),
       l("My door is always open. My calendar is not.", "ประตูห้องผมเปิดเสมอ แต่ตารางงานไม่")],
      [l("You show promise. Promise is a currency. Spend it wisely.", "คุณมีแววนะ แววก็คือสกุลเงิน ใช้ให้ฉลาด"),
       l("Every hospital runs on two things: trust and budgets.", "โรงพยาบาลทุกแห่งขับเคลื่อนด้วยสองสิ่ง ความไว้ใจกับงบประมาณ"),
       l("I was once a junior who asked too many questions.", "ผมเองก็เคยเป็นหมอใหม่ที่ถามมากเกินไป")],
      [l("You remind me of myself. That is not entirely a compliment.", "คุณทำให้ผมนึกถึงตัวเอง ซึ่งไม่ใช่คำชมเสียทีเดียว"),
       l("Loyalty is remembered here. So is the other thing.", "ที่นี่จดจำความภักดี และจดจำอีกอย่างด้วย"),
       l("Come to my office sometime. Bring an open mind.", "แวะมาห้องผมบ้าง เปิดใจมาด้วยนะ")],
    ],
    gift: {
      love: l("How refined. You understand quality.", "ประณีตมาก คุณเข้าใจคุณภาพ"),
      like: l("Acceptable. Thank you.", "พอใช้ได้ ขอบคุณ"),
      neutral: l("I'll have my secretary put it somewhere.", "เดี๋ยวให้เลขาเอาไปวางไว้สักที่"),
      hate: l("I will assume this was a clerical error.", "ผมจะถือว่าเป็นความผิดพลาดทางธุรการ"),
    },
  },
  jai: {
    id: "jai",
    name: l("Pi Jai", "พี่ใจ"),
    look: { skin: "#d19a6e", hair: "#4a3f45", hairStyle: "bun", outfit: "nurse", main: "#e9eef2", accent: "#3f4a6b", cap: "nurse", blush: false },
    voice: 900,
    loves: ["garland", "mango_sticky_rice"], likes: ["thai_tea", "khanom_krok"], hates: ["coffee", "durian"],
    lines: [
      [l("Hands washed? Show me.", "ล้างมือหรือยัง ยื่นมาดูซิ"),
       l("Do not touch my trolley.", "ห้ามแตะรถเข็นพี่"),
       l("Forty-one patients. Zero excuses.", "คนไข้สี่สิบเอ็ดคน ข้ออ้างศูนย์")],
      [l("You called me before it got bad. Good. Do it again.", "เรียกพี่ก่อนมันแย่ ดีมาก ทำอีก"),
       l("Pi Ek says you're teachable. Prove him right.", "พี่เอกบอกว่าน้องสอนได้ พิสูจน์ให้ดูหน่อย"),
       l("Eat. Bangkok doctors faint more than patients.", "กินข้าวซะ หมอกรุงเทพเป็นลมบ่อยกว่าคนไข้อีก")],
      [l("I don't say this often. You're good at this.", "พี่ไม่ค่อยพูดนะ น้องทำได้ดี"),
       l("My daughter wants to be a doctor. I told her to find one like you.", "ลูกสาวพี่อยากเป็นหมอ พี่บอกให้หาหมอแบบน้องเป็นตัวอย่าง"),
       l("Come back to Korat someday. The trolley will still be mine.", "กลับมาโคราชบ้างนะ รถเข็นก็ยังเป็นของพี่อยู่ดี")],
    ],
    gift: {
      love: l("...Who told you? Fine. Thank you.", "...ใครบอกน้อง ก็ได้ ขอบใจ"),
      like: l("Hm. Good choice.", "อืม เลือกดี"),
      neutral: l("Put it in the staff room.", "เอาไปวางห้องพักพนักงาน"),
      hate: l("In this heat? Are you trying to kill me?", "อากาศร้อนขนาดนี้ จะฆ่าพี่เหรอ"),
    },
  },
  ek: {
    id: "ek",
    name: l("Pi Ek", "พี่เอก"),
    look: { skin: "#b97f55", hair: "#2c2328", hairStyle: "short", outfit: "scrubs", main: "#7f9a6a", accent: "#e8b84f", beard: true },
    voice: 600,
    loves: ["handbook", "coffee"], likes: ["khanom_krok", "thai_tea"], hates: ["orchid"],
    lines: [
      [l("Call my name when you're frightened. Early is cheap.", "กลัวเมื่อไหร่ เรียกชื่อพี่ เรียกเร็วไม่เสียอะไร"),
       l("I'm in theatre, in resus, and in your thoughts. Mostly theatre.", "พี่อยู่ห้องผ่าตัด ห้องกู้ชีพ และในความคิดน้อง ส่วนใหญ่ห้องผ่าตัด"),
       l("Write less. Look more.", "เขียนให้น้อย ดูให้มาก")],
      [l("You hesitated before the drain. Good. It means you understood.", "น้องลังเลก่อนใส่ท่อ ดีแล้ว แปลว่าเข้าใจ"),
       l("Provincial medicine is just medicine with fewer people to blame.", "หมอต่างจังหวัดก็คือหมอ แค่มีคนให้โทษน้อยลง"),
       l("Sleep when you can. Eat when you can. Teach when you can.", "นอนได้ก็นอน กินได้ก็กิน สอนได้ก็สอน")],
      [l("I stayed at Korat because someone has to. You get to choose.", "พี่อยู่โคราชเพราะต้องมีใครสักคนอยู่ น้องเลือกได้"),
       l("Whatever you choose, choose it awake.", "จะเลือกทางไหน เลือกตอนตื่นเต็มตา"),
       l("Proud of you. Don't make it weird.", "ภูมิใจในตัวน้อง อย่าทำให้มันเขินนะ")],
    ],
    gift: {
      love: l("Oh, this is wonderful. You've been paying attention.", "โห เยี่ยมมาก น้องสังเกตเก่งนะ"),
      like: l("Thank you. Really.", "ขอบใจจริงๆ"),
      neutral: l("That's kind of you.", "ใจดีจัง"),
      hate: l("I'll... give it to Beam.", "เดี๋ยว... พี่เอาไปให้บีม"),
    },
    heartEvents: [{ hearts: 3, lines: [
      l("I trained at Rama too, you know.", "รู้ไหม พี่ก็เรียนที่รามาเหมือนกัน"),
      l("I left because I wanted to be the person who stays.", "พี่ออกมาเพราะอยากเป็นคนที่อยู่"),
      l("Turns out that's a choice you make every single night.", "ปรากฏว่ามันเป็นการตัดสินใจที่ต้องทำใหม่ทุกคืน"),
    ] }],
  },
  beam: {
    id: "beam",
    name: l("Beam", "บีม"),
    look: { skin: "#d19a6e", hair: "#2c2328", hairStyle: "sidepart", outfit: "scrubs", main: "#5b7fbf", accent: "#e8b84f" },
    voice: 980,
    loves: ["energy_drink", "durian"], likes: ["mango_sticky_rice", "thai_tea"], hates: ["handbook"],
    lines: [
      [l("Nine patients before lunch. Not a competition. Obviously.", "ก่อนเที่ยงเก้าเคสแล้ว ไม่ได้แข่งนะ แน่นอน"),
       l("Khon Kaen represent!", "ขอนแก่นมาแล้วจ้า"),
       l("Do you know where they hide the good gloves?", "รู้ไหมว่าเขาซ่อนถุงมือดีๆ ไว้ไหน")],
      [l("Okay, your notes are actually good. I'm stealing your format.", "โอเค โน้ตเธอดีจริง ขอขโมยฟอร์แมตนะ"),
       l("Starting salary at Lovely is triple. Just saying.", "เงินเดือนที่เลิฟลี่สามเท่า แค่บอกเฉยๆ"),
       l("Race you to the next admission.", "แข่งกันรับเคสต่อไปไหม")],
      [l("Honestly? You're the reason I slow down sometimes.", "พูดตรงๆ เธอคือเหตุผลที่บางทีเราก็ช้าลงบ้าง"),
       l("When we're old and famous, I'm telling everyone I taught you.", "ตอนแก่แล้วดัง จะบอกทุกคนว่าเราเป็นคนสอนเธอ"),
       l("Thanks for covering me last night. I owe you a durian.", "ขอบใจที่ช่วยเมื่อคืน ติดทุเรียนลูกนึงนะ")],
    ],
    gift: {
      love: l("YES. You absolute legend!", "เย้! สุดยอดไปเลย"),
      like: l("Nice, thanks!", "ดีเลย ขอบใจ!"),
      neutral: l("Oh, cool, thanks.", "อ้อ เจ๋ง ขอบใจนะ"),
      hate: l("Friend. I have read enough books for one lifetime.", "เพื่อน เราอ่านหนังสือพอสำหรับชาตินี้แล้ว"),
    },
  },
  suk: {
    id: "suk",
    name: l("Lung Suk", "ลุงสุข"),
    look: { skin: "#9a6544", hair: "#b8b2ad", hairStyle: "short", outfit: "driver", main: "#d9c38e", accent: "#e07a3a", cap: "baseball", mustache: true, pants: "#5a5466" },
    voice: 380,
    loves: ["energy_drink", "khanom_krok"], likes: ["thai_tea", "durian"], hates: ["garland", "orchid"],
    lines: [
      [l("Twenty-eight years driving this box. She still starts. Mostly.", "ขับคันนี้มายี่สิบแปดปี ยังติดอยู่ ส่วนใหญ่นะ"),
       l("Road's clear today. The buffalo are busy.", "วันนี้ถนนโล่ง ควายไม่ว่าง"),
       l("Hungry? There's always khanom krok somewhere.", "หิวไหม ขนมครกมีขายอยู่ที่ไหนสักแห่งเสมอ")],
      [l("I've driven more babies in than most doctors have delivered.", "ลุงพาเด็กแรกเกิดมาส่งมากกว่าที่หมอหลายคนทำคลอดอีก"),
       l("Doctors come and go. The potholes stay.", "หมอมาแล้วก็ไป หลุมบนถนนอยู่ตลอด"),
       l("Sit a while. The ambulance won't miss you.", "นั่งพักก่อน รถพยาบาลไม่คิดถึงหรอก")],
      [l("You're a good kid. You say thank you to the driver.", "หนูเป็นเด็กดีนะ ขอบคุณคนขับรถด้วย"),
       l("Need a ride home at 3 a.m.? You know where I am.", "ถ้าต้องการกลับบ้านตีสาม รู้นะว่าลุงอยู่ไหน"),
       l("My wife says hello. She's never met you. She says it anyway.", "เมียลุงฝากสวัสดี ไม่เคยเจอหนูหรอก แต่ก็ฝากมา")],
    ],
    gift: {
      love: l("Ohoho! Now that's a real gift.", "โอ้โฮ! นี่สิของขวัญของจริง"),
      like: l("Thank you, doctor.", "ขอบใจนะหมอ"),
      neutral: l("Kind of you, kid.", "ใจดีจังนะหนู"),
      hate: l("Flowers? For me? What would I do with flowers?", "ดอกไม้เหรอ ให้ลุง? ลุงจะเอาไปทำอะไร"),
    },
  },
  kit: {
    id: "kit",
    name: l("Ajarn Kit", "อ.กิต"),
    look: { skin: "#e8b089", hair: "#e9e4dc", hairStyle: "sidepart", outfit: "coat", main: "#ffffff", accent: "#3f4a6b", glasses: true },
    voice: 480,
    loves: ["orchid", "coffee"], likes: ["handbook", "garland"], hates: ["energy_drink", "durian"],
    lines: [
      [l("Here, everything is available. That's the problem.", "ที่นี่มีทุกอย่างพร้อม นั่นแหละปัญหา"),
       l("Guests, not patients. Khun Mali will remind you.", "แขก ไม่ใช่คนไข้ เดี๋ยวคุณมาลีจะเตือนเอง"),
       l("The marble is cold. Wear socks.", "พื้นหินอ่อนเย็นนะ ใส่ถุงเท้าด้วย")],
      [l("You can actually resuscitate. Rare, here.", "คุณกู้ชีพเป็นจริงๆ หายากที่นี่"),
       l("I have a defibrillator in my chest. It has opinions.", "ผมมีเครื่องกระตุกหัวใจอยู่ในอก มันมีความเห็นของมันเอง"),
       l("Order what's indicated. Not what's billable.", "สั่งสิ่งที่มีข้อบ่งชี้ ไม่ใช่สิ่งที่เก็บเงินได้")],
      [l("You make me want to be braver. It's inconvenient.", "คุณทำให้ผมอยากกล้าหาญขึ้น ซึ่งไม่สะดวกเลย"),
       l("If I had started like you, I'd have ended differently.", "ถ้าผมเริ่มต้นแบบคุณ คงจบต่างไปจากนี้"),
       l("Thank you for not becoming me. Yet.", "ขอบคุณที่ยังไม่กลายเป็นผม")],
    ],
    gift: {
      love: l("Oh. That's... genuinely lovely. Thank you.", "โอ้ นี่... น่ารักจริงๆ ขอบคุณ"),
      like: l("Thoughtful. Thank you.", "รอบคอบมาก ขอบคุณ"),
      neutral: l("Thank you. I'll put it by the window.", "ขอบคุณ เดี๋ยววางไว้ริมหน้าต่าง"),
      hate: l("My cardiologist would like a word.", "หมอหัวใจผมคงอยากคุยด้วย"),
    },
    heartEvents: [{ hearts: 3, lines: [
      l("I used to read every chart twice.", "สมัยก่อนผมอ่านแฟ้มทุกเล่มสองรอบ"),
      l("Somewhere around the third stent I started reading them once. Then not at all.", "ราวๆ ขดลวดอันที่สาม ผมเริ่มอ่านรอบเดียว แล้วก็ไม่อ่านเลย"),
      l("Read them twice. Every time. Promise me.", "อ่านสองรอบนะ ทุกครั้ง สัญญากับผม"),
    ] }],
  },
  nam: {
    id: "nam",
    name: l("Pi Nam", "พี่น้ำ"),
    look: { skin: "#f4c7a1", hair: "#7a4a2c", hairStyle: "ponytail", outfit: "coat", main: "#ffffff", accent: "#c98ad1" },
    voice: 1020,
    loves: ["mango_sticky_rice", "thai_tea"], likes: ["garland", "khanom_krok"], hates: ["durian"],
    lines: [
      [l("Don't sign anything you didn't read.", "อย่าเซ็นอะไรที่ไม่ได้อ่าน"),
       l("My daughter drew me a stethoscope. It's taped to my locker.", "ลูกสาวพี่วาดหูฟังให้ แปะไว้ที่ล็อกเกอร์"),
       l("Keep your own notes. Dated.", "จดโน้ตของตัวเองไว้ ลงวันที่ด้วย")],
      [l("You notice things. That's dangerous here. And necessary.", "น้องช่างสังเกต อันตรายที่นี่ แต่จำเป็น"),
       l("Some numbers in this building don't add up.", "ตัวเลขบางอย่างในตึกนี้มันไม่ลงตัว"),
       l("Home before dark tonight. I promised her.", "คืนนี้จะกลับบ้านก่อนมืด สัญญากับลูกไว้")],
      [l("I trust you. I don't say that to anyone in this building.", "พี่ไว้ใจน้อง ในตึกนี้พี่ไม่พูดแบบนี้กับใคร"),
       l("If I disappear from the rota, it was on purpose.", "ถ้าพี่หายไปจากตารางเวร ตั้งใจหายนะ"),
       l("Thank you for being kind when it costs something.", "ขอบคุณที่ใจดีในตอนที่ความใจดีมีราคา")],
    ],
    gift: {
      love: l("You remembered! She'll want to share it.", "จำได้ด้วย! ลูกต้องอยากแบ่งกินแน่ๆ"),
      like: l("That's sweet. Thank you.", "น่ารักจัง ขอบใจนะ"),
      neutral: l("Thanks, that's kind.", "ขอบใจนะ ใจดีจัง"),
      hate: l("Not in a closed office, please.", "อย่าในห้องปิดเลยนะ ขอร้อง"),
    },
  },
  mali: {
    id: "mali",
    name: l("Khun Mali", "คุณมาลี"),
    look: { skin: "#ffdcc2", hair: "#2c2328", hairStyle: "bob", outfit: "blouse", main: "#f4c7d8", accent: "#c0567a", pants: "#3f4a6b" },
    voice: 1250,
    loves: ["orchid", "garland"], likes: ["coffee", "mango_sticky_rice"], hates: ["durian", "energy_drink"],
    lines: [
      [l("Smile! Guests can hear a frown.", "ยิ้มหน่อยค่ะ แขกได้ยินเสียงหน้าบึ้งนะคะ"),
       l("Door to doctor: eight minutes. A promise, not a wish.", "จากประตูถึงหมอแปดนาทีค่ะ เป็นคำสัญญา ไม่ใช่ความหวัง"),
       l("Have you completed your service excellence module?", "ทำโมดูลบริการเป็นเลิศครบหรือยังคะ")],
      [l("Your satisfaction scores are lovely. Lovely! Get it?", "คะแนนความพึงพอใจคุณหมอเลิฟลี่มากค่ะ เลิฟลี่! เข้าใจไหมคะ"),
       l("Between us, the orchids are fake. Don't tell the guests.", "ระหว่างเรานะคะ กล้วยไม้พวกนี้ปลอม อย่าบอกแขก"),
       l("I used to be a flight attendant. Same smile, more germs.", "เคยเป็นแอร์โฮสเตสค่ะ ยิ้มเหมือนเดิม เชื้อโรคเยอะกว่า")],
      [l("You actually listen to them. The guests. The patients. Whatever.", "คุณหมอฟังพวกเขาจริงๆ แขก คนไข้ อะไรก็แล้วแต่"),
       l("I write the scripts. You make them sound true.", "ดิฉันเขียนสคริปต์ คุณหมอทำให้มันฟังดูจริง"),
       l("Off the record? I'm glad you're here.", "นอกรอบนะคะ ดีใจที่คุณหมออยู่ที่นี่")],
    ],
    gift: {
      love: l("Oh my goodness, it's perfect! Photo for the newsletter!", "ตายแล้ว เพอร์เฟกต์มากค่ะ ขอถ่ายรูปลงจดหมายข่าว"),
      like: l("How thoughtful, thank you!", "น่ารักมากค่ะ ขอบคุณนะคะ"),
      neutral: l("Thank you so much!", "ขอบคุณมากค่ะ"),
      hate: l("We do have a fragrance policy...", "เรามีนโยบายเรื่องกลิ่นนะคะ..."),
    },
  },
  kai: {
    id: "kai",
    name: l("Pi Kai", "พี่ไก่"),
    look: { skin: "#e8b089", hair: "#2c2328", hairStyle: "bun", outfit: "nurse", main: "#f4c7d8", accent: "#e8b84f", cap: "nurse" },
    voice: 1080,
    loves: ["khanom_krok", "thai_tea"], likes: ["mango_sticky_rice", "garland"], hates: ["coffee"],
    lines: [
      [l("VIP in bay two wants a pillow menu. We have one.", "แขก VIP เตียงสองขอเมนูหมอน เรามีด้วยนะ"),
       l("The coffee here costs more than my lunch.", "กาแฟที่นี่แพงกว่าข้าวกลางวันพี่อีก"),
       l("Need gloves? I've got a secret stash.", "เอาถุงมือไหม พี่มีที่ซ่อนลับ")],
      [l("You're the first intern who learned my name in week one.", "น้องเป็นอินเทิร์นคนแรกที่จำชื่อพี่ได้ในสัปดาห์แรก"),
       l("When it gets too fancy, I think about my mum's khanom krok stall.", "เวลามันหรูเกินไป พี่นึกถึงร้านขนมครกแม่"),
       l("Resus one is yours if anything happens. I'll be right behind you.", "ถ้ามีอะไร ห้องกู้ชีพหนึ่งเป็นของน้อง พี่อยู่ข้างหลังเลย")],
      [l("You're one of us now. Nurses' table. Lunch at noon.", "น้องเป็นพวกเราแล้ว โต๊ะพยาบาล กินข้าวเที่ยงนะ"),
       l("Mum says bring the nice doctor home for khanom krok.", "แม่บอกให้พาหมอใจดีไปกินขนมครกที่บ้าน"),
       l("Whatever they offer you, you're still you. Okay?", "เขาจะเสนออะไรให้ น้องก็ยังเป็นน้องนะ โอเค?")],
    ],
    gift: {
      love: l("Just like Mum's! Okay, I might cry.", "เหมือนของแม่เลย! โอเค พี่อาจจะร้องไห้"),
      like: l("Aww, thank you!", "โอ๊ย ขอบใจนะ!"),
      neutral: l("Thanks, nong.", "ขอบใจนะน้อง"),
      hate: l("Coffee? Here? I'm boycotting it.", "กาแฟ? ที่นี่? พี่แบนอยู่นะ"),
    },
  },
  pim: {
    id: "pim",
    name: l("Pi Pim", "พี่พิม"),
    look: { skin: "#f4c7a1", hair: "#2c2328", hairStyle: "long", outfit: "coat", main: "#ffffff", accent: "#5f9e8e", glasses: true },
    voice: 1100,
    loves: ["coffee", "handbook"], likes: ["mango_sticky_rice", "thai_tea"], hates: ["durian"],
    lines: [
      [l("Second-year residents don't sleep. We buffer.", "เรซิเดนท์ปีสองไม่นอน แค่บัฟเฟอร์"),
       l("I double-check consent dates now. Every time.", "ตอนนี้พี่เช็กวันที่ใบยินยอมทุกครั้ง"),
       l("Need a hand? I have two. One's holding coffee.", "ต้องการคนช่วยไหม พี่มีสองมือ มือนึงถือกาแฟ")],
      [l("I wanted someone to ask me for two years. Thank you for asking.", "พี่อยากให้มีคนถามมาสองปี ขอบคุณที่ถามนะ"),
       l("Teaching you is the best part of my week.", "การสอนน้องคือส่วนที่ดีที่สุดของสัปดาห์"),
       l("We fix the system or it fixes us.", "ถ้าเราไม่แก้ระบบ ระบบจะแก้เรา")],
      [l("You made me braver. I'm stealing that from you.", "น้องทำให้พี่กล้าขึ้น ขอยืมไปใช้นะ"),
       l("When you're chief, hire people who ask questions.", "ตอนน้องเป็นหัวหน้า จ้างคนที่ชอบถามนะ"),
       l("Coffee's on me. Forever.", "กาแฟพี่เลี้ยงเอง ตลอดไป")],
    ],
    gift: {
      love: l("Perfect. You're perfect. This is perfect.", "เพอร์เฟกต์ น้องเพอร์เฟกต์ อันนี้ก็เพอร์เฟกต์"),
      like: l("Thank you, that's lovely.", "ขอบใจนะ น่ารักมาก"),
      neutral: l("Aw, thanks.", "โอ๊ะ ขอบใจนะ"),
      hate: l("I... respect the durian. From a distance.", "พี่... เคารพทุเรียน จากระยะไกล"),
    },
    heartEvents: [{ hearts: 3, lines: [
      l("Two of my patients on that protocol died. Probably of their disease. Probably.", "คนไข้พี่สองคนในโปรโตคอลนั้นเสียชีวิต น่าจะจากโรคของเขาเอง น่าจะ"),
      l("I'm telling you so you never have to say 'probably' about your own patients.", "พี่เล่าให้ฟัง เพื่อที่น้องจะไม่ต้องพูดคำว่า 'น่าจะ' กับคนไข้ของตัวเอง"),
    ] }],
  },
  wan: {
    id: "wan",
    name: l("Nong Wan", "น้องวัน"),
    look: { skin: "#d19a6e", hair: "#2c2328", hairStyle: "curly", outfit: "casual", main: "#f6e3b0", accent: "#5fae5a", pants: "#3f4a6b" },
    voice: 1350,
    loves: ["mango_sticky_rice", "energy_drink"], likes: ["khanom_krok", "thai_tea"], hates: ["handbook"],
    lines: [
      [l("Pi! Is it true you trained at Korat? So cool.", "พี่! จริงไหมที่พี่เคยฝึกที่โคราช เท่มาก"),
       l("I practised suturing on a banana. The banana lived.", "หนูฝึกเย็บแผลกับกล้วย กล้วยรอดค่ะ"),
       l("Can I follow you? I'll be very quiet. Mostly.", "หนูขอตามพี่ได้ไหม จะเงียบมาก ส่วนใหญ่นะคะ")],
      [l("You explain things like they matter. Because they do!", "พี่อธิบายเหมือนมันสำคัญ ก็มันสำคัญจริงๆ นี่คะ"),
       l("I wrote down everything you said yesterday. Everything.", "เมื่อวานหนูจดทุกอย่างที่พี่พูด ทุกอย่างเลย"),
       l("Do you ever get scared? You don't look scared.", "พี่เคยกลัวไหมคะ พี่ไม่ดูกลัวเลย")],
      [l("When I'm a doctor, I want to be like you.", "ถ้าหนูเป็นหมอ อยากเป็นแบบพี่"),
       l("Thank you for being patient with me. Get it? Patient?", "ขอบคุณที่อดทนกับหนูนะคะ"),
       l("Pi, you're my favourite. Don't tell the other residents.", "พี่คือคนโปรดของหนู อย่าบอกเรซิเดนท์คนอื่นนะ")],
    ],
    gift: {
      love: l("Waaah! For me?! I'll keep it forever!", "ว้าาา! ให้หนูเหรอคะ จะเก็บไว้ตลอดไปเลย!"),
      like: l("Thank you, Pi!", "ขอบคุณค่ะพี่!"),
      neutral: l("Ooh, thanks Pi!", "โอ้ ขอบคุณค่ะพี่"),
      hate: l("I... already have three of these, Pi.", "หนู... มีสามเล่มแล้วค่ะพี่"),
    },
  },
};

export const CAT = {
  name: l("Kanom", "ขนม"),
  loves: ["dried_fish"],
  hates: ["durian"],
  lines: [
    l("Kanom blinks at you slowly. This is a great honour.", "ขนมกะพริบตาช้าๆ ใส่คุณ นี่เป็นเกียรติอย่างยิ่ง"),
    l("Kanom is busy being a loaf.", "ขนมกำลังยุ่งกับการเป็นก้อนขนมปัง"),
    l("Kanom headbutts your shin. You have been chosen.", "ขนมเอาหัวชนหน้าแข้งคุณ คุณได้รับเลือกแล้ว"),
    l("Kanom purrs like a very small motorbike.", "ขนมครางเหมือนมอเตอร์ไซค์คันจิ๋ว"),
  ],
  pet: l("You pet Kanom. Your shoulders drop a little. (+5 energy)", "คุณลูบหัวขนม ไหล่คลายลงนิดหนึ่ง (+5 พลังงาน)"),
  gift: {
    love: l("Kanom devours the fish and purrs like a small engine.", "ขนมกินปลาเกลี้ยง แล้วครางเหมือนเครื่องยนต์เล็กๆ"),
    like: l("Kanom sniffs it with interest.", "ขนมดมอย่างสนใจ"),
    neutral: l("Kanom sniffs it, then sits on it.", "ขนมดมแล้วก็นั่งทับมัน"),
    hate: l("Kanom hisses at the durian. Fair.", "ขนมขู่ฟ่อใส่ทุเรียน ก็สมควรอยู่"),
  },
};

/** Who is around, and where, in each part of the campaign */
export const ROSTER: Record<Phase, { id: string; map: MapId; home: { x: number; y: number }; spots: string[] }[]> = {
  rama1: [
    { id: "ann", map: "ER_MAIN", home: { x: 8, y: 4 }, spots: ["bed1", "bed2", "bed3", "kettle", "notice"] },
    { id: "bob", map: "ER_MAIN", home: { x: 3, y: 7 }, spots: ["desk", "kettle", "waiting", "shelf"] },
    { id: "somchai", map: "ER_MAIN", home: { x: 11, y: 8 }, spots: ["window", "notice", "rug"] },
  ],
  korat: [
    { id: "jai", map: "ER_MAIN", home: { x: 7, y: 4 }, spots: ["bed1", "bed2", "bed3", "kettle"] },
    { id: "ek", map: "ER_MAIN", home: { x: 3, y: 7 }, spots: ["desk", "notice", "shelf", "bed2"] },
    { id: "beam", map: "ER_MAIN", home: { x: 12, y: 8 }, spots: ["waiting", "desk", "rug"] },
    { id: "suk", map: "AMBULANCE_BAY", home: { x: 11, y: 8 }, spots: ["ambulance", "bench", "pond"] },
  ],
  lovely: [
    { id: "kit", map: "ER_MAIN", home: { x: 5, y: 8 }, spots: ["desk", "window", "rug"] },
    { id: "nam", map: "ER_MAIN", home: { x: 3, y: 7 }, spots: ["desk", "shelf", "bed1"] },
    { id: "mali", map: "ER_MAIN", home: { x: 12, y: 8 }, spots: ["waiting", "notice", "rug"] },
    { id: "kai", map: "ER_MAIN", home: { x: 8, y: 4 }, spots: ["bed1", "bed2", "bed3", "kettle"] },
    { id: "beam", map: "AMBULANCE_BAY", home: { x: 7, y: 5 }, spots: ["bench", "pond", "path"] },
  ],
  rama2: [
    { id: "ann", map: "ER_MAIN", home: { x: 8, y: 4 }, spots: ["bed1", "bed2", "bed3", "kettle", "notice"] },
    { id: "bob", map: "ER_MAIN", home: { x: 3, y: 7 }, spots: ["desk", "kettle", "waiting"] },
    { id: "somchai", map: "ER_MAIN", home: { x: 11, y: 8 }, spots: ["window", "notice"] },
    { id: "pim", map: "ER_MAIN", home: { x: 5, y: 8 }, spots: ["desk", "bed2", "shelf"] },
    { id: "wan", map: "AMBULANCE_BAY", home: { x: 6, y: 5 }, spots: ["bench", "pond", "tree", "path"] },
  ],
};

export function heartsFor(points: number) {
  return Math.max(0, Math.min(10, Math.floor(points / 20)));
}

export function tasteOf(npc: { loves: string[]; likes?: string[]; hates: string[] }, giftId: string): Taste {
  if (npc.loves.includes(giftId)) return "love";
  if (npc.likes?.includes(giftId)) return "like";
  if (npc.hates.includes(giftId)) return "hate";
  return "neutral";
}

/** A line for today: tier by hearts, rotating by day so it changes each visit */
export function lineFor(npc: NpcDef, hearts: number, day: number, lang: "en" | "th"): string {
  const tier = hearts >= 6 ? 2 : hearts >= 3 ? 1 : 0;
  const pool = npc.lines[tier];
  return pool[(day + npc.id.length) % pool.length][lang];
}

/** Story speakers and world NPCs share faces. Map a story speaker name to a cast member. */
const SPEAKER_KEYS: [string, string][] = [
  ["somjai", "jai"], ["pi jai", "jai"], ["ekkarat", "ek"], ["pi ek", "ek"], ["kitipong", "kit"], ["ajarn kit", "kit"],
  ["napassorn", "nam"], ["pi nam", "nam"], ["pimchanok", "pim"], ["pi pim", "pim"], ["malinee", "mali"], ["khun mali", "mali"],
  ["kanyarat", "kai"], ["pi kai", "kai"], ["tawan", "wan"], ["nong wan", "wan"], ["lung suk", "suk"],
  ["beam", "beam"], ["wachira", "beam"], ["somchai", "somchai"], ["bob", "bob"], ["ann", "ann"],
];

export function npcIdForSpeaker(speaker?: string): string | null {
  const s = (speaker || "").toLowerCase();
  if (!s) return null;
  for (const n of Object.values(NPCS)) if (n.name.en.toLowerCase() === s || n.name.th === speaker) return n.id;
  for (const [key, id] of SPEAKER_KEYS) if (s.includes(key)) return id;
  return null;
}

/** Faces for story characters who never walk around the clinic */
export const EXTRA_LOOKS: Record<string, Look> = {
  anuwat: { skin: "#e8b089", hair: "#2c2328", hairStyle: "sidepart", outfit: "suit", main: "#2f3550", accent: "#e8b84f", glasses: false, blush: false },
  director: { skin: "#d19a6e", hair: "#b8b2ad", hairStyle: "receding", outfit: "suit", main: "#24262e", accent: "#8a6d1f", glasses: true },
};

/** Thai names for story speakers who are not part of the walking cast */
const OTHER_SPEAKERS: Record<string, string> = {
  "khun anuwat (vip)": "คุณอนุวัฒน์",
  "new extern": "extern ใหม่",
  "eldest son": "ลูกชายคนโต",
  "dr. tawan": "หมอตะวัน",
  "lung suk (ambulance)": "ลุงสุข (กู้ภัย)",
  "auntie noi": "ป้าน้อย",
  "prasit's daughter": "ลูกสาวลุงประสิทธิ์",
  "bob's mother": "แม่พี่บ๊อบ",
  "nong fai": "น้องฝ้าย",
};

/**
 * The name shown on the dialogue ribbon. Story files keep English speaker ids so faces
 * and voices stay matched; players see the name the ward would use. Null means narration.
 */
export function speakerLabel(speaker: string | undefined, playerName: string): string | null {
  if (!speaker || speaker === "System" || speaker === "Narrator") return null;
  if (speaker === "You") return playerName || "คุณ";
  const lower = speaker.toLowerCase();
  if (OTHER_SPEAKERS[lower]) return OTHER_SPEAKERS[lower];
  const phone = /\(phone\)/i.test(speaker) ? " (โทรศัพท์)" : "";
  const id = npcIdForSpeaker(speaker.replace(/\s*\(phone\)/i, ""));
  if (id && NPCS[id]) return NPCS[id].name.th + phone;
  return speaker;
}
