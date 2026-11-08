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
import { requestFor } from "@/lib/requests";
import { CHAPTERS, shiftInChapter } from "@/lib/chapters";
import { teaserAfter } from "@/lib/teasers";
import { shiftTitle } from "@/lib/shiftTitle";
import { shiftCard } from "@/lib/shareSpecs";
import { ShareSheet } from "@/components/game/ShareSheet";
import { RichText } from "@/components/game/RichText";
import type { CardSpec } from "@/lib/shareCard";

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
  const { shiftStats, restoreEnergy, activeQuests, completeQuest, currentDay, language } = useERStore();
  const [showNext, setShowNext] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [card, setCard] = useState<CardSpec | null>(null);
  // Read before the overnight rest refills it: an empty tank means the shift ended in a faint.
  const [fainted] = useState(() => useERStore.getState().energy <= 0);
  const isEndOfEpisode = CHAPTERS.some((c) => c.n > 1 && c.first === currentDay);
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

  const tier = fainted ? "fainted" : shiftStats.casesTreated === 0 ? "none" : shiftStats.casesTreated <= 2 ? "some" : "many";

  const rows = [
    { icon: "bed", label: "คนไข้ที่ดู", value: <CountUp to={shiftStats.casesTreated} delay={600} /> },
    { icon: "quest", label: "XP ที่ได้", value: <CountUp to={Math.round(shiftStats.xpEarned)} prefix="+" delay={900} /> },
    { icon: "coin", label: "เหรียญที่ได้", value: <CountUp to={shiftStats.cashEarned} prefix="+" delay={1200} /> },
  ];
  // The day's notice-board request, done or let go
  if (requestFor(finishedDay)) {
    const done = (useERStore.getState().requestsDone ?? []).includes(finishedDay);
    rows.push({ icon: "log", label: "งานจากบอร์ด", value: <span className={done ? "text-[#3f8a48]" : "text-[#86522e] text-[18px]"}>{done ? "✓" : "ทำไม่ทัน"}</span> });
  }

  const earned = shiftTitle((shiftStats.patients ?? []).map((p) => p.grade), fainted);
  const at = shiftInChapter(finishedDay);
  const { savedTotal, goodStreak } = useERStore.getState();

  return (
    <PageTransition>
      {card && <ShareSheet spec={card} onClose={() => setCard(null)} filename={`code-rama-day-${finishedDay}.png`} />}
      <div className="w-full h-[100dvh] cozy-night text-pixel-text font-pixel flex flex-col items-center justify-center p-3 relative" data-testid="summary">
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }} className="cozy-panel w-full max-w-sm p-3 max-h-full overflow-y-auto">
          <h1 className="text-center text-[28px] leading-tight">จบเวรวันที่ {finishedDay}</h1>
          <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 15 }} className="mt-1 text-center" data-testid="shift-title">
            <p className="text-[13px] leading-none text-[#86522e]">ฉายาเวรนี้</p>
            <p className="text-[32px] leading-tight text-[#d95763]">{earned.title}</p>
          </motion.div>

          <div className="mt-1 flex flex-col">
            {rows.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.3 }}
                className="flex items-center justify-between py-1 border-b-2 border-dashed border-[#e7d3a8] last:border-0"
              >
                <span className="flex items-center gap-2 text-[18px]"><PixelIcon name={r.icon} size={16} />{r.label}</span>
                <span className="text-[24px] leading-none tabular-nums">{r.value}</span>
              </motion.div>
            ))}
          </div>

          {(shiftStats.patients ?? []).length > 0 && (
            <div className="mt-2 max-h-24 overflow-y-auto flex flex-col gap-1" data-testid="summary-patients">
              <p className="text-[15px] leading-none text-[#86522e]">คนไข้วันนี้</p>
              {(shiftStats.patients ?? []).map((sp, i) => {
                const who = patientFor(sp.caseId);
                const g = GRADE_TH[sp.grade] ?? GRADE_TH.poor;
                return (
                  <div key={i} className="flex items-baseline justify-between gap-2 text-[15px] leading-snug border-b border-dashed border-[#e7d3a8] last:border-0 py-0.5">
                    <span className="min-w-0">
                      <span>{sp.name ?? who?.name.th ?? sp.caseId}</span>
                      <span className="block text-[13px] text-[#5b4148]">{who?.dx.th}</span>
                    </span>
                    <span className={`shrink-0 text-[13px] ${g.good ? "text-[#3f8a48]" : "text-[#a93c4b]"}`}>{g.text}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-center leading-none" data-testid="summary-totals">
            <div className="rounded-[4px] border-2 border-[#e7d3a8] bg-[#fff6e3] py-1"><p className="text-[22px] text-[#d95763] tabular-nums">{savedTotal ?? 0}</p><p className="text-[13px] text-[#86522e] mt-0.5">คนไข้ที่ช่วยไว้ทั้งหมด</p></div>
            <div className="rounded-[4px] border-2 border-[#e7d3a8] bg-[#fff6e3] py-1"><p className="text-[22px] text-[#3f8a48] tabular-nums">{goodStreak ?? 0}</p><p className="text-[13px] text-[#86522e] mt-0.5">ทำดีติดกัน (เคส)</p></div>
          </div>
          {at && (
            <div className="mt-2 flex flex-col gap-1" data-testid="chapter-progress">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[15px] leading-none">บท {at.chapter.n} {at.chapter.title}</p>
                <div className="flex gap-[3px]">
                  {Array.from({ length: at.total }).map((_, i) => (
                    <span key={i} className={`w-3 h-3 border-2 border-[#3a2a2f] ${i < at.position ? "bg-[#86c35f]" : "bg-[#e7d3a8]"}`} />
                  ))}
                </div>
              </div>
              {at.chapter.reward && (
                <p className="text-[14px] leading-none text-[#86522e]">{at.left > 0 ? `อีก ${at.left} เวร ${at.chapter.reward}` : `ครบบทแล้ว ${at.chapter.reward}`}</p>
              )}
            </div>
          )}
          {showNote && mentor && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex gap-2.5 items-start bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2">
              <div className="w-12 h-12 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
                <PixelPortrait speaker={mentor.name.en} className="w-full h-full" />
              </div>
              <div>
                <p className="text-[15px] leading-none text-[#86522e]">{mentor.name.th}</p>
                <RichText text={SIGNOFF[tier].th} className="text-[15px] leading-snug mt-1" />
              </div>
            </motion.div>
          )}
          {showNote && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-1.5 rounded-[4px] border-2 border-[#3a2a2f] bg-[#2b2133] px-2.5 py-1.5" data-testid="teaser">
              <p className="text-[13px] leading-none text-[#ffd66b]">เวรหน้า</p>
              <RichText text={teaserAfter(finishedDay)} tone="dark" className="text-[15px] leading-snug mt-1 text-[#fbf3e2]" />
            </motion.div>
          )}

          <div className="mt-2 min-h-[5.25rem]">
            {showNext && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1.5">
                <button onClick={() => { audio.playClick(); setCard(shiftCard(finishedDay, fainted)); }} className="cozy-btn cozy-btn-sun w-full py-1.5 text-[17px] leading-none" data-testid="share-shift">แชร์ลงสตอรี่</button>
                <PixelButton
                  onClick={() => (isEndOfEpisode ? router.push("/summary/year-end") : router.push("/hub"))}
                  variant={isEndOfEpisode ? "plum" : "primary"}
                  className="w-full py-2 text-[22px]"
                  data-testid="summary-next"
                >
                  {isEndOfEpisode ? "เก็บกระเป๋า" : "กลับบ้าน"}
                </PixelButton>
                <p className="text-center text-[13px] leading-none text-[#86522e]">เซฟแล้ว จะพักก่อนแล้วค่อยกลับมาเล่นต่อก็ได้</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
