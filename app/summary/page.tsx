"use client";

import { useERStore, getRankFromXp } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SummaryPage() {
  const router = useRouter();
  const { shiftStats, xp, lifetimeXp, currency, resetShiftStats } = useERStore();
  const currentRank = getRankFromXp(lifetimeXp || xp);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-pixel-bg p-4 flex flex-col items-center justify-center font-pixel">
      <h1 className="text-4xl text-pixel-gold mb-6 text-center shadow-black drop-shadow-md">SHIFT COMPLETE</h1>
      
      <PixelPanel className="w-full max-w-md bg-[#161b22] text-pixel-text p-6 flex flex-col gap-6 shadow-xl border-4 border-[#30363d]">
        <div className="text-center border-b-2 border-gray-700 pb-4">
          <p className="text-lg text-gray-400">Attending Review</p>
          <p className="text-xl mt-2">
            {shiftStats.casesTreated === 0 
              ? "Did you even do anything today?" 
              : shiftStats.casesTreated > 5 
                ? "Incredible work out there, doctor." 
                : "Good job keeping them alive."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-lg bg-black p-3 border border-gray-700 rounded">
            <span className="text-gray-400">Patients Treated:</span>
            <span className="text-pixel-success font-bold text-2xl">{shiftStats.casesTreated}</span>
          </div>

          <div className="flex justify-between items-center text-lg bg-black p-3 border border-gray-700 rounded">
            <span className="text-gray-400">Total XP Earned:</span>
            <span className="text-pixel-success font-bold text-2xl">+{shiftStats.xpEarned}</span>
          </div>

          <div className="flex justify-between items-center text-lg bg-black p-3 border border-gray-700 rounded">
            <span className="text-gray-400">Total Cash Earned:</span>
            <span className="text-pixel-gold font-bold text-2xl">+${shiftStats.cashEarned}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-700 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Current Rank</span>
            <span className="text-xl text-pixel-gold">{currentRank}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-sm text-gray-400">Total Balance</span>
            <span className="text-xl text-pixel-success">${currency}</span>
          </div>
        </div>

      </PixelPanel>

      <PixelButton 
        onClick={() => {
          resetShiftStats();
          router.push('/hub');
        }} 
        variant="primary" 
        className="w-full max-w-md mt-8 py-4 text-xl shadow-lg"
      >
        RETURN TO HUB
      </PixelButton>
    </div>
  );
}
