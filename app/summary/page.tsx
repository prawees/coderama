"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { audio } from "@/lib/audio";
import { music } from "@/lib/music";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/useT";
import { portrait, GRUMP_SPEC } from "@/lib/spriteRecolor";

const GRADE_BG: Record<string, string> = { A: '#2f9e8f', B: '#3f7fc0', C: '#d29922', D: '#dd363d' };

/** End-of-shift summary. Ajarn Grump reviews your OSCE grades; a strong shift earns his respect. */
export default function SummaryPage() {
  const router = useRouter();
  const { t } = useT();
  const { shiftStats, clockMinutes, restoreEnergy, activeQuests, completeQuest, currentDay, caseReports, updateFriendship, storyFlags, setStoryFlag, friendships } = useERStore();
  const [face, setFace] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const applied = useRef(false);
  const isEndOfEpisode = currentDay === 6 || currentDay === 11 || currentDay === 16 || currentDay === 31;

  const shiftReports = useMemo(() => caseReports.slice(-Math.max(0, shiftStats.casesTreated)).slice(-6), [caseReports, shiftStats.casesTreated]);
  const avg = shiftReports.length ? Math.round(shiftReports.reduce((a, r) => a + r.overall, 0) / shiftReports.length) : null;
  const earnedRespect = avg !== null && avg >= 80 && shiftReports.length >= 2;

  useEffect(() => {
    music.fadeToTrack('home', 3.0);
    if (shiftStats.cashEarned > 0 || shiftStats.xpEarned > 0) setTimeout(() => audio.playCashRegister(), 500);
    const hasLounge = useERStore.getState().hospitalUpgrades.includes('upg_lounge');
    setTimeout(() => restoreEnergy(hasLounge ? 120 : 100), 100);
    if (shiftStats.casesTreated > 0 && activeQuests.includes('q_first_shift')) completeQuest('q_first_shift');
    portrait('doctor', GRUMP_SPEC, 3).then(setFace).catch(() => {});
    const timers = [setTimeout(() => setStep(1), 600), setTimeout(() => setStep(2), 1400), setTimeout(() => setStep(3), 2200)];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Grump's respect is earned once per day from performance, not only from gifts.
  useEffect(() => {
    const flag = `grump_respect_day_${currentDay}`;
    if (applied.current || !earnedRespect || storyFlags[flag]) return;
    applied.current = true;
    updateFriendship('dr_grump', 1);
    setStoryFlag(flag, true);
  }, [earnedRespect, currentDay, storyFlags, updateFriendship, setStoryFlag]);

  const roastKey = shiftStats.casesTreated === 0 ? 'sum.grump_none' : avg === null ? 'sum.grump_low' : avg >= 85 ? 'sum.grump_great' : avg >= 70 ? 'sum.grump_ok' : avg >= 50 ? 'sum.grump_low' : 'sum.grump_bad';
  const stat = (label: string, value: string, color: string, show: boolean) => (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={show ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.25, ease: 'linear' }}
      className="flex justify-between items-baseline border-b-4 border-[#2c4a73] py-2">
      <span className="text-xl text-[#a9bfd9]">{label}</span>
      <span className="text-3xl" style={{ color }}>{value}</span>
    </motion.div>
  );

  return (
    <div className="absolute inset-0 bg-pixel-bg font-pixel p-6 flex gap-5 items-stretch">
      <PixelPanel variant="wood" title={t('sum.title')} className="w-[38%]">
        {stat(t('sum.duration'), t('sum.hours', { n: Math.floor(clockMinutes / 60) }), '#f3f6ff', step >= 0)}
        {stat(t('sum.patients'), String(shiftStats.casesTreated), '#b5e2ff', step >= 1)}
        {stat(t('sum.xp'), `+${Math.round(shiftStats.xpEarned)}`, '#71abdb', step >= 2)}
        {stat(t('sum.pay'), `$${shiftStats.cashEarned}`, '#99e550', step >= 3)}
        <div className="mt-auto pt-4">
          <PixelButton size="lg" variant={isEndOfEpisode ? 'gold' : 'primary'} className="w-full"
            onClick={() => router.push(isEndOfEpisode ? '/summary/year-end' : '/hub')}>
            {isEndOfEpisode ? t('sum.next_year') : t('sum.clock_out')}
          </PixelButton>
        </div>
      </PixelPanel>

      <div className="flex-1 flex flex-col gap-5 min-w-0">
        <PixelPanel variant="metal" title={t('report.title')} className="flex-1 min-h-0">
          {shiftReports.length === 0 && <p className="text-xl text-[#a9bfd9]">{t('sum.no_cases')}</p>}
          <div className="grid grid-cols-2 gap-2 overflow-y-auto">
            {shiftReports.map((r) => (
              <div key={r.timestamp} className="flex items-center gap-3 border-4 border-[#0b1626] bg-[#16263f] p-2">
                <div className="w-12 h-12 border-4 border-[#0b1626] flex items-center justify-center font-heading text-base text-white" style={{ background: GRADE_BG[r.overallGrade] }}>{r.overallGrade}</div>
                <div className="min-w-0">
                  <div className="text-xl truncate">{r.caseId}</div>
                  <div className="text-base text-[#a9bfd9]">{r.outcomeGood ? t('db.outcome_won') : t('db.outcome_ended')} · {r.overall}/100</div>
                </div>
              </div>
            ))}
          </div>
        </PixelPanel>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={step >= 3 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, ease: 'linear' }}>
          <div className="pixel-frame !p-2">
            <div className="frame-inner flex gap-3 p-3">
              <div className="shrink-0 w-[112px] h-[112px] bg-[#c7dafa] border-4 border-[#0b1626] overflow-hidden flex items-end justify-center">
                {face && <img src={face} alt="" className="w-[192px] max-w-none" style={{ imageRendering: 'pixelated' }} />}
              </div>
              <div>
                <div className="inline-block px-2 bg-[#f3f6ff] border-2 border-[#0b1626] text-[#254671] text-lg">{t('npc.grump')}</div>
                <p className="text-2xl leading-snug mt-1">{t(roastKey)}</p>
                {earnedRespect && <p className="text-xl text-[#ffd866] mt-1">♥ {t('sum.respect', { n: friendships['dr_grump'] || 0 })}</p>}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
