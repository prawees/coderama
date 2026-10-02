/**
 * CODE RAMA - Clinical case model.
 *
 * Normalizes every case format into one runtime shape:
 *   1. Porames CaseData (Firestore "simulations", designer output)
 *   2. Story cases with a Porames-style graph (required / outcome / ethicalChoice)
 *   3. Early story cases with an object-style decision tree (case_03 to case_06)
 */
import { EXAM_ITEMS, TEST_CATALOG, ACTION_CATALOG } from './catalog';
import type { ExamItem, CatalogTest, CatalogAction, ActionCategory, HistoryCategory, InvKind } from './catalog';

export type Lang = 'en' | 'th';
export interface Vitals { hr: number; sbp: number; dbp: number; rr: number; spo2: number; temp: number; gcs: number; }
export const NORMAL_VITALS: Vitals = { hr: 82, sbp: 124, dbp: 76, rr: 16, spo2: 98, temp: 36.9, gcs: 15 };

export interface HistoryQ { id: string; category: HistoryCategory; q: { en: string; th: string } | string; answer: string; unlocks: string[]; visible: boolean; }
export interface ExamResult { finding: string; abnormal: boolean; mediaUrl?: string; }
export interface CaseInvestigation {
  id: string; name: string; kind: InvKind; category: string;
  value?: string; unit?: string; normalRange?: string; abnormal: boolean; report: string; imageUrl?: string;
}

export type NodeKind = 'start' | 'required' | 'intervention' | 'outcome' | 'timer' | 'ethical' | 'end' | 'state';
export interface RNode {
  id: string; kind: NodeKind; label: string; narrative?: string;
  groups?: string[][];            // required: AND of OR-groups
  actions?: string[];             // intervention: any of
  doseText?: Record<string, string>;
  outcomeType?: string;
  vitalChanges?: Partial<Vitals>;
  ethicalValue?: number;
  minutes?: number;
  endOutcome?: 'win' | 'lose';
  options?: { text: string; target: string }[]; // object-style decision state
  stateVitals?: Partial<Vitals>;
}
export interface REdge { source: string; target: string; }

/** How a case-authored action string is satisfied by player choices. */
export interface Satisfier { tests: string[]; actions: string[]; correctDose?: string; doseOptions?: string[]; teaching?: string; }

export interface ClinicalCase {
  id: string; title: string; age: string; sex: string; weightKg?: number;
  chiefComplaint: string; background: string; diagnoses: string[];
  baseline: Vitals; severity: number;
  history: HistoryQ[];
  exam: Record<string, ExamResult>;
  investigations: CaseInvestigation[];
  nodes: Record<string, RNode>; edges: REdge[]; startId: string;
  satisfiers: Record<string, Satisfier>;
  negated: string[];              // contraindicated tokens ("no aspirin")
  tests: CatalogTest[];
  actions: CatalogAction[];
  appearance?: { skinTone?: string; bmiFactor?: number; ageGroup?: string };
}

// ─── Text matching ────────────────────────────────────────────────────────
const SYNONYMS: [RegExp, string][] = [
  [/\bnss\b|normal saline|0\.9% (sodium chloride|nacl)/g, 'crystalloid'],
  [/ringer'?s? lactate|lactated ringer'?s?|\blrs?\b|\brl\b/g, 'crystalloid'],
  [/albuterol/g, 'salbutamol'], [/epinephrine/g, 'adrenaline'], [/norepinephrine/g, 'noradrenaline'],
  [/acetaminophen/g, 'paracetamol'], [/frusemide/g, 'furosemide'], [/\bekg\b/g, 'ecg'],
  [/haemo|hemo/g, 'hemo'], [/haema|hema/g, 'hema'], [/oedema|edema/g, 'edema'],
  [/intubation|intubate/g, 'intubat'], [/defibrillation|defibrillate/g, 'defib'],
];
const STOP = new Set(['the', 'and', 'or', 'of', 'for', 'to', 'a', 'an', 'in', 'on', 'with', 'via', 'give', 'start', 'begin', 'push', 'immediately', 'urgent', 'if', 'then', 'at', 'as', 'by']);

export function norm(s: string): string {
  let x = s.toLowerCase();
  for (const [re, rep] of SYNONYMS) x = x.replace(re, rep);
  return x.replace(/[^a-z0-9%/.฀-๿ ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
const tokens = (s: string) => norm(s).split(' ').filter((w) => w.length > 1 && !STOP.has(w));

export function matchScore(a: string, b: string): number {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if ((na.length > 4 && nb.includes(na)) || (nb.length > 4 && na.includes(nb))) return 0.85;
  const ta = new Set(tokens(a)), tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return 0;
  let inter = 0; ta.forEach((w) => { if (tb.has(w)) inter++; });
  return inter / Math.min(ta.size, tb.size) * 0.8 + inter / (ta.size + tb.size - inter) * 0.2;
}
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
function aliasHit(text: string, aliases: string[] = []): boolean {
  const n = ` ${norm(text)} `;
  return aliases.some((al) => {
    const a = norm(al);
    if (a.length < 2) return false;
    if (n.includes(` ${a} `)) return true;
    return a.length >= 5 && new RegExp(`(^|\\s)${esc(a)}`).test(n);
  });
}
const NEGATION = /^(no|avoid|stop|discontinue|withhold|hold|do not|don't|never|not)\b/i;

// ─── Dose parsing ─────────────────────────────────────────────────────────
const DOSE_RE = /(\d+(?:\.\d+)?)\s?(mg\/kg\/h|mcg\/kg\/min|mcg\/kg|mg\/kg|ml\/kg\/h|ml\/kg|u\/kg\/h|u\/kg|units?|mmol\/h|meq\/kg|meq|mg|mcg|g|ml|j|l\/min|u)\b/i;
export function parseDose(text?: string): string | undefined {
  const m = text?.match(DOSE_RE);
  return m ? `${m[1]} ${m[2].replace(/^ml/i, 'mL').replace(/^l\/min/i, 'L/min').replace(/^j$/i, 'J').replace(/^u(nits?)?$/i, 'U')}` : undefined;
}
export const doseKey = (d?: string) => (d ? parseDose(d)?.toLowerCase().replace(/\s/g, '') ?? norm(d).replace(/\s/g, '') : '');
function scaledDistractors(correct: string): string[] {
  const m = correct.match(/^(\d+(?:\.\d+)?)\s?(.*)$/);
  if (!m) return [correct];
  const n = parseFloat(m[1]); const u = m[2];
  const f = (x: number) => `${Number.isInteger(x) ? x : +x.toFixed(2)} ${u}`.trim();
  return [f(n / 2), correct, f(n * 2), f(n * 5)];
}

// ─── Vitals parsing ───────────────────────────────────────────────────────
const num = (v: any): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const x = typeof v === 'object' ? v.value : v;
  const n = parseFloat(String(x));
  return Number.isFinite(n) ? n : undefined;
};
export function parseVitals(raw: any, base: Vitals = NORMAL_VITALS): Vitals {
  const v = { ...base };
  if (!raw) return v;
  const set = (k: keyof Vitals, x: any) => { const n = num(x); if (n !== undefined) v[k] = n; };
  set('hr', raw.hr); set('sbp', raw.sbp); set('dbp', raw.dbp); set('rr', raw.rr);
  set('spo2', raw.spo2 ?? raw.o2); set('temp', raw.temp); set('gcs', raw.gcs);
  if (typeof raw.bp === 'string') { const [s, d] = raw.bp.split('/').map((x: string) => parseFloat(x)); if (Number.isFinite(s)) v.sbp = s; if (Number.isFinite(d)) v.dbp = d; }
  return v;
}
function partialVitals(raw: any): Partial<Vitals> {
  if (!raw) return {};
  const full = parseVitals(raw, { hr: NaN, sbp: NaN, dbp: NaN, rr: NaN, spo2: NaN, temp: NaN, gcs: NaN });
  const out: Partial<Vitals> = {};
  (Object.keys(full) as (keyof Vitals)[]).forEach((k) => { if (Number.isFinite(full[k])) out[k] = full[k]; });
  return out;
}
export function severityOf(v: Vitals, ageYears?: number): number {
  if (v.hr === 0) return 7;
  const child = ageYears !== undefined && ageYears < 12;
  const hrHi = child ? 160 : 120;
  let s = 0;
  if (v.hr > hrHi + 20 || v.hr < 40) s += 2; else if (v.hr > hrHi || v.hr < 50) s += 1;
  if (v.sbp < (child ? 70 : 80)) s += 2; else if (v.sbp < (child ? 80 : 90)) s += 1;
  if (v.spo2 <= 88) s += 2; else if (v.spo2 < 92) s += 1;
  if (v.rr > 30 || v.rr < 8) s += 2; else if (v.rr > 24) s += 1;
  if (v.gcs <= 8) s += 2; else if (v.gcs < 13) s += 1;
  if (v.temp > 38.5 || v.temp < 35) s += 1;
  return Math.min(7, s);
}

// ─── Exam routing: sentence level, keyword driven ─────────────────────────
const CLAUSE_ROUTES: [RegExp, string][] = [
  // Most specific first. A clause goes to the first route that matches.
  [/shifting dullness|fluid thrill|ascites|hepatomegal|splenomegal|organomegal|murphy|mcburney|rovsing|guarding|rebound|bowel sound|abdom|epigastr|costal margin|rigid/i, 'e_abdomen'],
  [/\bgums?\b|conjunctiv|icter|sclera|mucous membrane|mucosa|dry tongue|flush|\bears?\b|\bnose\b|\bthroat\b/i, 's_heent'],
  [/stridor|gurgl|snor|airway|speaking in|single words|unable to speak|drool|angio.?oedema|uvula/i, 'a_patency'],
  [/oropharyn|secretion|vomitus in|foreign body|mouth|lip/i, 'a_oral'],
  [/c-?spine|cervical spine|collar/i, 'a_cspine'],
  [/trachea/i, 'b_trachea'],
  [/percuss|dull|resonan|stony/i, 'b_percussion'],
  [/expansion/i, 'b_expansion'],
  [/crackle|crepit|wheez|breath sound|air entry|rhonch|silent chest|bronchial|rales|effusion|consolidat/i, 'b_auscultate'],
  [/accessory|retraction|recession|work of breathing|tachypn|cyanos|respiratory distress|kussmaul|paradox|nasal flar|tripod|apnoe|apnea|agonal/i, 'b_inspect'],
  [/capillary refill|\bcrt\b/i, 'c_crt'],
  [/pulse|thread|bounding|radial|femoral|carotid|irregularly irregular|pulseless|tachycard|bradycard|sinus rhythm/i, 'c_pulse'],
  [/\bjvp\b|jugular|neck vein/i, 'c_jvp'],
  [/murmur|\bs[1-4]\b|gallop|heart sound|muffled|rub|apex/i, 'c_heart'],
  [/cold|clammy|mottl|diaphore|sweat|periph|cool|pale|pallor/i, 'c_perfusion'],
  [/bleed|haemorrh|hemorrh|blood loss|melaena|melena|haematemesis/i, 'c_bleeding'],
  [/\bgcs\b|\be\d\s?v\d|alert|confus|drows|obtund|coma|responsive|orient|agitat|restless|letharg|avpu|stupor/i, 'd_gcs'],
  [/pupil|miosis|mydria|pinpoint|anisocoria|perrl/i, 'd_pupils'],
  [/glucose|\bdtx\b|sugar/i, 'd_glucose'],
  [/neck stiff|kernig|brudzinski|mening/i, 'd_meningism'],
  [/power|weak(ness)? (of|in)|hemipar|reflex|tone|babinski|plantar|focal|lateralis|fascicul|tremor|clonus|seiz|facial droop|sensation/i, 'd_lateral'],
  [/rash|petechi|purpur|bruis|wound|laceration|burn|urticari|eschar|jaundice|skin|tourniquet test|sparing|blanch/i, 'e_skin'],
  [/oedema|edema|calf|deform|fracture|swelling|limb|leg|arm|extremit/i, 'e_limbs'],
  [/spine|back|log.?roll|step.?off/i, 'e_logroll'],
  [/pelvi|genital|vagin|uter|cervical os|adnex|perine|scrot/i, 's_pelvis'],
];
const SYSTEM_DEFAULT: [RegExp, string][] = [
  [/respir|chest|lung/i, 'b_auscultate'], [/cardio|heart|circul/i, 'c_heart'], [/neuro/i, 'd_gcs'],
  [/abdom|gi/i, 'e_abdomen'], [/skin/i, 'e_skin'], [/hent|heent|eye/i, 's_heent'], [/pelvi|genit/i, 's_pelvis'],
  [/extrem|limb|musc/i, 'e_limbs'], [/general/i, 's_general'],
];
const NORMAL_CLAUSE = /^(no |normal|equal|non-?tender|clear|intact|soft|within normal)|\bnormal\b|equal and reactive|no focal|no mening|not raised/i;
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const splitClauses = (t: string) => t.split(/(?<=[.;])\s+|,\s+|\s+with\s+(?=[a-z]+ (?:dull|percussion|crackles|wheeze|guarding|rebound))/i).map((s) => s.trim()).filter(Boolean);

function buildExam(raw: any[]): Record<string, ExamResult> {
  const out: Record<string, { parts: string[]; abnormal: boolean; mediaUrl?: string }> = {};
  const push = (id: string, text: string, abnormal: boolean, mediaUrl?: string) => {
    const r = (out[id] ||= { parts: [], abnormal: false });
    if (!r.parts.includes(text)) r.parts.push(text);
    r.abnormal ||= abnormal; if (mediaUrl) r.mediaUrl = mediaUrl;
  };
  for (const e of raw || []) {
    const sys = String(e.system || '');
    // Designer v2: system is an exam item id or its English label
    const direct = EXAM_ITEMS.find((i) => i.id === sys || i.en.toLowerCase() === sys.toLowerCase());
    if (direct) {
      push(direct.id, e.finding, !!e.abnormal, e.mediaUrl);
      // Authored per-item findings stay put. Broad legacy headings also feed the specific items.
      if (!['s_general', 's_heent'].includes(direct.id)) continue;
    }
    for (const clause of splitClauses(String(e.finding || ''))) {
      const hit = CLAUSE_ROUTES.find(([re]) => re.test(clause));
      const target = hit?.[1] ?? SYSTEM_DEFAULT.find(([re]) => re.test(sys))?.[1] ?? 's_general';
      if (direct && target === direct.id) continue;
      push(target, clause, !!e.abnormal && !NORMAL_CLAUSE.test(clause));
    }
  }
  const res: Record<string, ExamResult> = {};
  for (const [k, v] of Object.entries(out)) res[k] = { finding: v.parts.map((p) => cap(p.replace(/[.;,\s]+$/, ''))).join('. ') + '.', abnormal: v.abnormal, mediaUrl: v.mediaUrl };
  return res;
}

/** Findings that follow live vitals when the case has nothing specific for an item. */
export function derivedFinding(item: ExamItem, v: Vitals, lang: Lang): ExamResult | null {
  const T = (en: string, th: string, abnormal = true): ExamResult => ({ finding: lang === 'th' ? th : en, abnormal });
  const shocked = v.sbp < 90 || v.hr > 125 || v.hr === 0;
  switch (item.id) {
    case 'a_patency': if (v.gcs <= 8) return T(`GCS ${Math.round(v.gcs)}. Snoring respirations. Airway at risk, not self-maintained.`, `GCS ${Math.round(v.gcs)} มีเสียง snoring airway at risk ไม่สามารถ maintain airway เองได้`); break;
    case 'b_inspect': if (v.rr > 24 || v.spo2 < 92) return T(`Tachypnoeic, RR ${Math.round(v.rr)}/min, increased work of breathing.`, `หายใจเร็ว RR ${Math.round(v.rr)}/min work of breathing เพิ่มขึ้น`); if (v.rr === 0) return T('Apnoeic. No respiratory effort.', 'ไม่หายใจ ไม่มี respiratory effort'); break;
    case 'c_crt': if (shocked) return T('Capillary refill time 4 seconds.', 'Capillary refill time 4 วินาที'); break;
    case 'c_perfusion': if (shocked) return T('Cool, clammy, mottled peripheries.', 'ปลายมือปลายเท้าเย็น ชื้น มี mottling'); break;
    case 'c_pulse': if (v.hr === 0) return T('No palpable central pulse.', 'คลำ central pulse ไม่ได้'); if (v.hr > 100 || v.hr < 60) return T(`Pulse ${Math.round(v.hr)}/min${v.sbp < 90 ? ', thready' : ''}.`, `ชีพจร ${Math.round(v.hr)}/min${v.sbp < 90 ? ' เบา' : ''}`); break;
    case 'd_gcs': if (v.gcs < 15) return T(`GCS ${Math.round(v.gcs)}.`, `GCS ${Math.round(v.gcs)}`); break;
  }
  return null;
}

// ─── History generation ───────────────────────────────────────────────────
const HQ: Record<HistoryCategory, { en: string; th: string }> = {
  signs_symptoms: { en: 'Onset, duration and progression of symptoms (OPQRST)', th: 'อาการเริ่มเมื่อไร เป็นมานานเท่าไร เป็นอย่างไร (OPQRST)' },
  past_history: { en: 'Any underlying disease or previous admission?', th: 'มีโรคประจำตัว หรือเคยนอนโรงพยาบาลไหม' },
  medication: { en: 'What medications do you take regularly?', th: 'ใช้ยาอะไรเป็นประจำ' },
  allergy: { en: 'Any drug or food allergy?', th: 'มีประวัติแพ้ยาหรือแพ้อาหารไหม' },
  family_history: { en: 'Any illness that runs in the family?', th: 'มีคนในครอบครัวเป็นโรคอะไรไหม' },
  socioeconomics: { en: 'Smoking, alcohol, occupation and living situation', th: 'สูบบุหรี่ ดื่มสุรา อาชีพ และที่อยู่อาศัย' },
};
const HX_ROUTES: [HistoryCategory, RegExp][] = [
  ['allergy', /allerg|แพ้ยา|แพ้อาหาร/i],
  ['medication', /taking|medication|tablet|prescri|\bmg\b|\bdose|\btook\b|nsaid|ibuprofen|paracetamol|antibiotic|herbal|traditional medicine|over.the.counter|on (warfarin|insulin|metformin|aspirin)|กินยา|ใช้ยา|ยาชุด|ยาสมุนไพร/i],
  ['past_history', /history of|\bknown\b|diagnosed|underlying|previous|prior admission|diabet|hypertens|asthma|copd|\bckd\b|cirrho|\bhiv\b|surgery|operation|โรคประจำตัว|เคยเป็น|เบาหวาน|ความดันโลหิตสูง/i],
  ['family_history', /family history|runs in the family|(mother|father|brother|sister|sibling)s? (has|had|with|died|also)|ประวัติครอบครัว|ในครอบครัว/i],
  ['socioeconomics', /smok|alcohol|drinks|occupation|works? as|farmer|labourer|student|lives|living|ดื่มสุรา|สูบบุหรี่|อาชีพ|รับจ้าง|เกษตรกร/i],
];
function buildHistory(raw: any): HistoryQ[] {
  if (raw.historyGraph?.nodes?.length) {
    const g = raw.historyGraph;
    const incoming = new Set((g.edges || []).map((e: any) => e.target));
    return g.nodes.map((n: any) => ({
      id: n.id, category: n.data?.category || 'signs_symptoms', q: n.data?.question || '', answer: n.data?.answer || '',
      unlocks: (g.edges || []).filter((e: any) => e.source === n.id).map((e: any) => e.target),
      visible: !incoming.has(n.id),
    }));
  }
  const buckets: Record<HistoryCategory, string[]> = { signs_symptoms: [], past_history: [], medication: [], allergy: [], family_history: [], socioeconomics: [] };
  for (const s of String(raw.background || '').split(/(?<=[.!?])\s+/).filter(Boolean)) {
    const hits = HX_ROUTES.filter(([, re]) => re.test(s)).map(([c]) => c);
    if (hits.length === 0) buckets.signs_symptoms.push(s); else hits.forEach((c) => buckets[c].push(s));
  }
  const fallback: Partial<Record<HistoryCategory, string>> = {
    allergy: 'No known drug allergy (NKDA).',
    family_history: 'Non-contributory.',
    medication: 'No regular medication reported.',
    past_history: 'No known underlying disease reported.',
    socioeconomics: 'Not contributory to this presentation.',
  };
  const qs: HistoryQ[] = [
    { id: 'hx_cc', category: 'signs_symptoms', q: { en: 'What brought you to the hospital today?', th: 'วันนี้มาโรงพยาบาลด้วยเรื่องอะไร' }, answer: raw.chiefComplaint || '', unlocks: [], visible: true },
  ];
  (Object.keys(HQ) as HistoryCategory[]).forEach((c) => {
    const ans = buckets[c].join(' ') || fallback[c] || '';
    if (ans) qs.push({ id: `hx_${c}`, category: c, q: HQ[c], answer: ans, unlocks: [], visible: true });
  });
  return qs;
}

// ─── Investigations ───────────────────────────────────────────────────────
function buildInvestigations(raw: any[]): CaseInvestigation[] {
  return (raw || []).map((i: any, idx: number) => {
    const n = String(i.name || '');
    const kind: InvKind = /ecg|ekg|electrocardio/i.test(n) ? 'ecg' : i.kind === 'imaging' ? 'imaging' : 'lab';
    return {
      id: i.id || `inv_${idx}`, name: n, kind, category: i.category || (kind === 'lab' ? 'Laboratory' : 'Imaging'),
      value: i.value !== undefined && i.value !== '' ? String(i.value) : undefined,
      unit: i.unit && i.unit !== '-' ? i.unit : undefined, normalRange: i.normalRange,
      abnormal: !!i.abnormal, report: i.report || '', imageUrl: i.imageUrl || undefined,
    };
  });
}

export function testMatchesInvestigation(t: CatalogTest, inv: CaseInvestigation): boolean {
  if (t.name === inv.name) return true;
  if (matchScore(t.name, inv.name) >= 0.75) return true;
  return aliasHit(inv.name, t.aliases);
}

// ─── Graph normalization ──────────────────────────────────────────────────
function buildGraph(raw: any): { nodes: Record<string, RNode>; edges: REdge[]; startId: string } {
  const g = raw.managementGraph || {};
  const nodes: Record<string, RNode> = {};
  const edges: REdge[] = [];
  if (Array.isArray(g.nodes)) {
    for (const n of g.nodes) {
      const d = n.data || {};
      const kind: NodeKind = n.type === 'ethicalChoice' ? 'ethical' : (['start', 'required', 'intervention', 'outcome', 'timer', 'end'].includes(n.type) ? n.type : 'outcome');
      const groups = n.type === 'required'
        ? (d.actions || []).map((a: any) => (typeof a === 'string' ? [a] : Array.isArray(a) ? a : a?.or || [])).filter((x: string[]) => x.length)
        : undefined;
      nodes[n.id] = {
        id: n.id, kind, label: d.label || d.narrative || n.type, narrative: d.narrative,
        groups, actions: n.type === 'intervention' ? d.actions || [] : undefined, doseText: d.doseMap,
        outcomeType: d.outcomeType ?? (n.type === 'end' ? (d.outcome === 'win' ? 'resolved' : 'fatal') : undefined),
        vitalChanges: partialVitals(d.vitalChanges), ethicalValue: d.ethicalValue,
        minutes: d.minutes, endOutcome: d.outcome,
      };
    }
    for (const e of g.edges || []) edges.push({ source: e.source, target: e.target });
    const start = Object.values(nodes).find((n) => n.kind === 'start')?.id || Object.keys(nodes)[0];
    return { nodes, edges, startId: start };
  }
  // Object-style decision tree
  for (const [id, d] of Object.entries<any>(g.nodes || {})) {
    const options = (d.options || []).map((o: any) => ({ text: o.text, target: o.targetNode }));
    nodes[id] = {
      id, kind: 'state', label: d.narrative || id, narrative: d.narrative, options,
      stateVitals: partialVitals(d.vitals), outcomeType: d.outcomeType,
    };
    options.forEach((o: any) => edges.push({ source: id, target: o.target }));
  }
  return { nodes, edges, startId: nodes.start ? 'start' : Object.keys(nodes)[0] };
}

// ─── Action and test catalogs per case ────────────────────────────────────
function guessCategory(s: string): ActionCategory {
  const t = s.toLowerCase();
  if (/cpr|defib|cardiover|shock|compression|rosc|pacing/.test(t)) return 'Resuscitation (ACLS)';
  if (/oxygen|\bo2\b|intubat|airway|bvm|bag|ventilat|nebul|cpap|bipap|decompress|chest drain|suction/.test(t)) return 'Airway and breathing';
  if (/fluid|saline|ringer|bolus|transfus|blood|prbc|ffp|platelet|crystalloid|colloid|vasopress|noradrenaline|dopamine|tourniquet|binder/.test(t)) return 'Circulation and fluids';
  if (/monitor|hourly|chart|urine output|observation|catheter|access|cannul|balance/.test(t)) return 'Monitoring and access';
  if (/consult|call|refer|notify|explain|counsel|family|consent|team|report to|poison/.test(t)) return 'Communication and consults';
  if (/admit|discharge|transfer|theatre|operating|\bicu\b|\bward\b/.test(t)) return 'Disposition';
  if (/puncture|line|tube|splint|suture|reduction|drain|lavage|pericardio|escharotomy/.test(t)) return 'Procedures';
  return 'Medications';
}
const looksLikeTest = (s: string) => /\b(count|level|levels|test|serology|x-?ray|ultrasound|ct\b|mri|ecg|ekg|culture|cultures|gas|panel|assay|antigen|igm|igg|pcr|smear|swab|stain|biopsy|titre|screen|haematocrit|hematocrit|troponin|lactate|glucose|dtx|creatinine|electrolytes?|lft|cbc|inr|urinalysis|scan|echo|fast|film)\b/i.test(s);

function buildSatisfiers(c: { nodes: Record<string, RNode>; investigations: CaseInvestigation[] }, tests: CatalogTest[], actions: CatalogAction[], negated: string[]): Record<string, Satisfier> {
  const out: Record<string, Satisfier> = {};
  const want: { s: string; dose?: string }[] = [];
  for (const n of Object.values(c.nodes)) {
    (n.groups || []).flat().forEach((s) => want.push({ s, dose: n.doseText?.[s] }));
    (n.actions || []).forEach((s) => want.push({ s, dose: n.doseText?.[s] }));
    (n.options || []).forEach((o) => want.push({ s: o.text, dose: o.text }));
  }
  for (const { s, dose } of want) {
    if (out[s]) continue;
    const sat: Satisfier = { tests: [], actions: [], teaching: dose && dose !== s ? dose : undefined };
    if (NEGATION.test(s)) {
      tokens(s).filter((w) => w.length >= 4 && !/^(no|avoid|stop|discontinue|withhold|injections?)$/.test(w)).forEach((w) => negated.push(w));
      let a = actions.find((x) => x.name === s);
      if (!a) { a = { name: s, category: 'Medications', seconds: 10 }; actions.push(a); }
      sat.actions.push(a.name);
      out[s] = sat; continue;
    }
    if (looksLikeTest(s)) {
      const byInv = c.investigations.find((inv) => matchScore(inv.name, s) >= 0.6);
      const t = tests.find((x) => (byInv && testMatchesInvestigation(x, byInv)) || matchScore(x.name, s) >= 0.7 || aliasHit(s, x.aliases));
      if (t) { sat.tests.push(t.name); out[s] = sat; continue; }
    }
    const scored = actions.map((a) => ({ a, sc: Math.max(matchScore(a.name, s), aliasHit(s, a.aliases) ? 0.7 : 0) })).sort((x, y) => y.sc - x.sc);
    const hits = scored.filter((x) => x.sc >= 0.6).map((x) => x.a);
    if (!hits.length && scored[0]?.sc >= 0.45) hits.push(scored[0].a);
    if (!hits.length) { const a: CatalogAction = { name: s, category: guessCategory(s), seconds: 30 }; actions.push(a); hits.push(a); }
    sat.actions = hits.map((a) => a.name);
    const correct = parseDose(dose);
    if (correct) {
      sat.correctDose = correct;
      const lib = hits.find((a) => a.doses?.length)?.doses || [];
      const has = lib.some((d) => doseKey(d) === doseKey(correct));
      sat.doseOptions = has ? lib : Array.from(new Set([...lib.slice(0, 2), ...scaledDistractors(correct)]));
    }
    out[s] = sat;
  }
  return out;
}

// ─── Entry point ──────────────────────────────────────────────────────────
export function buildClinicalCase(id: string, raw: any): ClinicalCase {
  const graph = buildGraph(raw);
  const startState = graph.nodes[graph.startId];
  const baseline = parseVitals(raw.vitals, { ...NORMAL_VITALS, ...(startState?.stateVitals || {}) });
  if (startState?.stateVitals) Object.assign(baseline, startState.stateVitals);
  const investigations = buildInvestigations(raw.investigations);

  const tests: CatalogTest[] = TEST_CATALOG.map((t) => ({ ...t }));
  for (const inv of investigations) {
    if (!tests.some((t) => testMatchesInvestigation(t, inv))) {
      tests.push({ name: inv.name, kind: inv.kind, category: inv.kind === 'lab' ? (inv.category || 'Other') : inv.kind === 'ecg' ? 'ECG' : 'Imaging', unit: inv.unit, normalRange: inv.normalRange, turnaround: inv.kind === 'lab' ? 420 : 300 });
    }
  }
  const actions: CatalogAction[] = ACTION_CATALOG.map((a) => ({ ...a }));
  const negated: string[] = [];
  const satisfiers = buildSatisfiers({ nodes: graph.nodes, investigations }, tests, actions, negated);

  const diagnoses: string[] = Array.isArray(raw.diagnoses) ? raw.diagnoses : raw.diagnosis ? [raw.diagnosis] : [];
  return {
    id, title: raw.title || id, age: String(raw.age ?? ''), sex: String(raw.sex ?? ''), weightKg: num(raw.weightKg),
    chiefComplaint: raw.chiefComplaint || '', background: raw.background || '', diagnoses,
    baseline, severity: severityOf(baseline, parseFloat(String(raw.age ?? '')) || undefined),
    history: buildHistory(raw), exam: buildExam(raw.exam), investigations,
    ...graph, satisfiers, negated: Array.from(new Set(negated)), tests, actions,
    appearance: raw.patientAppearance,
  };
}
