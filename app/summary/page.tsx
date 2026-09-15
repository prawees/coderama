"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { audio } from "@/lib/audio";
import { music } from "@/lib/music";
import { motion } from "framer-motion";

export default function SummaryPage() {
  const router = useRouter();
  const { shiftStats, energy, clockMinutes, restoreEnergy, activeQuests, completeQuest, currentDay, language } = useERStore();
  const [showNext, setShowNext] = useState(false);
  const [showRoast, setShowRoast] = useState(false);
  const isEndOfEpisode = currentDay === 6 || currentDay === 11 || currentDay === 16 || currentDay === 31;

  useEffect(() => {
    // Fade to the comforting 'home' track on shift end
    music.fadeToTrack('home', 3.0);

    // Play cash register sound when summary loads
    if (shiftStats.cashEarned > 0 || shiftStats.xpEarned > 0) {
      setTimeout(() => audio.playCashRegister(), 500);
    }
    
    // Automatically restore energy fully after sleeping/ending shift
    setTimeout(() => {
      // Check if lounge upgrade is owned to restore 120 instead of 100
      const hasLounge = useERStore.getState().hospitalUpgrades.includes('upg_lounge');
      restoreEnergy(hasLounge ? 120 : 100); 
    }, 100);

    // Trigger First Shift Quest
    if (shiftStats.casesTreated > 0 && activeQuests.includes('q_first_shift')) {
      completeQuest('q_first_shift');
    }

    setTimeout(() => setShowRoast(true), 1500);
    setTimeout(() => setShowNext(true), 3500);
  }, [shiftStats, restoreEnergy, activeQuests, completeQuest]);

  const shiftDurationHours = Math.floor(clockMinutes / 60);

  return (
    <PageTransition>
      <div className="w-full h-[100dvh] bg-[#0d1117] text-white font-pixel flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 to-black pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-black border-4 border-[#30363d] rounded-xl p-8 shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-sm relative z-10"
        >
          <h1 className="text-3xl text-center text-pixel-gold mb-8 drop-shadow-md">{language === 'th' ? 'สรุปผลเข้าเวร' : 'SHIFT SUMMARY'}</h1>

          <div className="space-y-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <span className="text-gray-400">{language === 'th' ? 'ระยะเวลาเวร:' : 'Shift Duration:'}</span>
              <span className="text-lg">{shiftDurationHours} {language === 'th' ? 'ชั่วโมง' : 'Hours'}</span>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <span className="text-gray-400">{language === 'th' ? 'ผู้ป่วยที่รับรักษา:' : 'Patients Treated:'}</span>
              <span className="text-lg text-pixel-primary">{shiftStats.casesTreated}</span>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <span className="text-gray-400">{language === 'th' ? 'XP ที่ได้:' : 'XP Gained:'}</span>
              <span className="text-xl text-blue-400">+{shiftStats.xpEarned} XP</span>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 2.0 }}
              className="flex justify-between items-center"
            >
              <span className="text-gray-400">{language === 'th' ? 'ค่าตอบแทน:' : 'Paycheck:'}</span>
              <span className="text-2xl text-pixel-success font-bold">${shiftStats.cashEarned}</span>
            </motion.div>
          </div>

          {showRoast && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 bg-gray-900 border-2 border-red-900 rounded p-4 relative"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-black border-2 border-red-500 rounded-md shadow-inner shrink-0 relative overflow-hidden">
                  <div className="w-full h-full bg-[url(/assets/nurse.jpg)] bg-[length:300%_400%] bg-[-48px_-144px]" />
                  <div className="absolute inset-0 bg-red-600/40 mix-blend-multiply" />
                </div>
                <div>
                  <h3 className="text-red-500 font-bold mb-1">{language === 'th' ? 'อ.หมอ Grump' : 'Ajarn Grump'}</h3>
                  <p className="text-sm text-gray-300 leading-tight">
                    {shiftStats.casesTreated === 0 
                      ? (language === 'th' ? "แอบไปนอนที่ห้องพักแพทย์มาทั้งคืนหรือไง? ไร้ประโยชน์จริงๆ หมอที่แท้จริงเขาไม่นอนกันหรอก" : "Did you sleep in the on-call room all night? Pathetic. Real doctors don't sleep.")
                      : shiftStats.casesTreated <= 2 
                      ? (language === 'th' ? "ทำได้แค่ผ่านเกณฑ์ขั้นต่ำเองเหรอ ฉันหวังว่าจะเห็นความตั้งใจมากกว่านี้จากนักศึกษาของรามาฯ นะ" : "You barely did the bare minimum. I expected more hustle from a Rama student.")
                      : (language === 'th' ? "หึ... ก็ไม่เลว แต่ก็อย่าเพิ่งได้ใจไป ยังมีอีกหลายอย่างที่เธอไม่รู้" : "Hmph. Not terrible. But don't let it go to your head, there's a lot you still don't know.")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {showNext && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <PixelButton 
                onClick={() => isEndOfEpisode ? router.push('/summary/year-end') : router.push('/hub')} 
                className={`w-full py-4 text-xl shadow-lg ${isEndOfEpisode ? 'bg-purple-600 border-purple-400' : 'bg-blue-600 border-blue-400'}`}
              >
                {isEndOfEpisode ? (language === 'th' ? 'เลื่อนขึ้นปีใหม่' : 'CONTINUE TO NEXT YEAR') : (language === 'th' ? 'เลิกงาน' : 'CLOCK OUT')}
              </PixelButton>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
