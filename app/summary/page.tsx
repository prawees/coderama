"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { audio } from "@/lib/audio";
import { music } from "@/lib/music";
import { motion } from "framer-motion";
import { NPCS } from "@/lib/npcs";
import { phaseForDay, Phase } from "@/lib/world/maps";
import { patientFor } from "@/lib/patients";

/** Whoever is looking out for you at this point in the story signs off the day */
const MENTOR: Record<Phase, string> = { rama1: "bob", korat: "ek", lovely: "kit", rama2: "pim" };

const GRADE_TH: Record<string, { text: string; good: boolean }> = {
  clean: { text: "ถูกทุกขั้น", good: true },
  minor: { text: "พลาด 1", good: true },
  poor: { text: "รอด แต่ดูแลได้ดีกว่านี้", good: false },
  critical: { text: "อาการแย่ลง", good: false },
};

const SIGNOFF = {
  none: { en: "A quiet day, or a hiding day? Tomorrow, find me before lunch.", th: "วันนี้ไม่เห็นรับเคสเลยนะ พรุ่งนี้มาหาพี่ก่อนเที่ยง เดี๋ยวพาดูเอง" },
  some: { en: "Your patients went home in good shape. Sleep, and come back tomorrow.", th: "คนไข้วันนี้เรียบร้อยดี กลับไปนอนเถอะ พรุ่งนี้เจอกัน" },
  many: { en: "That was a real shift. Go eat something warm.", th: "เวรนี้หนักจริง แวะหาอะไรอุ่นๆ กินก่อนนอนนะ" },
  fainted: { en: "We found you asleep on the supply shelf. Tea from the kettle and a sit on the bench both help.", th: "เจอน้องหลับอยู่บนชั้นวางของ พรุ่งนี้แวะชงชาหรือออกไปนั่งพักบ้างนะ อย่าฝืน" },
};

function CountUp({ to, prefix = "", delay = 0 }: { to: number; prefix?: string; delay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / 700));
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return <>{prefix}{n}</>;
}

export default function SummaryPage() {
  const router = useRouter();
  const { shiftStats, clockMinutes, restoreEnergy, activeQuests, completeQuest, currentDay, language } = useERStore();
  const [showNext, setShowNext] = useState(false);
  const [showNote, setShowNote] = useState(false);
  // Read before the overnight rest refills it: an empty tank means the shift ended in a faint.
  const [fainted] = useState(() => useERStore.getState().energy <= 0);
  const isEndOfEpisode = [6, 11, 16, 26, 31].includes(currentDay);
  const tr = (en: string, th: string) => (language === "th" ? th : en);
  const finishedDay = Math.max(1, currentDay - 1);
  const mentor = NPCS[MENTOR[phaseForDay(finishedDay)]];

  useEffect(() => {
    music.fadeToTrack("home", 3.0);
    if (shiftStats.cashEarned > 0 || shiftStats.xpEarned > 0) setTimeout(() => audio.playCashRegister(), 700);
    setTimeout(() => {
      const hasLounge = useERStore.getState().hospitalUpgrades.includes("upg_lounge");
      restoreEnergy(hasLounge ? 120 : 100);
    }, 100);
    if (shiftStats.casesTreated > 0 && activeQuests.includes("q_first_shift")) completeQuest("q_first_shift");
    const a = setTimeout(() => setShowNote(true), 1400);
    const b = setTimeout(() => setShowNext(true), 2200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hours = Math.floor(clockMinutes / 60);
  const tier = fainted ? "fainted" : shiftStats.casesTreated === 0 ? "none" : shiftStats.casesTreated <= 2 ? "some" : "many";

  const rows = [
    { icon: "sun", label: "อยู่เวร", value: <><CountUp to={hours} delay={300} /> {tr("h", "ชม.")}</> },
    { icon: "bed", label: "คนไข้ที่ดู", value: <CountUp to={shiftStats.casesTreated} delay={600} /> },
    { icon: "quest", label: "XP ที่ได้", value: <CountUp to={Math.round(shiftStats.xpEarned)} prefix="+" delay={900} /> },
    { icon: "coin", label: "เหรียญที่ได้", value: <CountUp to={shiftStats.cashEarned} prefix="+" delay={1200} /> },
  ];

  return (
    <PageTransition>
      <div className="w-full h-[100dvh] cozy-night text-pixel-text font-pixel flex flex-col items-center justify-center p-5 relative" data-testid="summary">
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }} className="cozy-panel w-full max-w-sm p-4">
          <h1 className="text-center text-[34px] leading-tight">จบเวรวันที่ {finishedDay}</h1>

          <div className="mt-4 flex flex-col">
            {rows.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.3 }}
                className="flex items-center justify-between py-1.5 border-b-2 border-dashed border-[#e7d3a8] last:border-0"
              >
                <span className="flex items-center gap-2 text-[18px]"><PixelIcon name={r.icon} size={16} />{r.label}</span>
                <span className="text-[24px] leading-none tabular-nums">{r.value}</span>
              </motion.div>
            ))}
          </div>

          {(shiftStats.patients ?? []).length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto flex flex-col gap-1" data-testid="summary-patients">
              <p className="text-[15px] leading-none text-[#86522e]">คนไข้วันนี้</p>
              {(shiftStats.patients ?? []).map((sp, i) => {
                const who = patientFor(sp.caseId);
                const g = GRADE_TH[sp.grade] ?? GRADE_TH.poor;
                return (
                  <div key={i} className="flex items-baseline justify-between gap-2 text-[15px] leading-snug border-b border-dashed border-[#e7d3a8] last:border-0 py-0.5">
                    <span className="min-w-0">
                      <span>{who?.name.th ?? sp.caseId}</span>
                      <span className="block text-[13px] text-[#5b4148]">{who?.dx.th}</span>
                    </span>
                    <span className={`shrink-0 text-[13px] ${g.good ? "text-[#3f8a48]" : "text-[#a93c4b]"}`}>{g.text}</span>
                  </div>
                );
              })}
            </div>
          )}
          {showNote && mentor && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex gap-2.5 items-start bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2">
              <div className="w-12 h-12 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
                <PixelPortrait speaker={mentor.name.en} className="w-full h-full" />
              </div>
              <div>
                <p className="text-[15px] leading-none text-[#86522e]">{mentor.name.th}</p>
                <p className="text-[17px] leading-snug mt-1">{SIGNOFF[tier].th}</p>
              </div>
            </motion.div>
          )}

          <div className="mt-4 h-12">
            {showNext && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <PixelButton
                  onClick={() => (isEndOfEpisode ? router.push("/summary/year-end") : router.push("/hub"))}
                  variant={isEndOfEpisode ? "plum" : "primary"}
                  className="w-full py-2 text-[22px]"
                  data-testid="summary-next"
                >
                  {isEndOfEpisode ? "เก็บกระเป๋า" : "กลับบ้าน"}
                </PixelButton>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
