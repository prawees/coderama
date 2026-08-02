"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { audio } from "@/lib/audio";
import { motion } from "framer-motion";

export default function SummaryPage() {
  const router = useRouter();
  const { shiftStats, energy, clockMinutes, restoreEnergy } = useERStore();
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    // Play cash register sound when summary loads
    if (shiftStats.cashEarned > 0 || shiftStats.xpEarned > 0) {
      setTimeout(() => audio.playCashRegister(), 500);
    }
    
    // Automatically restore energy fully after sleeping/ending shift
    setTimeout(() => {
      restoreEnergy(100); 
    }, 100);

    setTimeout(() => setShowNext(true), 2500);
  }, [shiftStats, restoreEnergy]);

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
          <h1 className="text-3xl text-center text-pixel-gold mb-8 drop-shadow-md">SHIFT SUMMARY</h1>

          <div className="space-y-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <span className="text-gray-400">Shift Duration:</span>
              <span className="text-lg">{shiftDurationHours} Hours</span>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <span className="text-gray-400">Patients Treated:</span>
              <span className="text-lg text-pixel-primary">{shiftStats.casesTreated}</span>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <span className="text-gray-400">XP Gained:</span>
              <span className="text-xl text-blue-400">+{shiftStats.xpEarned} XP</span>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 2.0 }}
              className="flex justify-between items-center"
            >
              <span className="text-gray-400">Paycheck:</span>
              <span className="text-2xl text-pixel-success font-bold">${shiftStats.cashEarned}</span>
            </motion.div>
          </div>

          {showNext && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <PixelButton 
                onClick={() => router.push('/hub')} 
                className="w-full py-4 text-xl shadow-lg bg-blue-600 border-blue-400"
              >
                CLOCK OUT
              </PixelButton>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
