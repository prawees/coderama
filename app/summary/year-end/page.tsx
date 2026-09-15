"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore, getEra } from "@/lib/erStore";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { motion, AnimatePresence } from "framer-motion";

export default function YearEndPage() {
  const router = useRouter();
  const { storyFlags, currentDay, language } = useERStore();
  const [step, setStep] = useState(0);

  const upcomingEra = getEra(currentDay); // currentDay is already 6, 11, 16, or 31

  let title = language === 'th' ? "จบเอพพิโซด" : "EPISODE COMPLETE";
  let subtitle = language === 'th' ? "คุณรอดพ้นการฝึกไปได้อีกช่วงหนึ่ง" : "You survived another phase of your training.";
  let nextStageName = language === 'th' ? "เริ่มการเดินทางต่อ" : "CONTINUE JOURNEY";
  let description = "";

  if (upcomingEra === 'MED_Y6') {
    title = language === 'th' ? "เลื่อนขั้นเป็น Extern (ปี 6)" : "PROMOTED TO EXTERN (YEAR 6)";
    subtitle = language === 'th' ? "ยินดีต้อนรับสู่โรงพยาบาลโคราช" : "Welcome to Korat Hospital.";
    nextStageName = language === 'th' ? "เริ่มปี Extern" : "START EXTERN YEAR";
    description = language === 'th' ? "คุณถูกส่งไปที่โรงพยาบาลโคราชในช่วงปี Extern คนไข้เยอะ ขาดแคลนคน และคุณต้องพึ่งพาตัวเอง ขอให้โชคดี" : "You've been deployed to Korat Hospital for your Extern year. It's crowded, understaffed, and you are on your own. Good luck.";
  } else if (upcomingEra === 'INTERN') {
    title = language === 'th' ? "จบการศึกษา: แพทยศาสตรบัณฑิต" : "GRADUATED: DOCTOR OF MEDICINE";
    subtitle = language === 'th' ? "ยินดีต้อนรับสู่ปี Intern 1" : "Welcome to Intern Year 1.";
    nextStageName = language === 'th' ? "เริ่มปี Intern" : "START INTERN YEAR";
    description = language === 'th' ? "ตอนนี้คุณเป็นหมออย่างเป็นทางการแล้ว! คุณถูกย้ายไปที่โรงพยาบาล 'เลิฟลี่' ในกรุงเทพ ค่าตอบแทนดี พื้นสะอาด แต่เปิดตาให้กว้างไว้ ทุกอย่างอาจไม่เป็นอย่างที่คิด" : "You are officially a Doctor! You've transferred to 'Lovely Hospital' in Bangkok. The pay is good, the floors are clean, but keep your eyes open. Not everything is as it seems.";
  } else if (upcomingEra === 'RESIDENT') {
    title = language === 'th' ? "ย้ายไปเรียนต่อเฉพาะทาง (Residency)" : "TRANSFERRED TO RESIDENCY";
    subtitle = language === 'th' ? "กลับมาที่โรงพยาบาลรามาฯ" : "Back to Rama Hospital.";
    nextStageName = language === 'th' ? "เริ่มเรียนต่อเฉพาะทาง" : "START RESIDENCY";
    description = storyFlags.CORRUPT_DOC 
       ? (language === 'th' ? "แม้ว่าคุณจะทำการตกลงที่น่าสงสัยที่โรงพยาบาลเลิฟลี่ แต่คุณก็ได้ตำแหน่งเรียนต่อเฉพาะทางที่รามาฯ ได้เวลาเผชิญความวุ่นวายที่แท้จริงแล้ว" : "Despite your shady dealings at Lovely Hospital, you secured a Residency spot at Rama. Time to face the pure medical chaos.")
       : storyFlags.WHISTLEBLOWER
       ? (language === 'th' ? "คุณได้แฉการคอร์รัปชั่นและกลับมาที่รามาฯ ด้วยมโนธรรมที่สะอาด เตรียมพร้อมสำหรับเรื่องราวดราม่าและผู้ป่วยอุบัติเหตุที่แสนจะท้าทาย" : "You blew the whistle on corruption and returned to Rama with a clean conscience. Get ready for grueling trauma and drama.")
       : (language === 'th' ? "คุณรอดพ้นปี Intern มาได้ ตอนนี้ งานที่แท้จริงเริ่มต้นขึ้น ยินดีต้อนรับสู่การเรียนต่อเฉพาะทาง" : "You survived Intern year. Now, the real work begins. Welcome to Residency.");
  } else if (upcomingEra === 'PROFESSOR') {
    title = language === 'th' ? "เลื่อนขั้นเป็นอาจารย์หมอ" : "PROMOTED TO PROFESSOR";
    subtitle = language === 'th' ? "คุณคือหัวหน้าแผนก" : "You run the department.";
    nextStageName = language === 'th' ? "เริ่มเล่นอิสระ" : "START FREEPLAY";
    description = language === 'th' ? "หลังจากที่ต้องเสียเลือด เหงื่อ และน้ำตามาหลายปี ตอนนี้คุณคือแพทย์ผู้เชี่ยวชาญ คุณเป็นคนตัดสินใจ" : "After years of blood, sweat, and tears, you are now the attending physician. You call the shots.";
  }

  useEffect(() => {
    // Time skip sequence
    const timer = setInterval(() => {
      setStep(prev => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    router.push('/hub');
  };

  return (
    <PageTransition>
      <div className="w-full h-[100dvh] bg-black text-white font-pixel flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-4xl text-center"
            >
              EPISODE COMPLETE
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl text-center text-gray-400 max-w-md leading-relaxed"
            >
              {description}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <h1 className="text-5xl text-pixel-gold mb-4">{title}</h1>
              <p className="text-xl text-gray-400 mb-12">{subtitle}</p>
              
              <PixelButton 
                onClick={handleContinue}
                className="w-full py-4 text-xl shadow-lg bg-purple-600 border-purple-400"
              >
                {nextStageName}
              </PixelButton>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageTransition>
  );
}
