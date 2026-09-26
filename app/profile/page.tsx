"use client";

import { useRouter } from "next/navigation";
import { useERStore, getRankFromXp } from "@/lib/erStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { AppearancePicker } from "@/components/game/AppearancePicker";
import { getLocalizedRankTitle } from "@/lib/localization";
import { useT } from "@/lib/i18n/useT";

/** ID badge: identity card plus palette-swap customizer on the real sprite. */
export default function ProfilePage() {
  const router = useRouter();
  const { t, lang } = useT();
  const { appearance, setAppearance, playerName, playerGender, lifetimeXp, university, currentDay, caseReports } = useERStore();
  const rank = getLocalizedRankTitle(getRankFromXp(lifetimeXp), playerName, playerGender, lang);
  const recent = caseReports.slice(-5).reverse();

  return (
    <div className="absolute inset-0 bg-pixel-bg font-pixel p-5 flex gap-5">
      <PixelPanel variant="wood" title={t('nav.badge')} className="w-[58%]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-3xl text-[#ffd866] leading-tight">{rank}</div>
            <div className="text-xl text-pixel-text-muted">{university} · {t('hub.day')} {currentDay}</div>
          </div>
          <PixelButton size="sm" variant="primary" onClick={() => router.push('/hub')}>{t('nav.back_to_hub')}</PixelButton>
        </div>
        <AppearancePicker value={appearance as any} onChange={(v) => setAppearance(v)} />
      </PixelPanel>
      <PixelPanel variant="metal" title={t('report.title')} className="flex-1">
        {recent.length === 0 && <p className="text-xl text-pixel-text-muted">{t('lib.empty')}</p>}
        {recent.map((r) => (
          <div key={r.timestamp} className="flex items-center gap-3 border-b-2 border-[#2c4a73] py-2">
            <div className="w-10 h-10 border-4 border-[#0b1626] flex items-center justify-center font-heading text-sm text-white"
              style={{ background: { A: '#2f9e8f', B: '#3f7fc0', C: '#d29922', D: '#dd363d' }[r.overallGrade] }}>{r.overallGrade}</div>
            <div className="flex-1">
              <div className="text-xl leading-tight">{r.caseId}</div>
              <div className="text-base text-pixel-text-muted">{r.outcomeGood ? t('db.outcome_won') : t('db.outcome_ended')} · {r.overall}/100</div>
            </div>
          </div>
        ))}
      </PixelPanel>
    </div>
  );
}
