/**
 * Custom cases: bridges Porames' case designer and the game's case screen.
 *
 * The designer edits `CaseData` (nodes with x/y, required actions as OR groups, string vitals).
 * The case screen reads the shipped case format (nodes with position, flat action strings, a
 * `choice` for the button and `distractors` for the wrong options).
 *
 *   normalizeForDesigner(raw)  any case JSON -> what the designer can open
 *   toGameCase(raw)            designer data  -> what the case screen can play
 *   checkCase(game)            problems an author should fix before playing
 *
 * Pure functions, no React or browser APIs, so scripts/check-custom.ts can test all 51 story cases.
 */

const BAD_OUTCOME = /critical|deterior|fatal|worsen/i;

/** Accepts shipped story JSON (position:{x,y}, string actions, object-style graphs) as well as designer JSON. */
export function normalizeForDesigner(input: any): any {
  let raw = { ...input };
  const g = raw.managementGraph;
  if (g && !Array.isArray(g.nodes) && g.nodes && typeof g.nodes === "object") {
    // The older branching cases (03 to 06): each option becomes an intervention leading to that state.
    const nodes: any[] = [{ id: "start", type: "start", x: 40, y: 260, data: {} }];
    const edges: any[] = [];
    const ids = Object.keys(g.nodes);
    const col = new Map<string, number>([["start", 0]]);
    const bfs = ["start"];
    while (bfs.length) {
      const id = bfs.shift()!;
      for (const o of g.nodes[id]?.options || []) {
        if (!col.has(o.targetNode)) { col.set(o.targetNode, col.get(id)! + 1); bfs.push(o.targetNode); }
      }
    }
    let row = 0;
    for (const id of ids) {
      const d = g.nodes[id];
      if (id !== "start") {
        const ends = !(d.options || []).length;
        const good = !d.slip && !/^wrong/i.test(id) && !BAD_OUTCOME.test(d.outcomeType || "");
        nodes.push({
          id: `out_${id}`, type: "outcome", x: 620 + (col.get(id) ?? 1) * 560, y: 60 + row * 120,
          data: {
            outcomeType: d.outcomeType || (good ? (ends ? "resolved" : "improved") : "worsened"),
            narrative: d.narrative || "", newSymptoms: "", vitalChanges: stringVitals(vitalsFromState(d.vitals)),
          },
        });
      }
      for (const o of d.options || []) {
        const iv = `iv_${id}_${o.id}`;
        nodes.push({ id: iv, type: "intervention", x: 320 + (col.get(id) ?? 0) * 560, y: 60 + row * 120, data: { actions: [o.text], requiredRank: o.requiredRank } });
        edges.push({ id: `e_${iv}_in`, source: id === "start" ? "start" : `out_${id}`, target: iv, label: "" });
        edges.push({ id: `e_${iv}_out`, source: iv, target: `out_${o.targetNode}`, label: "" });
        row++;
      }
    }
    raw = { ...raw, managementGraph: { nodes, edges } };
  } else if (g && Array.isArray(g.nodes)) {
    raw = {
      ...raw,
      managementGraph: {
        edges: (g.edges || []).map((e: any) => ({ label: "", ...e })),
        nodes: g.nodes.map((n: any) => {
          const data = { ...(n.data || {}) };
          if (n.type === "required" && Array.isArray(data.actions)) {
            data.actions = data.actions.map((a: any) => (typeof a === "string" ? { or: [a] } : Array.isArray(a) ? { or: a } : a));
          }
          if (n.type === "outcome") data.vitalChanges = stringVitals(data.vitalChanges);
          return { id: n.id, type: n.type, x: n.x ?? n.position?.x ?? 0, y: n.y ?? n.position?.y ?? 0, data };
        }),
      },
    };
  }
  if (/^m(ale)?$/i.test(raw.sex || "")) raw.sex = "Male";
  else if (/^f(emale)?$/i.test(raw.sex || "")) raw.sex = "Female";
  raw.age = String(raw.age ?? "");
  raw.historyGraph ??= { nodes: [], edges: [] };
  raw.exam ??= [];
  raw.investigations ??= [];
  raw.diagnoses ??= raw.diagnosis ? [raw.diagnosis] : [];
  raw.vitals = Object.fromEntries(Object.entries(raw.vitals || {}).map(([k, v]: [string, any]) => [k, { value: String(v?.value ?? v ?? ""), abnormal: !!v?.abnormal }]));
  return raw;
}

function vitalsFromState(v: any): Record<string, unknown> {
  if (!v) return {};
  const out: Record<string, unknown> = {};
  if (typeof v.bp === "string") { const [s, d] = v.bp.split("/"); out.sbp = s; out.dbp = d; }
  if (v.hr !== undefined) out.hr = v.hr;
  if (v.o2 !== undefined) out.spo2 = String(v.o2).replace("%", "");
  return out;
}
function stringVitals(v: any): Record<string, string> {
  return Object.fromEntries(Object.entries(v || {}).map(([k, x]) => [k, String(x ?? "")]));
}
function numericVitals(v: any): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, x] of Object.entries(v || {})) {
    const n = parseFloat(String(x));
    if (x !== "" && Number.isFinite(n)) out[k] = n;
  }
  return out;
}

/** Designer data to the format the case screen plays. Timer nodes have no effect at the bedside, so they are dropped. */
export function toGameCase(input: any): any {
  const raw = input ?? {};
  const g = raw.managementGraph || { nodes: [], edges: [] };
  const srcNodes: any[] = Array.isArray(g.nodes) ? g.nodes : [];
  const byId = new Map(srcNodes.map((n) => [n.id, n]));
  const edges0: any[] = g.edges || [];
  const kept = (id: string) => byId.has(id) && byId.get(id).type !== "timer";
  const edges = edges0.filter((e) => kept(e.source) && kept(e.target)).map((e, i) => ({ id: e.id ?? `e${i}`, source: e.source, target: e.target }));
  const childrenOf = (id: string) => edges.filter((e) => e.source === id).map((e) => byId.get(e.target));

  const flatten = (actions: any[]) => (actions || []).map((a) => (typeof a === "string" ? a : Array.isArray(a) ? a.join(" หรือ ") : (a?.or || []).join(" หรือ "))).filter(Boolean);
  const doseFor = (d: any, actions: any[]) => {
    const map: Record<string, string> = {};
    (actions || []).forEach((a) => {
      const members: string[] = typeof a === "string" ? [a] : Array.isArray(a) ? a : a?.or || [];
      const dose = members.map((m) => d.doseMap?.[m]).find(Boolean);
      if (dose) map[members.join(" หรือ ")] = dose;
    });
    return map;
  };

  const nodes = srcNodes.filter((n) => n.type !== "timer").map((n) => {
    const d = n.data || {};
    const base = { id: n.id, type: n.type, position: { x: n.x ?? n.position?.x ?? 0, y: n.y ?? n.position?.y ?? 0 } };
    switch (n.type) {
      case "start":
        return { ...base, data: { label: "Start" } };
      case "required":
      case "intervention": {
        const actions = flatten(d.actions);
        const data: any = {
          label: d.label || actions.join(", ") || "ขั้นตอนนี้", choice: d.choice, actions,
          doseMap: doseFor(d, d.actions), distractors: Array.isArray(d.distractors) ? d.distractors.filter((x: any) => x?.label) : [],
        };
        if (d.requiredRank) data.requiredRank = d.requiredRank;
        // An intervention that leads straight to a worse outcome is a wrong turn, explained in the debrief
        if (n.type === "intervention" && childrenOf(n.id).some((c) => c?.type === "outcome" && BAD_OUTCOME.test(c.data?.outcomeType || ""))) data.slip = true;
        return { ...base, data };
      }
      case "outcome": {
        const unlock = d.outcomeType === "unlockEvent";
        return { ...base, data: { label: d.label || d.narrative || "", narrative: d.narrative || "", outcomeType: unlock ? "unchanged" : d.outcomeType, vitalChanges: numericVitals(d.vitalChanges) } };
      }
      case "end":
        return { ...base, type: "outcome", data: { label: d.narrative || "", narrative: d.narrative || "", outcomeType: d.outcome === "lose" ? "fatal" : "resolved", vitalChanges: {} } };
      default:
        return { ...base, data: { ...d } };
    }
  });

  // An intervention with one outcome plays that outcome directly. Otherwise the player would have to
  // press a button carrying the outcome's own text to find out what their choice did.
  const gameById = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    if (n.type !== "intervention") continue;
    const kids = edges.filter((e) => e.source === n.id);
    const only = kids.length === 1 ? gameById.get(kids[0].target) : undefined;
    if (!only || only.type !== "outcome") continue;
    const od: any = only.data;
    n.data = { ...n.data, narrative: od.narrative, outcomeType: od.outcomeType, vitalChanges: od.vitalChanges };
    const rest = edges.filter((e) => e.source === only.id);
    edges.splice(edges.indexOf(kids[0]), 1);
    rest.forEach((e, i) => edges.push({ id: `${n.id}_${i}_${e.id}`, source: n.id, target: e.target }));
  }
  // Outcomes nothing leads to any more were absorbed above
  const reached = new Set(edges.map((e) => e.target));
  const absorbed = new Set(nodes.filter((n) => n.type === "outcome" && !reached.has(n.id)).map((n) => n.id));
  const finalNodes = nodes.filter((n) => !absorbed.has(n.id));
  const finalEdges = edges.filter((e) => !absorbed.has(e.source));

  const vitals: Record<string, { value: number; abnormal: boolean }> = {};
  for (const [k, v] of Object.entries<any>(raw.vitals || {})) {
    const n = parseFloat(String(v?.value ?? v));
    if (Number.isFinite(n)) vitals[k] = { value: n, abnormal: !!v?.abnormal };
  }

  return {
    title: raw.title || "เคสใหม่", age: String(raw.age ?? ""), sex: /^f/i.test(raw.sex || "") ? "F" : "M",
    chiefComplaint: raw.chiefComplaint || "", background: raw.background || "",
    diagnoses: Array.isArray(raw.diagnoses) ? raw.diagnoses : [],
    patientAppearance: raw.patientAppearance, vitals,
    exam: raw.exam || [], investigations: raw.investigations || [],
    historyGraph: raw.historyGraph, managementGraph: { nodes: finalNodes, edges: finalEdges },
    droppedTimers: srcNodes.filter((n) => n.type === "timer").length,
  };
}

export interface CaseProblems { errors: string[]; warnings: string[]; }

/** What would stop a case playing properly, in the words the author will see. */
export function checkCase(game: any): CaseProblems {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodes: any[] = game?.managementGraph?.nodes || [];
  const edges: any[] = game?.managementGraph?.edges || [];
  const out = (id: string) => edges.filter((e) => e.source === id).map((e) => e.target);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  if (!game?.title?.trim?.()) errors.push("ยังไม่ได้ตั้งชื่อเคส");
  if (game?.droppedTimers) warnings.push(`Timer ${game.droppedTimers} อันไม่มีผลตอนเล่น เพราะข้างเตียงไม่มีนาฬิกาเดิน`);
  if (!game?.chiefComplaint?.trim?.()) warnings.push("ยังไม่มี chief complaint");
  if (!game?.diagnoses?.length) warnings.push("ยังไม่ได้ใส่ diagnosis ตอนจบเคสจะไม่มีเฉลย");

  const start = nodes.find((n) => n.type === "start");
  if (!start) { errors.push("ไม่มีจุดเริ่มเคส (Start)"); return { errors, warnings }; }
  if (!out(start.id).length) errors.push("Start ยังไม่ได้ต่อกับขั้นตอนไหนเลย");

  const seen = new Set<string>([start.id]);
  const queue = [start.id];
  let goodEnding = false;
  let anyEnding = false;
  while (queue.length) {
    const id = queue.shift()!;
    const next = out(id);
    if (!next.length && id !== start.id) {
      anyEnding = true;
      const n = byId.get(id);
      const hasOutcome = n?.data?.outcomeType !== undefined;
      if (hasOutcome && !BAD_OUTCOME.test(n.data.outcomeType || "")) goodEnding = true;
      if (!hasOutcome) warnings.push(`ขั้นตอน "${n?.data?.label || id}" จบเคสโดยไม่มี outcome`);
    }
    for (const t of next) if (!seen.has(t)) { seen.add(t); queue.push(t); }
  }
  if (out(start.id).length && !anyEnding) errors.push("กราฟวนไม่มีทางจบเคส");
  if (anyEnding && !goodEnding) warnings.push("ไม่มีทางจบเคสแบบคนไข้ดีขึ้นเลย");

  for (const n of nodes) {
    if (!seen.has(n.id)) warnings.push(`"${n.data?.label || n.id}" ไม่ได้ต่อกับกราฟ ผู้เล่นจะไม่เห็น`);
    if (n.type === "required" && !n.data?.actions?.length) errors.push(`Required "${n.id}" ยังไม่มี order`);
    if (n.type === "required" && !n.data?.distractors?.length) warnings.push(`"${n.data?.label || n.id}" ยังไม่มีตัวเลือกผิด ผู้เล่นจะมีปุ่มเดียวให้กด`);
    if (n.data?.outcomeType !== undefined && !n.data?.narrative && !out(n.id).length) warnings.push(`"${n.data?.label || n.id}" จบเคสแต่ยังไม่มีข้อความ`);
  }
  return { errors, warnings };
}

export const isPlayable = (p: CaseProblems) => p.errors.length === 0;
