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

/** Whoever is looking out for you at this point in the story signs off the day */
const MENTOR: Record<Phase, string> = { rama1: "bob", korat: "ek", lovely: "kit", rama2: "pim" };

const SIGNOFF = {
  none: { en: "A quiet day, or a hiding day? Tomorrow, find me before lunch.", th: "วันนี้เงียบ หรือแอบหลบ? พรุ่งนี้มาหาก่อนเที่ยงนะ" },
  some: { en: "Steady. Not flashy. Steady is underrated.", th: "สม่ำเสมอ ไม่หวือหวา ความสม่ำเสมอถูกมองข้ามเสมอ" },
  many: { en: "That was a real shift. Go eat something warm.", th: "เวรนี้ของจริง ไปกินอะไรอุ่นๆ ซะ" },
  fainted: { en: "We found you asleep on the supply shelf. Pace yourself. Tea from the kettle, a sit on the bench, it all adds up.", th: "เจอหลับอยู่บนชั้นวางของ ค่อยๆ ทำนะ ชาจากกาต้มน้ำ นั่งพักที่ม้านั่ง ช่วยได้ทั้งนั้น" },
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
    { icon: "sun", label: tr("Hours on shift", "ชั่วโมงเข้าเวร"), value: <><CountUp to={hours} delay={300} /> {tr("h", "ชม.")}</> },
    { icon: "bed", label: tr("Patients seen", "ผู้ป่วยที่ดูแล"), value: <CountUp to={shiftStats.casesTreated} delay={600} /> },
    { icon: "quest", label: tr("Experience", "ประสบการณ์"), value: <CountUp to={Math.round(shiftStats.xpEarned)} prefix="+" delay={900} /> },
    { icon: "coin", label: tr("Pay", "ค่าตอบแทน"), value: <CountUp to={shiftStats.cashEarned} prefix="+" delay={1200} /> },
  ];

  return (
    <PageTransition>
      <div className="w-full h-[100dvh] cozy-night text-pixel-text font-pixel flex flex-col items-center justify-center p-5 relative" data-testid="summary">
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }} className="cozy-panel w-full max-w-sm p-4">
          <p className="text-center text-[16px] leading-none text-[#86522e]">{tr(`Day ${finishedDay} complete`, `จบวันที่ ${finishedDay}`)}</p>
          <h1 className="text-center text-[38px] leading-none mt-1">{tr("Shift ledger", "บัญชีประจำวัน")}</h1>

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

          {showNote && mentor && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex gap-2.5 items-start bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2">
              <div className="w-12 h-12 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
                <PixelPortrait speaker={mentor.name.en} className="w-full h-full" />
              </div>
              <div>
                <p className="text-[15px] leading-none text-[#86522e]">{mentor.name[language]}</p>
                <p className="text-[17px] leading-snug mt-1">{SIGNOFF[tier][language]}</p>
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
                  {isEndOfEpisode ? tr("Pack your bag", "เก็บกระเป๋า") : tr("Head home", "กลับบ้าน")}
                </PixelButton>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
