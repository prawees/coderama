"use client";
import type { ClinicalCase } from "@/lib/clinical/model";
import { simClock, SimState, requiredChecklist } from "@/lib/clinical/engine";
import type { CaseReport, Grade } from "@/lib/scorecard";
import { useT } from "@/lib/i18n/useT";
import { PixelButton } from "@/components/ui/PixelButton";

const GRADE_COLOR: Record<Grade, string> = { A: '#38b764', B: '#3f7fc0', C: '#d29922', D: '#ac3232' };

/** Stepped pixel line chart of HR, SBP and SpO2 across the case. */
function VitalsChart({ sim }: { sim: SimState }) {
  const log = sim.vitalsLog;
  const W = 520, H = 150, P = 24;
  const tMax = Math.max(60, log[log.length - 1]?.t || 60);
  const x = (t: number) => P + (t / tMax) * (W - P * 2);
  const y = (v: number, max: number) => H - P - (Math.max(0, Math.min(max, v)) / max) * (H - P * 2);
  const path = (key: 'hr' | 'sbp' | 'spo2', max: number) => log.map((p, i) => {
    const px = Math.round(x(p.t)), py = Math.round(y(p[key], max));
    return i === 0 ? `M${px},${py}` : `H${px}V${py}`;
  }).join('');
  const marks = sim.events.filter((e) => e.kind === 'milestone' || e.kind === 'outcome' || (e.kind === 'give' && e.tone === 'bad'));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="0" y="0" width={W} height={H} fill="#0b1626" />
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P} x2={W - P} y1={P + f * (H - P * 2)} y2={P + f * (H - P * 2)} stroke="#16263f" strokeWidth="2" />)}
      {marks.map((m, i) => <line key={i} x1={x(m.t)} x2={x(m.t)} y1={P} y2={H - P} stroke={m.tone === 'bad' ? '#ac3232' : '#38b764'} strokeWidth="2" strokeDasharray="4 4" />)}
      <path d={path('hr', 200)} fill="none" stroke="#99e550" strokeWidth="3" />
      <path d={path('sbp', 200)} fill="none" stroke="#ffcd75" strokeWidth="3" />
      <path d={path('spo2', 100)} fill="none" stroke="#b5e2ff" strokeWidth="3" />
      <text x={P} y={14} fill="#99e550" fontSize="12" fontFamily="VT323, monospace">HR</text>
      <text x={P + 30} y={14} fill="#ffcd75" fontSize="12" fontFamily="VT323, monospace">SBP</text>
      <text x={P + 66} y={14} fill="#b5e2ff" fontSize="12" fontFamily="VT323, monospace">SpO2</text>
      <text x={W - P} y={H - 6} fill="#6d82a3" fontSize="12" textAnchor="end" fontFamily="VT323, monospace">T+{simClock(tMax)}</text>
    </svg>
  );
}

export function Debrief({ c, sim, report, onSignOff }: { c: ClinicalCase; sim: SimState; report: CaseReport; onSignOff: () => void }) {
  const { t } = useT();
  const checklist = requiredChecklist(c, sim);
  const axisLabel: Record<string, [string, string]> = {
    assessment: [t('report.assessment'), t('report.assessment_desc')],
    triage: [t('report.triage'), t('report.triage_desc')],
    stewardship: [t('report.stewardship'), t('report.stewardship_desc')],
    pharm: [t('report.pharm'), t('report.pharm_desc')],
    ethics: [t('report.ethics'), t('report.ethics_desc')],
  };
  const expected = c.diagnoses[0] || '?';
  const outcome = sim.status === 'won' ? t('db.outcome_won') : sim.status === 'died' ? t('db.outcome_died') : t('db.outcome_ended');

  return (
    <div className="absolute inset-0 z-[300] bg-pixel-ink/95 flex items-center justify-center p-4">
      <div className="pixel-frame-paper w-full max-w-[1180px] h-full max-h-[680px] flex flex-col relative">
        <div className="absolute -top-4 -right-3 rotate-6 border-4 px-4 py-1 font-heading text-4xl bg-[#ffe9c9]" style={{ borderColor: GRADE_COLOR[report.overallGrade], color: GRADE_COLOR[report.overallGrade] }}>
          {report.overallGrade}
        </div>
        <div className="flex items-end justify-between border-b-4 border-[#16263f] px-5 pt-4 pb-2">
          <div>
            <h2 className="font-heading text-xs tracking-widest text-[#16263f]">{t('db.title')} · {t('report.subtitle')}</h2>
            <p className="text-2xl text-[#16263f] leading-tight">{c.title}</p>
          </div>
          <div className={`text-2xl ${sim.status === 'won' ? 'text-[#257179]' : 'text-[#ac3232]'}`}>{outcome} · {t('db.sim_time', { t: simClock(sim.t) })}</div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-[1.05fr_1fr] gap-5 px-5 py-3 overflow-hidden">
          {/* Left: scores, chart, diagnosis */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
            {report.axes.map((a) => (
              <div key={a.key} className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 border-4 border-[#16263f] flex items-center justify-center font-heading text-sm text-white" style={{ background: GRADE_COLOR[a.grade] }}>{a.grade}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-lg leading-tight text-[#16263f]"><span>{axisLabel[a.key][0]}</span><span className="text-[#6d82a3]">{t(a.detailKey, a.detailVars)}</span></div>
                  <div className="text-sm text-[#8d5524] leading-tight">{axisLabel[a.key][1]}</div>
                  <div className="h-3 mt-1 bg-[#e0c39a] border-2 border-[#16263f]"><div className="h-full" style={{ width: `${a.score}%`, background: GRADE_COLOR[a.grade] }} /></div>
                </div>
              </div>
            ))}
            <div className="border-4 border-[#16263f] p-2 bg-[#fff4e0]">
              <div className="text-sm text-[#6d82a3] uppercase">{t('db.dx')}</div>
              <div className={`text-xl leading-tight ${report.diagnosisCorrect ? 'text-[#257179]' : 'text-[#ac3232]'}`}>
                {report.diagnosisCorrect ? t('db.dx_correct', { dx: expected }) : sim.diagnosis ? t('db.dx_wrong', { choice: sim.diagnosis.choice, dx: expected }) : t('db.dx_none', { dx: expected })}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#6d82a3] uppercase mb-1">{t('db.vitals_trend')}</div>
              <VitalsChart sim={sim} />
            </div>
          </div>

          {/* Right: critical actions + timeline */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="text-sm text-[#6d82a3] uppercase mb-1">{t('db.checklist')}</div>
              {checklist.map((r, i) => (
                <div key={i} className="flex gap-2 text-lg leading-tight mb-1 text-[#16263f]">
                  <span className={r.done ? 'text-[#257179]' : 'text-[#ac3232]'}>{r.done ? '✓' : '✗'}</span>
                  <div>
                    <div>{r.action}{r.dose ? <span className="text-[#8d5524]"> · {r.dose}</span> : null}</div>
                    {r.teaching && <div className="text-sm text-[#6d82a3]">{t('db.teaching')}: {r.teaching}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 border-t-4 border-[#16263f] pt-2">
              <div className="text-sm text-[#6d82a3] uppercase mb-1">{t('db.timeline')}</div>
              {sim.events.map((e, i) => (
                <div key={i} className="text-base leading-tight text-[#16263f]">
                  <span className="text-[#6d82a3]">T+{simClock(e.t)}</span>{' '}
                  <span className={e.tone === 'bad' ? 'text-[#ac3232]' : e.tone === 'good' ? 'text-[#257179]' : ''}>{e.kind === 'give' && e.detail && e.detail !== 'indicated' && e.detail !== 'neutral' ? `${e.text} [${e.detail.replace('_', ' ')}]` : e.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-4 border-[#16263f] px-5 py-3">
          <div className="text-xl text-[#16263f]">
            “{t(`report.grade_${report.overallGrade}`)}” · +{report.xpAwarded} XP · +${report.cashAwarded}
          </div>
          <PixelButton variant="wood" onClick={onSignOff}>{t('report.sign_off')}</PixelButton>
        </div>
      </div>
    </div>
  );
}
