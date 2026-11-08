"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audio } from "@/lib/audio";
import { haptic } from "@/lib/haptics";
import { useERStore } from "@/lib/erStore";
import { FORTUNES, GACHA_COST, playGacha, prizeText, shakeFortune, type Prize } from "@/lib/luck";
import { PixelIcon } from "@/components/ui/PixelIcon";

/** The capsule machine: put in coins, turn, a capsule rolls out */
export function GachaMachine() {
  const currency = useERStore((s) => s.currency);
  const [phase, setPhase] = useState<"idle" | "turning" | "open">("idle");
  const [prize, setPrize] = useState<Prize | null>(null);
  const turn = () => {
    if (phase === "turning") return;
    const p = playGacha();
    if (!p) { audio.playBump(); return; }
    setPrize(p); setPhase("turning"); audio.playClick(); haptic.impact("medium");
    [0, 180, 360].forEach((d) => setTimeout(() => audio.playTone(300 + d, "square", 0.05, 0.05), d));
    setTimeout(() => { setPhase("open"); audio.playSparkle(); haptic.impact("heavy"); }, 1100);
  };
  const rare = prize && ((prize.kind === "gift" && prize.rare) || (prize.kind === "coins" && prize.amount >= 300));
  return (
    <div className="flex flex-col items-center gap-2 py-2" data-testid="gacha">
      <p className="text-[16px] leading-snug text-center text-[#86522e]">ตู้กาชาของป้าน้อย หมุนครั้งละ {GACHA_COST} เหรียญ ได้ของฝาก เหรียญคืน หรือของหายาก</p>
      <motion.div animate={phase === "turning" ? { rotate: [0, -6, 6, -4, 4, 0] } : { rotate: 0 }} transition={{ duration: 0.9 }}
        className="relative w-36 h-44 rounded-t-[40px] rounded-b-[8px] border-[3px] border-[#3a2a2f] bg-[#e8737f] flex flex-col items-center pt-3">
        <div className="w-28 h-24 rounded-full border-[3px] border-[#3a2a2f] bg-[#fff8ea]/80 grid grid-cols-3 gap-0.5 p-2">
          {["#ffd66b", "#9fd8ec", "#a5ecc0", "#ffb3b8", "#c98ad1", "#ffd66b", "#9fd8ec", "#ffb3b8", "#a5ecc0"].map((c, i) => (
            <span key={i} className="rounded-full border-2 border-[#3a2a2f]" style={{ background: c }} />
          ))}
        </div>
        <div className="mt-2 w-10 h-6 rounded-[4px] bg-[#3a2a2f]" />
      </motion.div>
      <AnimatePresence>
        {phase === "open" && prize && (
          <motion.p initial={{ scale: 0.4, opacity: 0, y: -10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`cozy-tag px-3 py-1 text-[18px] leading-none ${rare ? "!bg-[#ffd66b]" : ""}`} data-testid="gacha-prize">
            {prizeText(prize)}
          </motion.p>
        )}
      </AnimatePresence>
      <button onClick={turn} disabled={phase === "turning"} className="cozy-btn cozy-btn-sun px-6 py-2 text-[20px] leading-none flex items-center gap-1.5" data-testid="gacha-turn">
        <PixelIcon name="coin" size={14} />{currency < GACHA_COST ? "เหรียญไม่พอ" : phase === "open" ? "หมุนอีกรอบ" : "หมุนเลย"}
      </button>
    </div>
  );
}

/** เซียมซี under the courtyard tree: shake until a stick falls, read today's fortune */
export function FortuneModal({ day, onClose }: { day: number; onClose: () => void }) {
  const done = useERStore((s) => s.propDaily?.siamsi === day);
  const [phase, setPhase] = useState<"ready" | "shaking" | "read">(done ? "read" : "ready");
  const [fortune, setFortune] = useState<(typeof FORTUNES)[number] | null>(null);
  useEffect(() => { if (done && !fortune) setFortune(null); }, [done, fortune]);
  const shake = () => {
    if (phase !== "ready") return;
    setPhase("shaking"); audio.playClick();
    let n = 0;
    const id = setInterval(() => { audio.playTone(520 + (n % 3) * 60, "triangle", 0.04, 0.05); haptic.impact("light"); if (++n >= 8) clearInterval(id); }, 120);
    setTimeout(() => { setFortune(shakeFortune(day)); setPhase("read"); audio.playSparkle(); }, 1200);
  };
  const gift = fortune?.gift;
  return (
    <div className="fixed inset-0 z-[150] bg-[#1c1522]/70 flex items-center justify-center p-4 font-pixel" onClick={onClose} data-testid="fortune">
      <div className="cozy-panel w-full max-w-xs p-4 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-[22px] leading-none">เซียมซีใต้ต้นลีลาวดี</p>
        <motion.div animate={phase === "shaking" ? { rotate: [0, -12, 10, -8, 6, 0], y: [0, -2, 0] } : {}} transition={{ duration: 1.1 }}
          className="relative w-20 h-28 rounded-[6px] border-[3px] border-[#3a2a2f] bg-[#c4485a] flex items-start justify-center overflow-visible">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="absolute -top-6 w-[5px] h-12 rounded-[2px] bg-[#f2dfc0] border border-[#9a6a4a]" style={{ left: 14 + i * 11, transform: `rotate(${(i - 2) * 6}deg)` }} />
          ))}
          {phase === "read" && fortune && (
            <motion.span initial={{ y: -10, opacity: 0 }} animate={{ y: 60, opacity: 1, rotate: 70 }} transition={{ duration: 0.5 }}
              className="absolute w-[6px] h-14 rounded-[2px] bg-[#ffe08a] border border-[#9a6a4a]" />
          )}
        </motion.div>
        {phase === "read" ? (
          fortune ? (
            <div className="text-center" data-testid="fortune-text">
              <p className="text-[18px] leading-snug">{fortune.text}</p>
              {gift && <p className="text-[15px] leading-snug mt-1 text-[#3f8a48]">{[gift.coins && `+${gift.coins} เหรียญ`, gift.energy && `+${gift.energy} พลังงาน`, gift.xp && `+${gift.xp} XP`].filter(Boolean).join("  ")}</p>}
            </div>
          ) : <p className="text-[16px] leading-snug text-center text-[#86522e]">วันนี้เสี่ยงไปแล้ว ไม้เดิมยังวางอยู่ พรุ่งนี้ค่อยมาใหม่นะ</p>
        ) : (
          <button onClick={shake} className="cozy-btn cozy-btn-sun px-6 py-2 text-[20px] leading-none" data-testid="fortune-shake">{phase === "shaking" ? "กำลังเขย่า..." : "เขย่าเซียมซี"}</button>
        )}
        <button onClick={onClose} className="cozy-btn px-4 py-1 text-[16px]">ปิด</button>
      </div>
    </div>
  );
}
