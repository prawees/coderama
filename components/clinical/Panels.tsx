"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXAM_ITEMS, EXAM_GROUPS, ExamGroup, BodyRegion, REGION_LABEL, HISTORY_HEADINGS, ACTION_CATEGORIES, ActionCategory, CatalogAction } from "@/lib/clinical/catalog";
import type { ClinicalCase, CaseInvestigation, Lang } from "@/lib/clinical/model";
import { simClock, SimState, SimAction, Order } from "@/lib/clinical/engine";
import { differentialOptions } from "@/lib/clinical/registry";
import { useT } from "@/lib/i18n/useT";
import { PixelButton } from "@/components/ui/PixelButton";

type Dispatch = (a: SimAction) => void;
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="text-lg text-[#b5e2ff] uppercase tracking-wide mb-1 border-b-2 border-[#2c4a73]">{children}</h3>;
const Row = ({ children, tone = 'info', className = '' }: { children: React.ReactNode; tone?: 'info' | 'warn' | 'bad' | 'good'; className?: string }) => {
  const b = { info: 'border-[#2c4a73] bg-[#16263f]', warn: 'border-[#ffcd75] bg-[#3a2a08]', bad: 'border-[#d95763] bg-[#3a0e14]', good: 'border-[#38b764] bg-[#10301c]' }[tone];
  return <div className={`border-4 ${b} px-3 py-2 ${className}`}>{children}</div>;
};
const qText = (q: any, lang: Lang) => (typeof q === 'string' ? q : q[lang]);

// ─── Media slot: real image when present, labelled placeholder when not ────
export function MediaSlot({ src, fallback, label, compact = false }: { src?: string; fallback: string; label: string; compact?: boolean }) {
  const { t } = useT();
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const url = src || fallback;
  if (failed) {
    return (
      <div className={`border-4 border-dashed border-[#6d82a3] bg-pixel-ink ${compact ? 'p-2' : 'p-4'} text-center`}>
        <div className="text-base text-pixel-text-muted uppercase">{t('cx.media_slot')}: {label}</div>
        {!compact && <div className="text-sm text-[#6d82a3] mt-1 break-all">{t('cx.media_hint', { path: `public${fallback}` })}</div>}
      </div>
    );
  }
  return (
    <>
      <img src={url} alt={label} onError={() => setFailed(true)} onClick={() => setOpen(true)}
        className={`border-4 border-[#2c4a73] bg-black cursor-zoom-in ${compact ? 'max-h-24' : 'max-h-56'} w-auto`} style={{ imageRendering: 'auto' }} />
      {open && (
        <div className="absolute inset-0 z-[400] bg-pixel-ink/95 flex items-center justify-center p-6" onClick={() => setOpen(false)}>
          <img src={url} alt={label} className="max-w-full max-h-full border-4 border-[#6d82a3]" style={{ imageRendering: 'auto' }} />
        </div>
      )}
    </>
  );
}

// ─── Live vitals strip ──────────────────────────────────────────────────
export function VitalsStrip({ sim }: { sim: SimState }) {
  const { t } = useT();
  const v = sim.vitals; const on = sim.monitorOn;
  const cell = (label: string, value: string, bad: boolean) => (
    <div className="bg-pixel-ink border-4 border-[#2c4a73] px-2 py-1">
      <div className="text-xs text-[#6d82a3]">{label}</div>
      <div className={`text-2xl leading-none ${!on ? 'text-[#6d82a3]' : bad ? 'text-[#d95763]' : 'text-[#99e550]'}`}>{on ? value : '--'}</div>
    </div>
  );
  return (
    <div>
      <div className="grid grid-cols-3 gap-1">
        {cell('HR', `${Math.round(v.hr)}`, v.hr > 120 || v.hr < 50)}
        {cell('BP', `${Math.round(v.sbp)}/${Math.round(v.dbp)}`, v.sbp < 90)}
        {cell('SpO2', `${Math.round(v.spo2)}%`, v.spo2 < 92)}
        {cell('RR', `${Math.round(v.rr)}`, v.rr > 24 || v.rr < 8)}
        {cell('T', `${v.temp.toFixed(1)}`, v.temp > 38.3 || v.temp < 35.5)}
        {cell('GCS', `${Math.round(v.gcs)}`, v.gcs < 13)}
      </div>
      {!on && <div className="text-sm text-[#ffcd75] mt-1 leading-tight">{t('cx.monitor_hint')}</div>}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────
export function HistoryPanel({ c, sim, dispatch }: { c: ClinicalCase; sim: SimState; dispatch: Dispatch }) {
  const { t, lang } = useT();
  const unlocked = new Set(c.history.filter((h) => h.visible).map((h) => h.id));
  sim.asked.forEach((id) => c.history.find((h) => h.id === id)?.unlocks.forEach((u) => unlocked.add(u)));
  const asked = sim.asked.map((id) => c.history.find((h) => h.id === id)!).filter(Boolean).reverse();
  return (
    <div className="grid grid-cols-2 gap-6 h-full min-h-0 px-2">
      <div className="overflow-y-auto pr-4 space-y-4 custom-scrollbar">
        <p className="text-base text-pixel-text-muted pb-2 border-b-2 border-pixel-ink">{t('cx.history_hint')}</p>
        {HISTORY_HEADINGS.map((h) => {
          const qs = c.history.filter((q) => q.category === h.id && unlocked.has(q.id));
          if (!qs.length) return null;
          return (
            <div key={h.id}>
              <H3>{h[lang]}</H3>
              {qs.map((q) => (
                <motion.button layout key={q.id} disabled={sim.asked.includes(q.id)} onClick={() => dispatch({ type: 'ask', id: q.id })}
                  whileHover={sim.asked.includes(q.id) ? {} : { scale: 1.01 }} whileTap={sim.asked.includes(q.id) ? {} : { scale: 0.98 }}
                  className={`w-full text-left px-4 py-2 mb-2 text-lg border-4 shadow-sm transition-colors ${sim.asked.includes(q.id) ? 'border-[#2c4a73] bg-[#0b1626] text-[#6d82a3] opacity-60' : 'border-[#3f7fc0] bg-[#16263f] text-[#f4f4f4] hover:bg-[#1e3a66] hover:border-[#41a6f6]'}`}>
                  {sim.asked.includes(q.id) ? '✓ ' : '▸ '}{qText(q.q, lang)}
                </motion.button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="overflow-y-auto pr-4 space-y-3 custom-scrollbar border-l-4 border-pixel-ink pl-6">
        <H3>{t('cx.transcript')}</H3>
        {asked.length === 0 && <p className="text-lg text-[#6d82a3]">{t('cx.no_questions')}</p>}
        <AnimatePresence initial={false}>
          {asked.map((q) => (
            <motion.div key={q.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} layout>
              <Row className="mb-2">
            <div className="text-base text-[#b5e2ff]">{t('cx.doctor')}: {qText(q.q, lang)}</div>
            <div className="text-lg text-[#ffe9c9] leading-snug">{t('cx.patient')}: {q.answer}</div>
              </Row>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Examination (ABCDE + secondary survey) ─────────────────────────────
export function ExamPanel({ c, sim, dispatch, region, clearRegion }: { c: ClinicalCase; sim: SimState; dispatch: Dispatch; region: BodyRegion | null; clearRegion: () => void }) {
  const { t, lang } = useT();
  const [group, setGroup] = useState<ExamGroup>('A');
  const items = region ? EXAM_ITEMS.filter((i) => i.region === region) : EXAM_ITEMS.filter((i) => i.group === group);
  const findings = sim.events.filter((e) => e.kind === 'exam').slice().reverse();
  const doneGroup = (g: ExamGroup) => sim.examined.some((id) => EXAM_ITEMS.find((i) => i.id === id)?.group === g);
  return (
    <div className="grid grid-cols-2 gap-6 h-full min-h-0 px-2">
      <div className="flex flex-col min-h-0 pr-4">
        <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b-2 border-pixel-ink">
          {EXAM_GROUPS.map((g) => (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={g.id} onClick={() => { clearRegion(); setGroup(g.id); }}
              className={`px-3 py-2 text-lg border-4 shadow-sm ${!region && group === g.id ? 'border-[#ffd866] bg-[#1e3a66] text-white' : 'border-[#2c4a73] bg-pixel-ink text-[#a9bfd9] hover:bg-[#16263f] hover:text-white'}`}
              title={g[lang]}>
              {doneGroup(g.id) ? '✓ ' : ''}{g.id === 'SEC' ? (lang === 'th' ? 'ละเอียด' : '2°') : g.id}
            </motion.button>
          ))}
        </div>
        <div className="text-lg text-[#ffd866] mb-3">
          {region ? <>{t('cx.region_filter', { region: REGION_LABEL[region][lang] })} <button className="underline text-[#b5e2ff] ml-3 hover:text-white" onClick={clearRegion}>{t('cx.clear')}</button></> : EXAM_GROUPS.find((g) => g.id === group)?.[lang]}
        </div>
        <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {items.map((i) => {
              const done = sim.examined.includes(i.id);
              return (
                <motion.button layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} key={i.id} onClick={() => dispatch({ type: 'exam', id: i.id })}
                  whileHover={done ? {} : { scale: 1.02 }} whileTap={done ? {} : { scale: 0.98 }}
                  className={`w-full text-left px-4 py-2 text-lg border-4 flex justify-between items-center gap-2 transition-colors ${done ? 'border-[#38b764] bg-[#10301c] text-[#99e550] opacity-80' : 'border-[#3f7fc0] bg-[#16263f] hover:bg-[#1e3a66] hover:border-[#41a6f6]'}`}>
                  <span>{done ? '✓ ' : '▸ '}{i[lang]}</span>
                  {region && <span className="text-sm px-2 py-1 bg-pixel-ink border-2 border-[#2c4a73] shrink-0">{i.group === 'SEC' ? '2°' : i.group}</span>}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <div className="overflow-y-auto pr-4 space-y-3 custom-scrollbar border-l-4 border-pixel-ink pl-6">
        <H3>{t('cx.findings')}</H3>
        {findings.length === 0 && <p className="text-lg text-[#6d82a3] italic">{t('cx.no_findings')}</p>}
        <AnimatePresence initial={false}>
          {findings.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} layout>
              <Row tone={f.tone === 'warn' ? 'warn' : 'info'} className="mb-2 shadow-sm">
                <div className="text-base text-[#b5e2ff]">T+{simClock(f.t)} · {f.text}</div>
                <div className="text-lg leading-snug">{f.detail}</div>
              </Row>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Investigations ─────────────────────────────────────────────────────
function ResultBlock({ o, c, now }: { o: Order; c: ClinicalCase; now: number }) {
  const { t } = useT();
  if (o.readyAt > now) {
    const pct = Math.min(100, ((now - o.orderedAt) / (o.readyAt - o.orderedAt)) * 100);
    return (
      <Row>
        <div className="flex justify-between text-lg"><span>{o.name}</span><span className="text-pixel-text-muted">{t('cx.pending', { m: Math.max(1, Math.ceil((o.readyAt - now) / 60)) })}</span></div>
        <div className="pixel-bar mt-1 !h-3"><div className="fill bg-[#41a6f6]" style={{ width: `${pct}%` }} /></div>
      </Row>
    );
  }
  const test = c.tests.find((x) => x.name === o.name);
  const visual = test && (test.kind === 'ecg' || test.kind === 'imaging');
  const slot = (inv?: CaseInvestigation) => `/cases/${c.id}/${inv?.id || o.name.replace(/[^\w]+/g, '_').toLowerCase()}.png`;
  return (
    <Row tone={o.results.some((r) => r.abnormal) ? 'warn' : 'info'}>
      <div className="text-lg text-[#b5e2ff]">{o.name} <span className="text-sm text-[#6d82a3]">T+{simClock(o.readyAt)}</span></div>
      {o.results.map((r) => (
        <div key={r.id} className="mt-1">
          <div className="flex flex-wrap gap-x-3 text-lg">
            <span className={r.abnormal ? 'text-[#ffcd75]' : 'text-white'}>{r.name}</span>
            {r.value && <span className={r.abnormal ? 'text-[#ffcd75]' : 'text-white'}>{r.value}{r.unit ? ` ${r.unit}` : ''}</span>}
            {r.normalRange && <span className="text-[#6d82a3]">{t('cx.ref')} {r.normalRange}</span>}
            {r.abnormal && <span className="text-sm bg-[#ac3232] px-1 self-center">{t('cx.abn')}</span>}
          </div>
          {r.report && <div className="text-base text-[#c2c3c7] leading-snug">{r.report}</div>}
          {(r.kind !== 'lab' || r.imageUrl) && <div className="mt-1"><MediaSlot src={r.imageUrl} fallback={slot(r)} label={r.name} /></div>}
        </div>
      ))}
      {o.generic && (
        <div className="mt-1">
          {o.generic.value && <div className="text-lg">{o.generic.value}</div>}
          {o.generic.report && <div className="text-base text-[#c2c3c7]">{o.generic.report}</div>}
          {visual && <div className="mt-1"><MediaSlot fallback={slot()} label={o.name} compact /></div>}
        </div>
      )}
    </Row>
  );
}

export function InvestigationsPanel({ c, sim, dispatch }: { c: ClinicalCase; sim: SimState; dispatch: Dispatch }) {
  const { t } = useT();
  const [q, setQ] = useState('');
  const cats = useMemo(() => Array.from(new Set(c.tests.map((x) => x.category))), [c]);
  const [cat, setCat] = useState(cats[0]);
  const list = q ? c.tests.filter((x) => (x.name + ' ' + (x.aliases || []).join(' ')).toLowerCase().includes(q.toLowerCase())) : c.tests.filter((x) => x.category === cat);
  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-6 h-full min-h-0 px-2">
      <div className="flex flex-col min-h-0 pr-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('cx.search')} className="bg-pixel-ink border-4 border-[#2c4a73] px-3 py-2 text-lg mb-3 outline-none focus:border-[#41a6f6] select-text transition-colors" />
        <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b-2 border-pixel-ink">
          {cats.map((k) => <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={k} onClick={() => { setQ(''); setCat(k); }} className={`px-2 py-1 text-base border-2 shadow-sm ${!q && cat === k ? 'border-[#ffd866] bg-[#1e3a66] text-white' : 'border-[#2c4a73] text-pixel-text-muted hover:text-white'}`}>{k}</motion.button>)}
        </div>
        <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {list.map((x) => {
              const ordered = sim.orders.some((o) => o.name === x.name);
              return (
                <motion.button layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} key={x.name} disabled={ordered} onClick={() => dispatch({ type: 'order', name: x.name })}
                  whileHover={ordered ? {} : { scale: 1.02 }} whileTap={ordered ? {} : { scale: 0.98 }}
                  className={`w-full text-left px-4 py-2 text-lg border-4 flex justify-between items-center transition-colors shadow-sm ${ordered ? 'border-[#2c4a73] bg-[#0b1626] text-[#6d82a3] opacity-70' : 'border-[#3f7fc0] bg-[#16263f] hover:bg-[#1e3a66] hover:border-[#41a6f6]'}`}>
                  <span>{x.name}</span><span className="text-sm px-2 py-1 bg-pixel-ink border-2 border-[#2c4a73] self-center">{ordered ? t('cx.ordered') : `~${Math.max(1, Math.round(x.turnaround / 60))}m`}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <div className="overflow-y-auto pr-4 space-y-3 custom-scrollbar border-l-4 border-pixel-ink pl-6">
        <H3>{t('cx.results')}</H3>
        {sim.orders.length === 0 && <p className="text-lg text-[#6d82a3] italic">{t('cx.no_orders')}</p>}
        <AnimatePresence initial={false}>
          {sim.orders.slice().reverse().map((o) => (
            <motion.div key={o.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} layout>
              <ResultBlock o={o} c={c} now={sim.t} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Treatment ──────────────────────────────────────────────────────────
export function doseOptionsFor(c: ClinicalCase, a: CatalogAction): string[] {
  const fromSat = Object.values(c.satisfiers).filter((s) => s.actions.includes(a.name)).flatMap((s) => s.doseOptions || []);
  return Array.from(new Set([...(a.doses || []), ...fromSat]));
}

export function TreatmentPanel({ c, sim, onChoose }: { c: ClinicalCase; sim: SimState; onChoose: (a: CatalogAction) => void }) {
  const { t, lang } = useT();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ActionCategory>('Monitoring and access');
  const list = (q ? c.actions.filter((a) => (a.name + ' ' + (a.aliases || []).join(' ')).toLowerCase().includes(q.toLowerCase())) : c.actions.filter((a) => a.category === cat))
    .slice().sort((a, b) => a.name.localeCompare(b.name));
  const given = sim.given.slice().reverse();
  return (
    <div className="grid grid-cols-[200px_1fr_240px] gap-6 h-full min-h-0 px-2">
      <div className="overflow-y-auto space-y-2 custom-scrollbar pr-2 border-r-4 border-pixel-ink">
        {ACTION_CATEGORIES.map((k) => (
          <motion.button whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }} key={k.id} onClick={() => { setQ(''); setCat(k.id); }} className={`w-full text-left px-3 py-2 text-base border-4 leading-tight shadow-sm transition-colors ${!q && cat === k.id ? 'border-[#ffd866] bg-[#1e3a66] text-white' : 'border-[#2c4a73] text-[#a9bfd9] hover:bg-[#16263f] hover:text-white'}`}>
            {lang === 'th' ? k.th : k.id}
          </motion.button>
        ))}
      </div>
      <div className="flex flex-col min-h-0 pr-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('cx.search')} className="bg-pixel-ink border-4 border-[#2c4a73] px-3 py-2 text-lg mb-3 outline-none focus:border-[#41a6f6] select-text transition-colors shadow-sm" />
        <div className="overflow-y-auto pr-2 grid grid-cols-2 gap-2 content-start custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {list.map((a) => (
              <motion.button layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} key={a.name} onClick={() => onChoose(a)} className="text-left px-3 py-2 text-lg border-4 border-[#3f7fc0] bg-[#16263f] hover:bg-[#1e3a66] hover:border-[#41a6f6] leading-tight shadow-sm transition-colors flex justify-between items-center">
                <span>{a.name}</span>
                {doseOptionsFor(c, a).length ? <span className="text-sm px-1 bg-pixel-ink border-2 border-[#2c4a73] text-[#ffcd75]">▾</span> : null}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="overflow-y-auto space-y-2 pl-4 border-l-4 border-pixel-ink custom-scrollbar pr-2">
        <H3>{t('cx.given')}</H3>
        {given.length === 0 && <p className="text-base text-[#6d82a3] italic">{t('cx.nothing_given')}</p>}
        <AnimatePresence initial={false}>
          {given.map((g, i) => (
            <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="text-base border-l-4 border-[#38b764] pl-3 py-1 bg-[#10301c]/50 leading-tight shadow-sm mb-2">
              <div className="text-sm text-[#99e550]">T+{simClock(g.t)}</div>
              <div className="text-white">{g.name}{g.dose ? ` (${g.dose})` : ''}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DosePicker({ action, options, onPick, onCancel }: { action: CatalogAction; options: string[]; onPick: (d: string) => void; onCancel: () => void }) {
  const { t } = useT();
  return (
    <div className="absolute inset-0 z-[250] bg-pixel-ink/85 flex items-center justify-center">
      <div className="pixel-frame-metal rivets w-[460px] max-w-[90%]">
        <div className="frame-inner p-4">
          <div className="text-xl text-[#ffd866] mb-3 leading-snug">{t('cx.dose_title', { name: action.name })}</div>
          <div className="grid grid-cols-2 gap-2">
            {options.map((d) => <button key={d} onClick={() => onPick(d)} className="pixel-btn bg-[#2c4a73] hover:bg-[#6d82a3] text-white px-3 py-2 text-xl">{d}</button>)}
          </div>
          <PixelButton size="sm" variant="alert" className="w-full mt-3" onClick={onCancel}>{t('cx.cancel')}</PixelButton>
        </div>
      </div>
    </div>
  );
}

// ─── Diagnosis, disposition, communication ──────────────────────────────
export function DiagnosisPanel({ c, sim, dispatch, onHandover }: { c: ClinicalCase; sim: SimState; dispatch: Dispatch; onHandover: () => void }) {
  const { t } = useT();
  const options = useMemo(() => differentialOptions(c), [c]);
  const dispo = c.actions.filter((a) => a.category === 'Disposition');
  return (
    <div className="grid grid-cols-3 gap-4 h-full min-h-0">
      <div className="overflow-y-auto pr-1">
        <H3>{t('cx.dx_title')}</H3>
        <p className="text-base text-pixel-text-muted mb-1">{t('cx.dx_hint')}</p>
        {options.map((d) => (
          <button key={d} onClick={() => dispatch({ type: 'diagnose', choice: d })}
            className={`w-full text-left px-3 py-1 mb-1 text-lg border-4 ${sim.diagnosis?.choice === d ? 'border-[#ffd866] bg-[#1e3a66]' : 'border-[#3f7fc0] bg-[#16263f] hover:bg-[#1e3a66]'}`}>{d}</button>
        ))}
        {sim.diagnosis && <p className="text-base text-[#ffd866] mt-1">{t('cx.dx_set', { dx: sim.diagnosis.choice })}</p>}
      </div>
      <div className="overflow-y-auto pr-1">
        <H3>{t('cx.comm_title')}</H3>
        {sim.ethicalAvailable.length === 0 && <p className="text-lg text-pixel-text-muted">{t('cx.no_comm')}</p>}
        {sim.ethicalAvailable.map((id) => (
          <button key={id} onClick={() => dispatch({ type: 'ethical', id })} className="w-full text-left px-3 py-1 mb-1 text-lg border-4 border-[#d77bba] bg-[#16263f] hover:bg-[#6b2f5f]">
            {c.nodes[id]?.label}
          </button>
        ))}
      </div>
      <div className="overflow-y-auto pr-1">
        <H3>{t('cx.dispo_title')}</H3>
        {dispo.map((a) => (
          <button key={a.name} onClick={() => dispatch({ type: 'dispose', name: a.name })}
            className={`w-full text-left px-3 py-1 mb-1 text-lg border-4 ${sim.disposition === a.name ? 'border-[#ffd866] bg-[#1e3a66]' : 'border-[#3f7fc0] bg-[#16263f] hover:bg-[#1e3a66]'}`}>{a.name}</button>
        ))}
        <PixelButton size="sm" variant="wood" className="w-full mt-2" onClick={onHandover}>{t('cx.handover')}</PixelButton>
      </div>
    </div>
  );
}

// ─── Timeline ───────────────────────────────────────────────────────────
export function TimelinePanel({ sim }: { sim: SimState }) {
  const { t } = useT();
  const toneCls = { good: 'border-[#38b764]', bad: 'border-[#d95763]', warn: 'border-[#ffcd75]', info: 'border-[#6d82a3]' };
  return (
    <div className="overflow-y-auto h-full pr-1 space-y-1">
      {sim.events.length === 0 && <p className="text-lg text-pixel-text-muted">{t('cx.timeline_empty')}</p>}
      {sim.events.slice().reverse().map((e, i) => (
        <div key={i} className={`border-l-4 ${toneCls[e.tone]} pl-2 text-lg leading-tight`}>
          <span className="text-[#6d82a3]">T+{simClock(e.t)}</span> <span className="text-sm uppercase text-[#94b0c2]">{e.kind}</span> {e.text}
          {e.detail && e.kind !== 'give' && <div className="text-base text-[#c2c3c7]">{e.detail}</div>}
        </div>
      ))}
    </div>
  );
}
