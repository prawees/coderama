"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { motion, AnimatePresence } from "framer-motion";
import { NPCS } from "@/lib/npcs";
import { LOCATION_NAMES, phaseForDay } from "@/lib/world/maps";
import { music } from "@/lib/music";

type L = { en: string; th: string };
interface Chapter { title: L; line: L; host: string; button: L; promo?: L }

/** One page per chapter break, keyed by the day the player is about to start. */
const CHAPTERS: Record<number, Chapter> = {
  6: {
    title: { en: "Year six", th: "ขึ้นปี 6" },
    line: {
      en: "Same halls, same kettle, more on your shoulders. The interns have started asking you where things are.",
      th: "ตึกเดิม กาต้มน้ำใบเดิม แต่งานเยอะขึ้น น้องปี 5 เริ่มมาถามว่าของอยู่ตรงไหน",
    },
    host: "bob",
    button: { en: "Back to Rama", th: "กลับรามาฯ" },
    promo: { en: "Now a year six student", th: "ขึ้นเป็น extern ปี 6" },
  },
  11: {
    title: { en: "Off to Korat", th: "ไปโคราช" },
    line: {
      en: "An overnight bus north. A district hospital with more patients than beds, a nurse who has seen everything, and one senior who refuses to cut corners.",
      th: "นั่งรถทัวร์ข้ามคืนขึ้นอีสาน โรงพยาบาลจังหวัดที่คนไข้เยอะกว่าเตียง พี่พยาบาลที่เห็นมาหมดแล้ว และพี่หมอคนหนึ่งที่ไม่ยอมลัดขั้นตอน",
    },
    host: "ek",
    button: { en: "Step off the bus", th: "ลงจากรถ" },
  },
  16: {
    title: { en: "Lovely International", th: "เลิฟลี่ อินเตอร์เนชั่นแนล" },
    line: {
      en: "Bangkok. Marble floors, orchids in the lobby, a coffee machine that knows your name. The pay is good. Keep your eyes open.",
      th: "กรุงเทพฯ พื้นหินอ่อน กล้วยไม้เต็มล็อบบี้ เครื่องชงกาแฟที่จำชื่อเราได้ เงินดี แต่ต้องตาไว",
    },
    host: "kit",
    button: { en: "Badge in", th: "แตะบัตรเข้างาน" },
    promo: { en: "Graduated. Now an intern", th: "เรียนจบแล้ว เป็น intern" },
  },
  26: {
    title: { en: "Home again", th: "กลับบ้าน" },
    line: {
      en: "Residency at Rama. The same cat is asleep on the same bed. You are the one the students follow now.",
      th: "กลับมาเป็น resident ที่รามาฯ แมวตัวเดิมนอนอยู่ที่เดิม คราวนี้เป็นเราที่น้องๆ เดินตาม",
    },
    host: "pim",
    button: { en: "Start residency", th: "เริ่มเป็น resident" },
    promo: { en: "Now a first-year resident", th: "ขึ้นเป็น R1" },
  },
  31: {
    title: { en: "The department is yours", th: "ER นี้เป็นของเราแล้ว" },
    line: {
      en: "Years of night shifts, Thai tea and second chances. Whatever you did with them, the clinic remembers. Keep going as long as you like.",
      th: "เวรดึกหลายปี ชาเย็นหลายแก้ว โอกาสครั้งที่สองอีกหลายครั้ง ใช้มันยังไงไป ER ก็จำได้หมด อยู่ต่อได้นานเท่าที่อยากอยู่",
    },
    host: "ann",
    button: { en: "Keep playing", th: "เล่นต่อ" },
    promo: { en: "Now an attending", th: "เป็นอาจารย์แพทย์แล้ว" },
  },
};

const FALLBACK: Chapter = {
  title: { en: "A new chapter", th: "บทใหม่" },
  line: { en: "Another stretch of training behind you.", th: "ผ่านมาได้อีกช่วงหนึ่งแล้ว" },
  host: "ann",
  button: { en: "Continue", th: "ไปต่อ" },
};

export default function YearEndPage() {
  const router = useRouter();
  const { storyFlags, currentDay, language } = useERStore();
  const [step, setStep] = useState(0);
  const ch = CHAPTERS[currentDay] ?? FALLBACK;
  const host = NPCS[ch.host];
  const place = LOCATION_NAMES[phaseForDay(currentDay)].th;

  // How the Lovely arc went colours the homecoming
  let coda = "";
  if (currentDay === 26 && storyFlags.CORRUPT_DOC) coda = "เรื่องที่เลิฟลี่ตามมาถึงที่นี่ด้วย เรารู้ดี";
  else if (currentDay === 26 && storyFlags.WHISTLEBLOWER) coda = "กลับมาพร้อมใจที่สบาย กับเพื่อนที่น้อยลงไปสองสามคน";

  useEffect(() => {
    music.fadeToTrack("home", 2.0);
    const a = setTimeout(() => setStep((s) => Math.max(s, 1)), 1600);
    const b = setTimeout(() => setStep((s) => Math.max(s, 2)), 3600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  return (
    <PageTransition>
      <div
        className="w-full h-[100dvh] cozy-night font-pixel flex flex-col items-center justify-center p-5 relative overflow-hidden"
        onClick={() => setStep((s) => Math.min(2, s + 1))}
        data-testid="year-end"
      >
        {/* drifting stars */}
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-[3px] h-[3px] bg-[#ffe9b0] animate-pulse"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, animationDelay: `${(i % 6) * 0.4}s`, opacity: 0.6 }}
          />
        ))}

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="cozy-panel w-full max-w-sm p-5 text-center relative">
          <h1 className="text-[38px] leading-tight">{ch.title.th}</h1>
          <p className="text-[17px] leading-none mt-1.5 text-[#86522e]">{place}</p>
          {ch.promo && (
            <p className="mt-2 inline-flex items-center gap-1.5 cozy-tag px-2 py-1 text-[16px] leading-none" data-testid="chapter-promo">
              <PixelIcon name="badge" size={13} />{ch.promo.th}
            </p>
          )}

          <AnimatePresence>
            {step >= 1 && (
              <motion.p key="line" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[18px] leading-snug mt-4 text-left">
                {ch.line.th}
                {coda && <span className="block mt-2 text-[#86522e]">{coda}</span>}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 2 && host && (
              <motion.div key="host" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2.5 bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2 text-left">
                <div className="w-12 h-12 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
                  <PixelPortrait speaker={host.name.en} className="w-full h-full" />
                </div>
                <div>
                  <p className="text-[15px] leading-none text-[#86522e]">{host.name.th}</p>
                  <p className="text-[17px] leading-snug mt-1">มาแล้วเหรอ เข้ามาสิ</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 h-12">
            {step >= 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PixelButton onClick={(e) => { e.stopPropagation(); router.push("/hub"); }} variant="plum" className="w-full py-2 text-[22px]" data-testid="year-end-next">
                  {ch.button.th}
                </PixelButton>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
