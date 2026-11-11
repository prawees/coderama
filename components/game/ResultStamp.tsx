"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { audio } from "@/lib/audio";

const STARS = { clean: 3, minor: 2, poor: 1, critical: 0 } as const;

/** The moment a case ends: stars land one by one, and a good run keeps counting */
export function ResultStamp({ grade, streak }: { grade: keyof typeof STARS; streak: number | null }) {
  const n = STARS[grade];
  useEffect(() => {
    const timers = Array.from({ length: n }, (_, i) => setTimeout(() => audio.playTone(660 + i * 165, "square", 0.09, 0.06), 180 + i * 170));
    if (n === 3) timers.push(setTimeout(() => audio.playSparkle(), 760));
    return () => timers.forEach(clearTimeout);
  }, [n]);
  return (
    <div className="mb-1.5 flex flex-col items-center gap-1" data-testid="result-stamp" data-stars={n}>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} initial={{ scale: 2.4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ delay: 0.12 + i * 0.17, type: "spring", stiffness: 420, damping: 15 }}>
            <PixelIcon name={i < n ? "star" : "starEmpty"} size={34} />
          </motion.span>
        ))}
      </div>
      {streak !== null && streak >= 2 && (
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="cozy-tag !bg-[#ffd66b] px-2 py-0.5 text-[15px] leading-none" data-testid="streak">
          ทำดีติดกัน {streak} เคส
        </motion.p>
      )}
    </div>
  );
}
