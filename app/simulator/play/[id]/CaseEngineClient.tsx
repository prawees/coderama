"use client";

import { useEffect, useMemo, useReducer, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useERStore } from "@/lib/erStore";
import { useT } from "@/lib/i18n/useT";
import { useTransition } from "@/lib/transition";
import { PixelButton } from "@/components/ui/PixelButton";
import { motion, AnimatePresence } from "framer-motion";
import { MinigameOverlay } from "@/components/game/MinigameOverlay";
import { buildClinicalCase, ClinicalCase } from "@/lib/clinical/model";
import { loadBuiltinCase, withDistractors } from "@/lib/clinical/registry";
import { getLocalCase, getCloudCase } from "@/lib/clinical/customCases";
import { createSim, simReducer, SimState, SimAction, SIM_SPEED, simClock } from "@/lib/clinical/engine";
import { EXAM_ITEMS, REGION_LABEL, BodyRegion, CatalogAction } from "@/lib/clinical/catalog";
import { computeReport, CaseReport } from "@/lib/scorecard";
import { HistoryPanel, ExamPanel, InvestigationsPanel, TreatmentPanel, DiagnosisPanel, TimelinePanel, VitalsStrip, DosePicker, doseOptionsFor } from "@/components/clinical/Panels";
import { Debrief } from "@/components/clinical/Debrief";
import type { LiveVitals } from "@/components/simulator/three/Monitor";

const ExamSuite3D = dynamic(() => import("@/components/simulator/ExamSuite3D"), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-pixel-text-muted font-heading text-xs">3D...</div>,
});

type Tab = 'history' | 'exam' | 'inv' | 'tx' | 'dx' | 'log';
const REGIONS: BodyRegion[] = ['head', 'neck', 'chest', 'abdomen', 'pelvis', 'upperLimbs', 'lowerLimbs', 'back'];

function ClinicalRun({ c, instanceId, fromLibrary }: { c: ClinicalCase; instanceId: string | null; fromLibrary: boolean }) {
  const { t, lang } = useT();
  const { wipeTo } = useTransition();
  const { removeCase, addXp, addCurrency, deductEnergy, addCaseReport } = useERStore();

  const [sim, dispatch] = useReducer((s: SimState, a: SimAction) => simReducer(c, s, a, lang), c, createSim);
  const [tab, setTab] = useState<Tab>('history');
  const [region, setRegion] = useState<BodyRegion | null>(null);
  const [dosing, setDosing] = useState<{ action: CatalogAction; options: string[] } | null>(null);
  const [minigame, setMinigame] = useState<{ action: CatalogAction; dose?: string } | null>(null);
  const [report, setReport] = useState<CaseReport | null>(null);
  const rewarded = useRef(false);

  // 3D refs, updated every render so the scene reads live values without re-rendering
  const vitalsRef = useRef<LiveVitals>({ ...sim.vitals });
  const pendingRef = useRef(true);
  const elapsedRef = useRef(0);
  const joltRef = useRef(0);
  const breathingRateRef = useRef(sim.vitals.rr);
  vitalsRef.current = { hr: sim.vitals.hr, sbp: sim.vitals.sbp, dbp: sim.vitals.dbp, rr: sim.vitals.rr, spo2: sim.vitals.spo2, temp: sim.vitals.temp };
  pendingRef.current = !sim.monitorOn;
  breathingRateRef.current = sim.vitals.rr;
  elapsedRef.current = sim.t;

  const paused = !!minigame || !!report || sim.status !== 'running';
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => dispatch({ type: 'tick', dt: 0.25 * SIM_SPEED }), 250);
    return () => clearInterval(id);
  }, [paused]);

  // Case finished: score once, pay out, show the debrief
  useEffect(() => {
    if (sim.status === 'running' || rewarded.current) return;
    rewarded.current = true;
    const r = computeReport(c, sim);
    addXp(r.xpAwarded); addCurrency(r.cashAwarded); addCaseReport(r);
    deductEnergy(Math.round(8 + sim.t / 60));
    setTimeout(() => setReport(r), 900);
  }, [sim.status]);

  const run = (a: CatalogAction, dose?: string) => {
    setDosing(null);
    if (a.physical) { setMinigame({ action: a, dose }); return; }
    dispatch({ type: 'give', name: a.name, dose });
  };
  const choose = (a: CatalogAction) => {
    const options = doseOptionsFor(c, a);
    if (options.length) { setDosing({ action: a, options }); return; }
    run(a);
  };
  const signOff = () => {
    if (instanceId) removeCase(instanceId);
    wipeTo(fromLibrary ? '/cases' : '/hub', fromLibrary ? t('nav.cases') : t('nav.back_to_hub'));
  };

  const cond = sim.status === 'died' ? 'dead' : sim.stability >= 75 ? 'stable' : sim.stability >= 35 ? 'unstable' : 'periarrest';
  const condColor = { stable: '#38b764', unstable: '#d29922', periarrest: '#d95763', dead: '#6d82a3' }[cond];
  const examinedRegions = useMemo(() => Array.from(new Set(sim.examined.map((id) => EXAM_ITEMS.find((i) => i.id === id)?.region).filter(Boolean))) as BodyRegion[], [sim.examined]);
  const inbox = sim.orders.filter((o) => o.seen).slice(-3).reverse();

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'history', label: t('cx.tab_history'), badge: sim.asked.length },
    { id: 'exam', label: t('cx.tab_exam'), badge: sim.examined.length },
    { id: 'inv', label: t('cx.tab_inv'), badge: sim.orders.length },
    { id: 'tx', label: t('cx.tab_tx'), badge: sim.given.length },
    { id: 'dx', label: t('cx.tab_dx'), badge: sim.ethicalAvailable.length || undefined },
    { id: 'log', label: t('cx.tab_log') },
  ];

  return (
    <motion.div className="absolute inset-0 bg-pixel-bg text-white font-pixel flex flex-col overflow-hidden select-none">
      {/* Pixel scanlines (hard 2px steps, no smooth gradient) */}
      <div className="absolute inset-0 z-[100] pointer-events-none opacity-30 scanlines" />

      {minigame && (
        <MinigameOverlay
          interventionName={minigame.action.physical === 'cpr' ? `CPR: ${minigame.action.name}` : minigame.action.name}
          onBeat={() => { joltRef.current = 1; }}
          onComplete={(ok) => { const m = minigame; setMinigame(null); dispatch({ type: 'give', name: m.action.name, dose: m.dose, failedMinigame: !ok }); }}
        />
      )}
      {dosing && <DosePicker action={dosing.action} options={dosing.options} onPick={(d) => run(dosing.action, d)} onCancel={() => setDosing(null)} />}
      {report && <Debrief c={c} sim={sim} report={report} onSignOff={signOff} />}

      {/* TOP: 3D bedside */}
      <div className="relative h-[56%] w-full border-b-8 border-pixel-ink bg-[#16263f]">
        <ExamSuite3D
          vitalsRef={vitalsRef} pendingRef={pendingRef} elapsedRef={elapsedRef} joltRef={joltRef} breathingRateRef={breathingRateRef}
          appearance={c.appearance} examined={examinedRegions} pendingLabel={t('cx.monitor_off')}
          onHotspot={(r) => { setRegion(r); setTab('exam'); }}
        />

        <div className="absolute top-3 left-3 z-10 max-w-[34%] bg-pixel-ink border-4 border-[#6d82a3] pixel-shadow px-3 py-2">
          <div className="text-xl text-pixel-gold leading-tight">{t('cx.patient')}: {t('case.age')} {c.age} · {c.sex}</div>
          <div className="text-base text-[#ffe9c9] leading-tight line-clamp-2">{c.chiefComplaint}</div>
        </div>

        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          <div className="bg-pixel-ink border-4 border-[#6d82a3] px-3 py-1 font-heading text-xs text-[#99e550]">T+{simClock(sim.t)}</div>
          <motion.div className="border-4 border-pixel-ink px-3 py-1 text-lg text-white whitespace-nowrap" style={{ background: condColor }}
            animate={cond === 'periarrest' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={cond === 'periarrest' ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}>
            {t('cx.condition')}: {t(`cx.cond_${cond}`)}
          </motion.div>
        </div>
        <div className="absolute bottom-3 left-3 z-10 flex gap-2">
          <PixelButton size="sm" variant="secondary" disabled={sim.status !== 'running'} onClick={() => dispatch({ type: 'wait', seconds: 120 })}>{t('cx.wait')}</PixelButton>
          <PixelButton size="sm" variant="alert" disabled={sim.status !== 'running'} onClick={() => dispatch({ type: 'end' })}>{t('cx.end_case')}</PixelButton>
        </div>

        {/* Body regions: same as clicking the 3D patient */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 w-48">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => { setRegion(r); setTab('exam'); }}
              className={`pixel-btn text-left px-3 py-0.5 text-lg ${region === r && tab === 'exam' ? 'bg-[#3f7fc0] text-white' : examinedRegions.includes(r) ? 'bg-[#10301c] text-[#99e550]' : 'bg-[#16263f] text-[#f4f4f4] hover:bg-[#1e3a66]'}`}>
              {examinedRegions.includes(r) ? '✓ ' : '▸ '}{REGION_LABEL[r][lang]}
            </button>
          ))}
          <button onClick={() => { setRegion(null); setTab('exam'); }} className="pixel-btn text-left px-3 py-0.5 text-lg bg-[#6b2f5f] text-white">{t('cx.region_all')}</button>
        </div>

        {sim.popup && !report && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[52%] bg-pixel-ink border-4 pixel-shadow px-4 py-2"
            style={{ borderColor: sim.popup.tone === 'bad' ? '#d95763' : sim.popup.tone === 'good' ? '#38b764' : '#41a6f6' }}>
            {sim.popup.title && <div className="text-xl text-pixel-gold leading-tight">{sim.popup.title}</div>}
            <div className="text-xl leading-snug text-[#ffe9c9] max-h-24 overflow-y-auto">{sim.popup.text}</div>
            <div className="text-right mt-1"><PixelButton size="sm" variant="secondary" onClick={() => dispatch({ type: 'dismiss' })}>{t('cx.continue')}</PixelButton></div>
          </div>
        )}
      </div>

      {/* BOTTOM: clinical console */}
      <div className="flex-1 min-h-0 w-full flex bg-pixel-ink">
        <div className="w-44 shrink-0 flex flex-col border-r-4 border-[#2c4a73] bg-[#16263f]">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`text-left px-3 py-2 text-lg border-b-4 border-pixel-ink flex justify-between items-center leading-none ${tab === tb.id ? 'bg-[#3f7fc0] text-white' : 'text-pixel-text-muted hover:bg-[#1e3a66]'}`}>
              <span>{tb.label}</span>
              {!!tb.badge && <span className="text-sm bg-pixel-ink px-1 border-2 border-[#6d82a3]">{tb.badge}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 p-3 min-h-0">
          {tab === 'history' && <HistoryPanel c={c} sim={sim} dispatch={dispatch} />}
          {tab === 'exam' && <ExamPanel c={c} sim={sim} dispatch={dispatch} region={region} clearRegion={() => setRegion(null)} />}
          {tab === 'inv' && <InvestigationsPanel c={c} sim={sim} dispatch={dispatch} />}
          {tab === 'tx' && <TreatmentPanel c={c} sim={sim} onChoose={choose} />}
          {tab === 'dx' && <DiagnosisPanel c={c} sim={sim} dispatch={dispatch} onHandover={() => dispatch({ type: 'end' })} />}
          {tab === 'log' && <TimelinePanel sim={sim} />}
        </div>

        <div className="w-60 shrink-0 border-l-4 border-[#2c4a73] p-2 flex flex-col gap-2 min-h-0">
          <VitalsStrip sim={sim} />
          <div className="min-h-0 overflow-y-auto">
            <div className="text-lg text-[#b5e2ff] uppercase mb-1">{t('cx.inbox')}</div>
            {inbox.map((o) => (
              <button key={o.name} onClick={() => setTab('inv')} className={`w-full text-left text-base px-2 py-1 mb-1 border-4 leading-tight ${o.results.some((r) => r.abnormal) ? 'border-[#ffcd75]' : 'border-[#2c4a73]'}`}>
                {o.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CaseEngineContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const instanceId = search.get('instanceId');
  const customId = search.get('caseId');
  const fromLibrary = search.get('from') === 'library';
  const { t, lang } = useT();
  const activeCases = useERStore((s) => s.activeCases);
  const [c, setC] = useState<ClinicalCase | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (params.id === 'custom' && customId) {
        const local = getLocalCase(customId);
        const raw = local?.data || (await getCloudCase(customId));
        if (!alive) return;
        if (raw) setC(withDistractors(buildClinicalCase(customId, raw))); else setMissing(true);
        return;
      }
      const active = activeCases.find((x) => x.id === instanceId || x.id === params.id);
      const built = loadBuiltinCase(active ? active.caseDataId : params.id, lang);
      if (!alive) return;
      if (built) setC(built); else setMissing(true);
    })();
    return () => { alive = false; };
    // Loaded once per case; a language change mid-case does not rebuild the running sim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, customId]);

  if (missing) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 font-pixel">
        <p className="text-2xl text-pixel-gold">{t('case.not_found', { id: customId || params.id })}</p>
        <PixelButton onClick={() => router.push(fromLibrary ? '/cases' : '/hub')}>{t('nav.back')}</PixelButton>
      </div>
    );
  }
  if (!c) return <div className="absolute inset-0 flex items-center justify-center font-heading text-xs text-pixel-text-muted">{t('cx.loading_case')}</div>;
  return <ClinicalRun c={c} instanceId={instanceId} fromLibrary={fromLibrary} />;
}

export function CaseEngineClient({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-pixel-bg" />}>
      <CaseEngineContent params={params} />
    </Suspense>
  );
}
