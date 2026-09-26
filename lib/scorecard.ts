/**
 * CODE RAMA - OSCE / NL blueprint scorecard.
 *
 * Five axes, mirroring how the Faculty marks an acute-care OSCE station:
 *   1. Systematic assessment (ABCDE primary survey, monitoring)
 *   2. Triage efficiency (time to the critical steps, completion)
 *   3. Diagnostic stewardship (investigations that did not change management)
 *   4. Pharmacological precision (wrong drug, wrong dose, contraindicated)
 *   5. Communication and ethics (history, allergy check before drugs, ethical choices)
 */
import type { ClinicalCase } from './clinical/model';
import type { SimState } from './clinical/engine';
import { EXAM_ITEMS } from './clinical/catalog';

export type Grade = 'A' | 'B' | 'C' | 'D';
export type AxisKey = 'assessment' | 'triage' | 'stewardship' | 'pharm' | 'ethics';

export interface AxisScore { key: AxisKey; score: number; grade: Grade; detailKey: string; detailVars: Record<string, string | number>; }
export interface CaseReport {
  caseId: string;
  axes: AxisScore[];
  overall: number;
  overallGrade: Grade;
  outcomeGood: boolean;
  diagnosisCorrect: boolean | null;
  xpAwarded: number;
  cashAwarded: number;
  simSeconds: number;
  timestamp: number;
}

export const gradeFor = (score: number): Grade => (score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D');
const clamp = (x: number) => Math.round(Math.max(0, Math.min(100, x)));

export function computeReport(c: ClinicalCase, s: SimState): CaseReport {
  // 1. Systematic assessment
  const groups = new Set(s.examined.map((id) => EXAM_ITEMS.find((i) => i.id === id)?.group).filter(Boolean));
  const covered = (['A', 'B', 'C', 'D', 'E'] as const).filter((g) => groups.has(g)).length;
  const assessment = clamp(covered * 18 + (s.monitorOn ? 10 : 0));

  // 2. Triage efficiency
  const reqNodes = Object.values(c.nodes).filter((n) => n.kind === 'required' || (n.kind === 'state' && n.options?.length));
  const completion = reqNodes.length ? s.completed.filter((id) => reqNodes.some((n) => n.id === id)).length / reqNodes.length : (s.status === 'won' ? 1 : 0);
  const firstDone = Math.min(...Object.values(s.completedAt), Infinity);
  const timeScore = firstDone === Infinity ? 0 : firstDone <= 180 ? 100 : firstDone >= 900 ? 20 : 100 - ((firstDone - 180) / 720) * 80;
  const triage = clamp(completion * 60 + timeScore * 0.4);

  // 3. Diagnostic stewardship
  const useful = new Set(Object.values(c.satisfiers).flatMap((x) => x.tests));
  const wasted = s.orders.filter((o) => !useful.has(o.name) && !o.results.some((r) => r.abnormal)).length;
  const missedEssential = Array.from(useful).filter((t) => !s.orders.some((o) => o.name === t)).length;
  const stewardship = clamp(100 - wasted * 12 - missedEssential * 15);

  // 4. Pharmacological precision
  const wrongDose = s.given.filter((g) => g.verdict === 'wrong_dose').length;
  const contra = s.given.filter((g) => g.verdict === 'contraindicated').length;
  const notInd = s.given.filter((g) => g.verdict === 'not_indicated').length;
  const pharm = clamp(100 - wrongDose * 20 - contra * 35 - notInd * 12);

  // 5. Communication and ethics
  const ethicalSum = s.ethicalDone.reduce((a, id) => a + (c.nodes[id]?.ethicalValue || 0), 0);
  const allergyFirst = s.firstMedAt === undefined || (s.allergyAskedAt !== undefined && s.allergyAskedAt <= s.firstMedAt);
  const ethics = clamp(50 + Math.min(20, s.asked.length * 4) + (allergyFirst ? 15 : -15) + ethicalSum * 1.5 + (s.given.some((g) => /consent|explain/i.test(g.name)) ? 10 : 0));

  const axes: AxisScore[] = [
    { key: 'assessment', score: assessment, grade: gradeFor(assessment), detailKey: 'report.abcde_detail', detailVars: { n: covered } },
    { key: 'triage', score: triage, grade: gradeFor(triage), detailKey: 'report.triage_detail', detailVars: { p: Math.round(completion * 100) } },
    { key: 'stewardship', score: stewardship, grade: gradeFor(stewardship), detailKey: 'report.stewardship_detail', detailVars: { n: wasted, m: missedEssential } },
    { key: 'pharm', score: pharm, grade: gradeFor(pharm), detailKey: 'report.pharm_detail', detailVars: { d: wrongDose, c: contra, n: notInd } },
    { key: 'ethics', score: ethics, grade: gradeFor(ethics), detailKey: allergyFirst ? 'report.ethics_ok' : 'report.ethics_allergy', detailVars: {} },
  ];
  const dxBonus = s.diagnosis ? (s.diagnosis.correct ? 5 : -5) : -5;
  const overall = clamp(axes.reduce((a, x) => a + x.score, 0) / axes.length + dxBonus);
  const overallGrade = gradeFor(overall);
  const outcomeGood = s.status === 'won';
  const mult = { A: 1.5, B: 1.2, C: 1, D: 0.6 }[overallGrade];
  return {
    caseId: c.id, axes, overall, overallGrade, outcomeGood,
    diagnosisCorrect: s.diagnosis ? s.diagnosis.correct : null,
    xpAwarded: Math.round((outcomeGood ? 100 : 25) * mult),
    cashAwarded: Math.round((outcomeGood ? 50 : 10) * mult),
    simSeconds: Math.round(s.t), timestamp: Date.now(),
  };
}
