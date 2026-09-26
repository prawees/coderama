/**
 * CODE RAMA - Real-time clinical simulation engine (pure reducer).
 *
 * Every player action costs simulated time. While the patient's critical
 * needs are unmet, clinical stability decays and vitals drift toward a
 * peri-arrest picture. Completing the case's required steps, with the right
 * dose, stabilizes the patient and applies the authored outcome.
 */
import { EXAM_ITEMS } from './catalog';
import type { CatalogAction, CatalogTest } from './catalog';
import { derivedFinding, doseKey, matchScore, norm, testMatchesInvestigation } from './model';
import type { ClinicalCase, Vitals, RNode, CaseInvestigation, ExamResult, Lang } from './model';

export const SIM_SPEED = 2; // sim seconds per real second

export type Tone = 'good' | 'bad' | 'info' | 'warn';
export interface SimEvent { t: number; kind: string; text: string; tone: Tone; detail?: string; }
export interface Order { name: string; orderedAt: number; readyAt: number; results: CaseInvestigation[]; generic?: { value: string; report: string }; seen: boolean; }
export interface Given { name: string; dose?: string; t: number; verdict: 'indicated' | 'neutral' | 'not_indicated' | 'wrong_dose' | 'contraindicated'; }
export interface Popup { title: string; text: string; tone: Tone; }

export interface SimState {
  t: number;
  status: 'running' | 'won' | 'died' | 'ended';
  vitals: Vitals;
  target: Vitals;
  stability: number;
  graceUntil: number;
  monitorOn: boolean;
  asked: string[];
  examined: string[];
  orders: Order[];
  given: Given[];
  currentId: string;
  hubId: string;
  completed: string[];
  completedAt: Record<string, number>;
  ethicalAvailable: string[];
  ethicalDone: string[];
  timers: { from: string; nodeId: string; deadline: number }[];
  events: SimEvent[];
  vitalsLog: { t: number; hr: number; sbp: number; spo2: number; rr: number }[];
  diagnosis?: { choice: string; correct: boolean; t: number };
  disposition?: string;
  popup?: Popup;
  lastOutcome?: string;
  firstTreatmentAt?: number;
  firstMedAt?: number;
  allergyAskedAt?: number;
}

export type SimAction =
  | { type: 'tick'; dt: number }
  | { type: 'wait'; seconds: number }
  | { type: 'ask'; id: string }
  | { type: 'exam'; id: string }
  | { type: 'order'; name: string }
  | { type: 'give'; name: string; dose?: string; failedMinigame?: boolean }
  | { type: 'ethical'; id: string }
  | { type: 'diagnose'; choice: string }
  | { type: 'dispose'; name: string }
  | { type: 'end' }
  | { type: 'dismiss' };

const CRASH: Vitals = { hr: 148, sbp: 62, dbp: 34, rr: 34, spo2: 79, temp: 37, gcs: 6 };
const NEUTRAL = /monitor|iv access|cannul|intraosseous|call for help|consult|oxygen|head tilt|suction|explain|fluid balance|neuro obs|urinary catheter|c-collar|spinal immobil/i;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const fmt = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
export const simClock = fmt;

// ─── Setup ────────────────────────────────────────────────────────────────
export function createSim(c: ClinicalCase): SimState {
  const s: SimState = {
    t: 0, status: 'running', vitals: { ...c.baseline }, target: { ...c.baseline },
    stability: c.baseline.hr === 0 ? 38 : clamp(100 - c.severity * 8, 35, 100), graceUntil: 45,
    monitorOn: false, asked: [], examined: [], orders: [], given: [],
    currentId: c.startId, hubId: c.startId, completed: [], completedAt: {}, ethicalAvailable: [], ethicalDone: [], timers: [],
    events: [{ t: 0, kind: 'start', text: c.chiefComplaint || c.title, tone: 'info' }],
    vitalsLog: [],
  };
  const start = c.nodes[c.startId];
  if (start?.kind === 'state') {
    if (start.narrative) s.events.push({ t: 0, kind: 'narrative', text: start.narrative, tone: 'info' });
    return s;
  }
  return advanceFrom(c, s, c.startId);
}

// ─── Graph traversal ──────────────────────────────────────────────────────
const outgoing = (c: ClinicalCase, id: string) => c.edges.filter((e) => e.source === id).map((e) => c.nodes[e.target]).filter(Boolean);

function applyOutcome(c: ClinicalCase, s: SimState, n: RNode): SimState {
  const ot = (n.outcomeType || '').toLowerCase();
  const target = { ...s.target, ...(n.vitalChanges || {}) };
  let stability = s.stability;
  let tone: Tone = 'info';
  if (/improv|resolv|success|win/.test(ot)) { stability += 12; tone = 'good'; }
  else if (/deterior/.test(ot)) { stability -= 20; tone = 'bad'; }
  else if (/critical|fatal|death|lose/.test(ot)) { stability -= 40; tone = 'bad'; }
  const text = n.narrative || n.label;
  return {
    ...s, target, stability: clamp(stability, 0, 100), lastOutcome: ot || s.lastOutcome,
    events: [...s.events, { t: s.t, kind: 'outcome', text, tone }],
    popup: text ? { title: n.label !== text ? n.label : '', text, tone } : s.popup,
  };
}

function advanceFrom(c: ClinicalCase, s0: SimState, id: string, depth = 0): SimState {
  let s = s0;
  if (depth > 20) return s;
  const outs = outgoing(c, id);
  let req: RNode | undefined;
  let hub = false;
  for (const n of outs) {
    if (n.kind === 'ethical') { if (!s.ethicalDone.includes(n.id) && !s.ethicalAvailable.includes(n.id)) s = { ...s, ethicalAvailable: [...s.ethicalAvailable, n.id] }; continue; }
    if (n.kind === 'timer') { s = { ...s, timers: [...s.timers, { from: id, nodeId: n.id, deadline: s.t + (n.minutes || 5) * 60 }] }; continue; }
    if (n.kind === 'intervention') { hub = true; continue; }
    if (n.kind === 'outcome') { s = applyOutcome(c, s, n); s = advanceFrom(c, s, n.id, depth + 1); if (s.currentId !== id) return s; continue; }
    if (n.kind === 'end') { s = applyOutcome(c, s, n); return finish(s, n.endOutcome === 'lose' ? 'died' : 'won'); }
    if (n.kind === 'required' || n.kind === 'state') { req ||= n; }
  }
  if (req) return { ...s, currentId: req.id, hubId: hub ? id : s.hubId };
  if (hub) return { ...s, currentId: id, hubId: id };
  // Nothing left to wait for: the authored pathway is complete.
  const bad = /critical|fatal|death|deterior/.test(s.lastOutcome || '');
  return finish({ ...s, currentId: id }, bad ? 'ended' : 'won');
}

function finish(s: SimState, status: SimState['status']): SimState {
  if (s.status !== 'running') return s;
  const text = status === 'won' ? 'Patient stabilized. Hand over to the admitting team.' : status === 'died' ? 'The patient has died.' : 'The patient remains critically unwell.';
  return { ...s, status, events: [...s.events, { t: s.t, kind: 'end', text, tone: status === 'won' ? 'good' : 'bad' }] };
}

// ─── Satisfaction ─────────────────────────────────────────────────────────
function doneWith(c: ClinicalCase, s: SimState, caseAction: string): boolean {
  const sat = c.satisfiers[caseAction];
  if (!sat) return s.given.some((g) => g.name === caseAction);
  if (sat.tests.some((t) => s.orders.some((o) => o.name === t))) return true;
  return s.given.some((g) => sat.actions.includes(g.name) && g.verdict !== 'wrong_dose' && (!sat.correctDose || !g.dose || doseKey(g.dose) === doseKey(sat.correctDose)));
}

function checkProgress(c: ClinicalCase, s0: SimState): SimState {
  let s = s0;
  for (let guard = 0; guard < 12 && s.status === 'running'; guard++) {
    const cur = c.nodes[s.currentId];
    if (!cur || cur.kind !== 'required') break;
    const ok = (cur.groups || []).every((g) => g.some((a) => doneWith(c, s, a)));
    if (!ok) break;
    s = {
      ...s, completed: [...s.completed, cur.id], completedAt: { ...s.completedAt, [cur.id]: s.t },
      stability: clamp(s.stability + 12, 0, 100), graceUntil: s.t + 120,
      events: [...s.events, { t: s.t, kind: 'milestone', text: cur.label, tone: 'good' }],
    };
    s = advanceFrom(c, s, cur.id);
  }
  return s;
}

// ─── Physiology ───────────────────────────────────────────────────────────
function tick(c: ClinicalCase, s0: SimState, dt: number): SimState {
  if (s0.status !== 'running' || dt <= 0) return s0;
  let s = { ...s0, t: s0.t + dt };
  if (s.t > s.graceUntil) {
    const decayPerMin = 0.35 + 0.55 * c.severity;
    s.stability = clamp(s.stability - decayPerMin * (dt / 60), 0, 100);
  }
  const k = clamp((45 - s.stability) / 45, 0, 1) * 0.85;
  const eff = { ...s.target } as Vitals;
  (Object.keys(eff) as (keyof Vitals)[]).forEach((key) => {
    if (key === 'temp') return;
    if (key === 'hr' && s.target.hr === 0) return;
    eff[key] = s.target[key] + (CRASH[key] - s.target[key]) * k;
  });
  const a = Math.min(1, dt / 40);
  const v = { ...s.vitals };
  (Object.keys(v) as (keyof Vitals)[]).forEach((key) => { v[key] = v[key] + (eff[key] - v[key]) * a; });
  s.vitals = v;

  // Results
  const newly = s.orders.filter((o) => !o.seen && o.readyAt <= s.t);
  if (newly.length) {
    s.orders = s.orders.map((o) => (newly.includes(o) ? { ...o, seen: true } : o));
    s.events = [...s.events, ...newly.map((o) => ({ t: s.t, kind: 'result', text: o.name, tone: (o.results.some((r) => r.abnormal) ? 'warn' : 'info') as Tone }))];
  }
  // Timers
  for (const tm of s.timers) {
    if (s.t >= tm.deadline && s.currentId === tm.from) {
      s = { ...s, timers: s.timers.filter((x) => x !== tm), events: [...s.events, { t: s.t, kind: 'timer', text: c.nodes[tm.nodeId]?.label || 'Time-critical window missed', tone: 'bad' }] };
      s = advanceFrom(c, s, tm.nodeId);
    }
  }
  // Vitals log
  const last = s.vitalsLog[s.vitalsLog.length - 1];
  if (!last || s.t - last.t >= 15) s.vitalsLog = [...s.vitalsLog, { t: s.t, hr: v.hr, sbp: v.sbp, spo2: v.spo2, rr: v.rr }];
  if (s.stability <= 0) return finish({ ...s, vitals: { ...v, hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0 } }, 'died');
  return s;
}

const advance = (c: ClinicalCase, s: SimState, seconds: number) => {
  let x = s; let left = seconds;
  while (left > 0 && x.status === 'running') { const d = Math.min(5, left); x = tick(c, x, d); left -= d; }
  return x;
};

// ─── Results ──────────────────────────────────────────────────────────────
function resultsFor(c: ClinicalCase, test: CatalogTest, s: SimState): Pick<Order, 'results' | 'generic'> {
  const results = c.investigations.filter((inv) => testMatchesInvestigation(test, inv));
  if (results.length) return { results };
  const v = s.vitals;
  if (test.kind === 'ecg') {
    const rate = Math.round(v.hr);
    const rhythm = rate === 0 ? 'No perfusing rhythm identified. Compare with the monitor rhythm strip.' : rate > 100 ? `Sinus tachycardia, rate ${rate}/min. No acute ST change.` : rate < 60 ? `Sinus bradycardia, rate ${rate}/min.` : `Normal sinus rhythm, rate ${rate}/min. Normal axis. No acute ST change.`;
    return { results: [], generic: { value: '', report: rhythm } };
  }
  if (test.kind === 'imaging') return { results: [], generic: { value: '', report: 'No acute abnormality detected.' } };
  return { results: [], generic: { value: 'Within normal limits', report: test.normalRange ? `Reference ${test.normalRange}${test.unit ? ' ' + test.unit : ''}` : '' } };
}

// ─── Reducer ──────────────────────────────────────────────────────────────
export function simReducer(c: ClinicalCase, s: SimState, a: SimAction, lang: Lang = 'en'): SimState {
  if (a.type === 'dismiss') return { ...s, popup: undefined };
  if (s.status !== 'running' && a.type !== 'diagnose' && a.type !== 'dispose' && a.type !== 'end') return s;

  switch (a.type) {
    case 'tick': return tick(c, s, a.dt);
    case 'wait': return advance(c, { ...s, events: [...s.events, { t: s.t, kind: 'wait', text: `Reassess in ${Math.round(a.seconds / 60)} min`, tone: 'info' }] }, a.seconds);

    case 'ask': {
      const q = c.history.find((h) => h.id === a.id);
      if (!q || s.asked.includes(a.id)) return s;
      let x: SimState = { ...s, asked: [...s.asked, a.id], events: [...s.events, { t: s.t, kind: 'history', text: typeof q.q === 'string' ? q.q : q.q[lang], tone: 'info', detail: q.answer }] };
      if (q.category === 'allergy' && x.allergyAskedAt === undefined) x.allergyAskedAt = s.t;
      return advance(c, x, 20);
    }

    case 'exam': {
      const item = EXAM_ITEMS.find((i) => i.id === a.id);
      if (!item) return s;
      const res: ExamResult = c.exam[item.id] || derivedFinding(item, s.vitals, lang) || { finding: item.normal[lang], abnormal: false };
      const x: SimState = { ...s, examined: s.examined.includes(a.id) ? s.examined : [...s.examined, a.id], events: [...s.events, { t: s.t, kind: 'exam', text: item[lang], tone: res.abnormal ? 'warn' : 'info', detail: res.finding }] };
      return advance(c, x, item.seconds);
    }

    case 'order': {
      const test = c.tests.find((t) => t.name === a.name);
      if (!test || s.orders.some((o) => o.name === a.name)) return s;
      const r = resultsFor(c, test, s);
      let x: SimState = { ...s, orders: [...s.orders, { name: test.name, orderedAt: s.t, readyAt: s.t + test.turnaround, seen: false, ...r }], events: [...s.events, { t: s.t, kind: 'order', text: test.name, tone: 'info' }] };
      x = stateOption(c, x, test.name);
      x = checkProgress(c, x);
      return advance(c, x, 10);
    }

    case 'give': {
      const act = c.actions.find((x) => x.name === a.name);
      if (!act) return s;
      if (a.failedMinigame) {
        return advance(c, { ...s, stability: clamp(s.stability - 5, 0, 100), events: [...s.events, { t: s.t, kind: 'give', text: `${act.name}: technique inadequate`, tone: 'bad' }] }, act.seconds);
      }
      let x: SimState = { ...s };
      if (/monitor/i.test(act.name)) x.monitorOn = true;
      const verdict = judge(c, x, act, a.dose);
      if (x.firstTreatmentAt === undefined && act.category !== 'Monitoring and access') x.firstTreatmentAt = s.t;
      if (x.firstMedAt === undefined && act.category === 'Medications') x.firstMedAt = s.t;
      x.given = [...x.given, { name: act.name, dose: a.dose, t: s.t, verdict }];
      const label = a.dose ? `${act.name} (${a.dose})` : act.name;
      const tone: Tone = verdict === 'indicated' ? 'good' : verdict === 'neutral' ? 'info' : 'bad';
      x.events = [...x.events, { t: s.t, kind: 'give', text: label, tone, detail: verdict }];
      if (verdict === 'wrong_dose') { x.stability = clamp(x.stability - 10, 0, 100); x.popup = { title: 'Wrong dose', text: `${act.name}: the dose given is not appropriate for this patient.`, tone: 'bad' }; }
      if (verdict === 'contraindicated') { x.stability = clamp(x.stability - 18, 0, 100); x.popup = { title: 'Contraindicated', text: `${act.name} is contraindicated in this presentation.`, tone: 'bad' }; }
      if (verdict === 'not_indicated') x.stability = clamp(x.stability - 4, 0, 100);
      x = stateOption(c, x, act.name, a.dose);
      x = interventionBranch(c, x, act.name, a.dose);
      x = checkProgress(c, x);
      return advance(c, x, act.seconds);
    }

    case 'ethical': {
      const n = c.nodes[a.id];
      if (!n || !s.ethicalAvailable.includes(a.id)) return s;
      const v = n.ethicalValue || 0;
      return advance(c, {
        ...s, ethicalAvailable: s.ethicalAvailable.filter((e) => e !== a.id), ethicalDone: [...s.ethicalDone, a.id],
        events: [...s.events, { t: s.t, kind: 'ethical', text: n.label, tone: v >= 0 ? 'good' : 'bad', detail: n.narrative }],
        popup: n.narrative ? { title: n.label, text: n.narrative, tone: v >= 0 ? 'good' : 'bad' } : s.popup,
      }, 60);
    }

    case 'diagnose': {
      const correct = !!c.diagnoses[0] && matchScore(a.choice, c.diagnoses[0]) >= 0.85;
      return { ...s, diagnosis: { choice: a.choice, correct, t: s.t }, events: [...s.events, { t: s.t, kind: 'diagnosis', text: a.choice, tone: correct ? 'good' : 'bad' }] };
    }

    case 'dispose': {
      const unsafe = /discharge/i.test(a.name) && (s.stability < 70 || c.severity >= 2);
      const x: SimState = { ...s, disposition: a.name, events: [...s.events, { t: s.t, kind: 'disposition', text: a.name, tone: unsafe ? 'bad' : 'info' }] };
      return unsafe ? { ...x, stability: clamp(x.stability - 30, 0, 100) } : x;
    }

    case 'end': return s.status === 'running' ? finish(s, 'ended') : s;
  }
  return s;
}

function judge(c: ClinicalCase, s: SimState, act: CatalogAction, dose?: string): Given['verdict'] {
  const n = ` ${norm(act.name)} ${(act.aliases || []).map(norm).join(' ')} `;
  if (c.negated.some((w) => n.includes(` ${w}`)) && !c.satisfiers[act.name]) return 'contraindicated';
  const sats = Object.values(c.satisfiers).filter((x) => x.actions.includes(act.name));
  if (sats.length) {
    const dosed = sats.filter((x) => x.correctDose);
    if (dose && dosed.length && !dosed.some((x) => doseKey(x.correctDose) === doseKey(dose))) return 'wrong_dose';
    return 'indicated';
  }
  if (NEUTRAL.test(act.name) || act.category === 'Disposition' || act.category === 'Communication and consults') return 'neutral';
  return 'not_indicated';
}

/** Object-style decision states: a matching action moves the case along that branch. */
function stateOption(c: ClinicalCase, s: SimState, name: string, dose?: string): SimState {
  const cur = c.nodes[s.currentId];
  if (!cur || cur.kind !== 'state' || !cur.options?.length) return s;
  const opt = cur.options.find((o) => {
    const sat = c.satisfiers[o.text];
    if (!sat) return false;
    if (!sat.actions.includes(name) && !sat.tests.includes(name)) return false;
    return !(sat.correctDose && dose && doseKey(sat.correctDose) !== doseKey(dose));
  });
  if (!opt) return s;
  const next = c.nodes[opt.target];
  if (!next) return s;
  const bad = /^wrong|fail|death|critical/i.test(next.id) || /critical|fatal|deterior/.test(next.outcomeType || '');
  let x: SimState = {
    ...s, currentId: next.id, completed: bad ? s.completed : [...s.completed, cur.id], completedAt: bad ? s.completedAt : { ...s.completedAt, [cur.id]: s.t },
    target: { ...s.target, ...(next.stateVitals || {}) }, stability: clamp(s.stability + (bad ? -22 : 14), 0, 100), graceUntil: bad ? s.graceUntil : s.t + 120,
    lastOutcome: bad ? 'deteriorated' : 'improved',
    events: [...s.events, { t: s.t, kind: 'outcome', text: next.narrative || next.label, tone: bad ? 'bad' : 'good' }],
    popup: next.narrative ? { title: '', text: next.narrative, tone: bad ? 'bad' : 'good' } : s.popup,
  };
  if (bad) x.given = x.given.map((g, i) => (i === x.given.length - 1 && g.name === name ? { ...g, verdict: 'not_indicated' } : g));
  if (!next.options?.length) x = finish(x, bad ? 'ended' : 'won');
  return x;
}

/** Porames intervention nodes: a matching action (and dose) follows that branch. */
function interventionBranch(c: ClinicalCase, s: SimState, name: string, dose?: string): SimState {
  const outs = [...outgoing(c, s.currentId), ...(s.hubId !== s.currentId ? outgoing(c, s.hubId) : [])].filter((n) => n.kind === 'intervention');
  for (const n of outs) {
    const hit = (n.actions || []).find((a) => c.satisfiers[a]?.actions.includes(name));
    if (!hit) continue;
    const want = c.satisfiers[hit]?.correctDose;
    if (want && dose && doseKey(want) !== doseKey(dose)) continue;
    const x = advanceFrom(c, { ...s, currentId: n.id, hubId: n.id }, n.id);
    if (/critical|fatal|death|deterior/.test(x.lastOutcome || '')) {
      const i = x.given.length - 1;
      return { ...x, given: x.given.map((g, j) => (j === i && g.name === name ? { ...g, verdict: 'not_indicated' } : g)) };
    }
    return x;
  }
  return s;
}

// ─── Debrief helpers ──────────────────────────────────────────────────────
export function requiredChecklist(c: ClinicalCase, s: SimState) {
  const rows: { node: string; action: string; done: boolean; teaching?: string; dose?: string }[] = [];
  for (const n of Object.values(c.nodes)) {
    if (n.kind === 'required') for (const g of n.groups || []) {
      const label = g.join(' / ');
      rows.push({ node: n.label, action: label, done: g.some((a) => doneWith(c, s, a)), teaching: g.map((a) => c.satisfiers[a]?.teaching).find(Boolean), dose: g.map((a) => c.satisfiers[a]?.correctDose).find(Boolean) });
    }
    if (n.kind === 'state' && n.options?.length) {
      const good = n.options.find((o) => /^correct|success|rosc/i.test(o.target));
      if (good) rows.push({ node: n.narrative || n.id, action: good.text, done: s.completed.includes(n.id) });
    }
  }
  return rows;
}
