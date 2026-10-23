"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { CASE_DATA } from "@/lib/caseIndex";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

import { MinigameOverlay } from "@/components/game/MinigameOverlay";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { audio } from "@/lib/audio";
import { PatientPortrait } from "@/components/game/PixelPortrait";
import { patientFor } from "@/lib/patients";

function CaseEngineContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('instanceId');
  
  const { activeCases, removeCase, addXp, addCurrency, lifetimeXp, deductEnergy, language } = useERStore();
  const { RANK_THRESHOLDS } = require('@/lib/erStore');
  
  // Resolve active case and case definition key (supports both instanceId in URL and params.id)
  const activeCase = activeCases.find(c => c.id === params.id || c.id === instanceId)
    || activeCases.find(c => c.caseDataId === params.id);
  const currentInstanceId = activeCase ? activeCase.id : (instanceId || params.id);
  const caseKey = activeCase ? activeCase.caseDataId : params.id;

  // Dynamically load case data based on selected language
  const caseData = CASE_DATA[caseKey];
  const patient = patientFor(caseKey);

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<{name: string, targetNodeId: string} | null>(null);
  
  const [isShaking, setIsShaking] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{id: number, text: string, type: 'good' | 'bad', x: number, y: number}[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'exam' | 'labs' | 'action'>('action');
  const textIdCounter = useRef(0);

  // Scoring: wrong choices made this case, and which wrong options were already tried at the current step
  const [mistakes, setMistakes] = useState(0);
  const [supervised, setSupervised] = useState(false);
  const isAboveRank = (rank: string) => (lifetimeXp || 0) < (RANK_THRESHOLDS[rank] ?? 0);
  const [triedWrong, setTriedWrong] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; title: string; body?: string } | null>(null);

  const addFloatingText = (text: string, type: 'good' | 'bad', x: number, y: number) => {
    const id = textIdCounter.current++;
    setFloatingTexts(prev => [...prev, { id, text, type, x, y }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  const normalizeVitals = (rawVitals: any, overrideVitals?: any) => {
    let bp = "120/80";
    let hr = 80;
    let o2 = "98%";

    // Parse base vitals
    if (rawVitals?.sbp?.value) {
      bp = `${rawVitals.sbp.value}/${rawVitals.dbp?.value || 80}`;
    } else if (rawVitals?.bp) {
      bp = rawVitals.bp;
    }

    if (rawVitals?.hr?.value !== undefined) {
      hr = rawVitals.hr.value;
    } else if (rawVitals?.hr !== undefined) {
      hr = rawVitals.hr;
    }

    if (rawVitals?.spo2?.value !== undefined) {
      o2 = `${rawVitals.spo2.value}%`;
    } else if (rawVitals?.o2) {
      o2 = rawVitals.o2;
    }

    // Apply overrides
    if (overrideVitals) {
      if (overrideVitals.sbp !== undefined) bp = `${overrideVitals.sbp}/${overrideVitals.dbp || rawVitals?.dbp?.value || 80}`;
      else if (overrideVitals.bp !== undefined) bp = overrideVitals.bp;
      
      if (overrideVitals.hr !== undefined) hr = overrideVitals.hr;
      if (overrideVitals.spo2 !== undefined) o2 = `${overrideVitals.spo2}%`;
      else if (overrideVitals.o2 !== undefined) o2 = overrideVitals.o2;
    }

    return { bp, hr, o2 };
  };

  // Convert managementGraph nodes to unified map
  let nodesMap: any = {};
  if (caseData?.managementGraph?.nodes) {
    if (Array.isArray(caseData.managementGraph.nodes)) {
      caseData.managementGraph.nodes.forEach((n: any) => {
        nodesMap[n.id] = {
          vitals: normalizeVitals(caseData.vitals, n.data?.vitalChanges),
          narrative: n.data?.narrative || n.data?.label || '',
          label: n.data?.label || '',
          distractors: Array.isArray(n.data?.distractors) ? n.data.distractors : [],
          type: n.type || "intervention",
          outcomeType: n.data?.outcomeType,
          ethicalValue: n.data?.ethicalValue,
          options: (caseData.managementGraph.edges || [])
            .filter((e: any) => e.source === n.id)
            .map((e: any) => {
              const targetNode = caseData.managementGraph.nodes.find((tn: any) => tn.id === e.target);
              // `choice` is the plain action shown on the button. The full `label` often explains
              // why the step is right, which would give the answer away, so it is shown after the pick.
              return {
                id: e.id,
                text: targetNode?.data?.choice || targetNode?.data?.label || 'Continue',
                label: targetNode?.data?.label || targetNode?.data?.choice || 'Continue',
                targetNode: e.target,
                requiredRank: targetNode?.data?.requiredRank || 'MS5'
              };
            })
        };
        if (nodesMap[n.id].options.length === 0) nodesMap[n.id].options = null;
      });
    } else {
      // Object style (e.g. case_03)
      Object.entries(caseData.managementGraph.nodes).forEach(([id, data]: [string, any]) => {
        nodesMap[id] = {
          ...data,
          type: data.type || "intervention",
          outcomeType: data.outcomeType || data.data?.outcomeType,
          ethicalValue: data.data?.ethicalValue,
          vitals: normalizeVitals(data.vitals)
        };
      });
    }
  } else if (caseData?.nodes) {
    nodesMap = caseData.nodes;
  }

  // Determine initial start node dynamically
  const startNodeId = (() => {
    if (nodesMap["start"]) return "start";
    if (nodesMap["start1"]) return "start1";
    const found = Object.keys(nodesMap).find(id => {
      const n = nodesMap[id];
      return n.type === 'start' || id.toLowerCase().includes('start');
    });
    return found || Object.keys(nodesMap)[0] || "start";
  })();

  const effectiveNodeId = currentNodeId || startNodeId;
  const currentNode = nodesMap[effectiveNodeId];

  useEffect(() => {
    // If neither case definition nor active case is found, navigate back to hub
    const hasData = Boolean(caseData);
    if (!hasData) {
      router.push('/hub');
    }
  }, [caseData, router]);

  if (!caseData) {
    return (
      <div className="p-8 text-center text-white font-pixel">
        <p className="text-xl text-yellow-400 mb-4">หาเคสนี้ไม่เจอ</p>
        <PixelButton onClick={() => router.push('/hub')}>กลับ ER</PixelButton>
      </div>
    );
  }

  type Choice = {
    key: string;
    text: string;
    /** Full teaching label for a correct step, shown in the feedback after it is picked */
    label?: string;
    kind: 'edge' | 'wrong';
    targetNode?: string;
    requiredRank: string;
    feedback?: string;
  };

  // Deterministic shuffle so the correct answer is not always first, and the order is stable across renders
  const seededOrder = (seed: string) => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // Each outgoing edge is a correct option. If its target step has authored distractors,
  // those become wrong options shown alongside it, so the player has to pick the right step.
  const buildChoices = (nodeId: string, node: any): { choices: Choice[]; isDecision: boolean } => {
    if (!node?.options) return { choices: [], isDecision: false };
    const tried = triedWrong[nodeId] || [];
    const choices: Choice[] = [];
    let isDecision = false;
    for (const o of node.options) {
      choices.push({ key: `edge:${o.id ?? o.targetNode}`, text: o.text, label: o.label, kind: 'edge', targetNode: o.targetNode, requiredRank: o.requiredRank || 'MS5' });
      const target = nodesMap[o.targetNode];
      (target?.distractors || []).forEach((d: any, i: number) => {
        if (!d?.label) return;
        isDecision = true;
        const key = `wrong:${o.targetNode}:${i}`;
        if (tried.includes(key)) return;
        // Wrong options carry the same rank tag as the step they sit beside, so a
        // "supervised" badge never marks the right answer on its own.
        choices.push({ key, text: d.label, kind: 'wrong', requiredRank: o.requiredRank || 'MS5', feedback: d.feedback });
      });
    }
    if (isDecision) choices.sort((x, y) => seededOrder(nodeId + x.key) - seededOrder(nodeId + y.key));
    return { choices, isDecision };
  };

  const handleAction = async (choice: Choice) => {
    const { isDecision } = buildChoices(effectiveNodeId, currentNode);

    if (choice.kind === 'wrong') {
      setMistakes(m => m + 1);
      setTriedWrong(prev => ({ ...prev, [effectiveNodeId]: [...(prev[effectiveNodeId] || []), choice.key] }));
      deductEnergy(5);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      addFloatingText("-5 พลังงาน", "bad", window.innerWidth / 2, window.innerHeight / 2);
      setFeedback({ kind: 'bad', title: choice.text, body: choice.feedback });
      await Haptics.vibrate();
      return;
    }

    // Above-rank interventions are allowed under supervision, which lowers the case reward.
    // (Hard locks left first-day students with nothing to press.) Only a correct pick counts.
    if (isAboveRank(choice.requiredRank)) setSupervised(true);
    await Haptics.impact({ style: ImpactStyle.Light });
    const targetNodeId = choice.targetNode!;
    const nextNode = nodesMap[targetNodeId];
    if (!nextNode) return;

    if (isDecision) {
      const firstTry = !(triedWrong[effectiveNodeId]?.length);
      if (firstTry) {
        addFloatingText("+15 XP", "good", window.innerWidth / 2, window.innerHeight / 2);
        addXp(15);
      }
      // Orders for the step, with the dose note where the case has one
      const nd = (caseData.managementGraph?.nodes || []).find?.((n: any) => n.id === targetNodeId)?.data;
      const actions: string[] = Array.isArray(nd?.actions) ? nd.actions : [];
      const orders = actions.map((a) => (nd?.doseMap?.[a] ? `${a}: ${nd.doseMap[a]}` : a));
      setFeedback({ kind: 'good', title: choice.label || choice.text, body: orders.length ? orders.map((o) => `• ${o}`).join('\n') : undefined });
    } else {
      setFeedback(null);
      // Legacy branching cases: judge the choice by whether blood pressure improves
      const currentSystolic = parseInt(currentNode.vitals.bp.split('/')[0]);
      const nextSystolic = parseInt(nextNode.vitals.bp.split('/')[0]);
      if (nextSystolic < currentSystolic || nextNode.vitals.bp.includes('0/0')) {
          setIsShaking(true);
          await Haptics.vibrate();
          setTimeout(() => setIsShaking(false), 500);
      } else if (nextSystolic > currentSystolic) {
          addFloatingText("+15 XP", "good", window.innerWidth / 2, window.innerHeight / 2);
          addXp(15);
      }
    }

    // Ethical choices shift karma
    if (nextNode.type === 'ethicalChoice' || nextNode.ethicalValue !== undefined) {
      const karmaChange = nextNode.ethicalValue || 0;
      if (karmaChange > 0) {
        addFloatingText(language === 'th' ? "คณะกรรมการโรงพยาบาลจะจำเรื่องนี้ไว้" : "The Hospital Board will remember that.", "good", window.innerWidth / 2, window.innerHeight / 2);
        useERStore.getState().addKarma(karmaChange);
      } else if (karmaChange < 0) {
        addFloatingText(language === 'th' ? "ชื่อเสียงของคุณลดลง" : "Your reputation decreased.", "bad", window.innerWidth / 2, window.innerHeight / 2);
        useERStore.getState().addKarma(karmaChange);
      }
    }

    const procedureName = choice.label || choice.text;
    if (procedureName.includes("IV") || procedureName.includes("CPR") || procedureName.includes("Push")) {
       setActiveMinigame({ name: choice.text, targetNodeId });
    } else {
       setCurrentNodeId(targetNodeId);
    }
  };

  const isNodeSuccessful = (nodeId: string, node: any) => {
    if (!node) return false;
    if (node.outcomeType === 'improved' || node.outcomeType === 'resolved' || node.outcomeType === 'success') return true;
    if (node.outcomeType === 'critical' || node.outcomeType === 'deteriorated' || node.outcomeType === 'fatal') return false;
    
    const lowerId = (nodeId || "").toLowerCase();
    if (lowerId.startsWith('correct') || lowerId.startsWith('out_correct') || lowerId === 'out1' || lowerId.includes('resolved') || lowerId.includes('success')) {
      return true;
    }
    if (lowerId.startsWith('wrong') || lowerId.startsWith('out_overload') || lowerId.startsWith('out_edema') || lowerId.includes('critical') || lowerId.includes('fail') || lowerId.includes('death')) {
      return false;
    }

    const bp = node.vitals?.bp || "";
    const hr = typeof node.vitals?.hr === 'number' ? node.vitals.hr : 0;
    if (!bp.includes('0/0') && hr >= 50 && hr <= 120) {
      return true;
    }
    return false;
  };

  // Outcome grade combines where the graph ended with how many wrong steps were taken on the way
  type Grade = 'clean' | 'minor' | 'poor' | 'critical';
  const gradeOutcome = (reachedGoodEnding: boolean): Grade => {
    if (!reachedGoodEnding) return 'critical';
    if (mistakes === 0) return 'clean';
    if (mistakes === 1) return 'minor';
    return 'poor';
  };
  const GRADE_REWARDS: Record<Grade, { xp: number; cash: number }> = {
    clean: { xp: 100, cash: 50 },
    minor: { xp: 70, cash: 40 },
    poor: { xp: 30, cash: 10 },
    critical: { xp: 0, cash: 0 },
  };

  const callAttending = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    addFloatingText("อาจารย์มารับเคสต่อแล้ว", "good", window.innerWidth / 2, window.innerHeight / 2);
    // addXp and addCurrency already record XP, cash and the treated case in shiftStats
    addXp(50);
    addCurrency(25);
    deductEnergy(15);
    if (currentInstanceId) removeCase(currentInstanceId);
    setTimeout(() => router.push('/hub'), 700);
  };

  const requestConsult = async () => {
    if (!auth.currentUser) {
      setFeedback({ kind: 'bad', title: 'ห้องพักแพทย์ปิดอยู่', body: 'ต้อง login ก่อน ถึงจะฝากเคสให้เพื่อนหมอช่วยดูได้' });
      return;
    }
    
    await Haptics.impact({ style: ImpactStyle.Heavy });
    try {
      await addDoc(collection(db, "consults"), {
        requesterId: auth.currentUser.uid,
        requesterName: useERStore.getState().playerName || "Unknown Doctor",
        caseId: caseData.title || params.id || "unknown",
        currentNodeId: effectiveNodeId,
        vitals: currentNode.vitals.bp + " HR:" + currentNode.vitals.hr,
        narrative: currentNode.narrative,
        options: buildChoices(effectiveNodeId, currentNode).choices.map((opt) => ({
          text: opt.text,
          targetNode: opt.targetNode ?? null,
          isCorrect: opt.kind === 'edge' && !nodesMap[opt.targetNode!]?.vitals?.bp?.includes('0/0')
        })),
        status: "open",
        createdAt: Date.now()
      });
      addFloatingText(language === 'th' ? "ฝากคำถามไว้ที่ห้องพักแพทย์แล้ว" : "Note left in the lounge", "good", window.innerWidth / 2, window.innerHeight / 2);
      deductEnergy(15);
      if (currentInstanceId) removeCase(currentInstanceId);
      setTimeout(() => router.push('/hub'), 700);
    } catch (e) {
      console.error("Failed to request consult", e);
      setFeedback({ kind: 'bad', title: 'ส่งไม่สำเร็จ', body: 'เช็คเน็ตแล้วลองใหม่นะ' });
    }
  };

  const rewardFor = (grade: Grade) => {
    const r = GRADE_REWARDS[grade];
    return supervised ? { xp: Math.round(r.xp * 0.6), cash: Math.round(r.cash * 0.6) } : r;
  };

  const finishCase = async (grade: Grade) => {
    const reward = rewardFor(grade);
    if (grade !== 'critical') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else {
      await Haptics.vibrate();
    }
    // addXp and addCurrency already update shiftStats (XP, cash, and casesTreated for positive cash)
    if (reward.xp > 0) addXp(reward.xp);
    if (reward.cash > 0) {
      addCurrency(reward.cash);
    } else {
      useERStore.setState(state => ({
        shiftStats: { ...state.shiftStats, casesTreated: state.shiftStats.casesTreated + 1 }
      }));
    }
    // Remember them. A good outcome brings a letter the next morning.
    useERStore.getState().recordPatient(caseKey, grade !== 'critical');
    // A finished patient tires you out a little. Tuned so a shift fits six to eight patients.
    deductEnergy(12);
    if (currentInstanceId) {
      removeCase(currentInstanceId);
    }
    router.push('/hub');
  };

  if (!currentNode) return null;

  // Each wrong step visibly worsens the patient
  const shownVitals = (() => {
    const v = currentNode.vitals || { bp: "120/80", hr: 80, o2: "98%" };
    if (mistakes === 0 || String(v.bp).includes('0/0')) return v;
    const [sys, dia] = String(v.bp).split('/').map((x: string) => parseInt(x));
    const o2 = parseInt(String(v.o2));
    return {
      bp: `${Math.max(50, sys - 6 * mistakes)}/${Math.max(30, (dia || 80) - 4 * mistakes)}`,
      hr: (typeof v.hr === 'number' ? v.hr : 80) + 8 * mistakes,
      o2: isNaN(o2) ? v.o2 : `${Math.max(70, o2 - mistakes)}%`,
    };
  })();
  const shownSystolic = parseInt(String(shownVitals.bp).split('/')[0]);

  const { choices } = buildChoices(effectiveNodeId, currentNode);

  const promptText = (() => {
    if (currentNode.type === 'start' && (!currentNode.narrative || currentNode.narrative === 'Start')) {
      return 'ทำอะไรก่อนดี';
    }
    if (currentNode.type === 'required') {
      return 'แล้วต่อไปทำอะไร';
    }
    return currentNode.narrative;
  })();

  const tr = (en: string, th: string) => (language === 'th' ? th : en);
  const vitalClass = (bad: boolean) => (bad ? 'text-[#ff8a8a] animate-pulse' : 'text-[#9be38a]');
  const tabs: { key: 'info' | 'exam' | 'labs' | 'action'; label: string; icon: string }[] = [
    { key: 'info', label: 'ประวัติ', icon: 'log' },
    { key: 'exam', label: 'PE', icon: 'badge' },
    { key: 'labs', label: 'แล็บ', icon: 'quest' },
    { key: 'action', label: 'รักษา', icon: 'heart' },
  ];

  return (
    <>
      {activeMinigame && (
        <MinigameOverlay
          interventionName={activeMinigame.name}
          onComplete={async (success) => {
            setActiveMinigame(null);
            if (success) {
              await Haptics.impact({ style: ImpactStyle.Medium });
              setCurrentNodeId(activeMinigame.targetNodeId);
            } else {
              await Haptics.vibrate();
              setFeedback({ kind: 'bad', title: 'จังหวะพลาด', body: 'เสียพลังงาน 10 ลองใหม่อีกที' });
              deductEnergy(10);
            }
          }}
        />
      )}
      <div className={`h-[100dvh] sm:h-full cozy-night text-pixel-text font-pixel flex flex-col p-2 gap-2 relative ${isShaking ? 'animate-shake' : ''}`}>
        <AnimatePresence>
          {floatingTexts.map(ft => (
            <motion.div
              key={ft.id}
              initial={{ opacity: 1, y: ft.y, x: ft.x }}
              animate={{ opacity: 0, y: ft.y - 50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className={`absolute z-[100] text-3xl cozy-tag px-2 ${ft.type === 'good' ? '!bg-[#c8ecb4]' : '!bg-[#f6c3c6]'}`}
              style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
            >
              {ft.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Patient card: a person first, the diagnosis comes at the end */}
        <div className="cozy-panel flex gap-2.5 p-2 flex-shrink-0 items-start" data-testid="patient-card">
          <div className="w-14 h-14 flex-shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
            <PatientPortrait seed={caseKey} sex={caseData.sex} ageGroup={caseData.patientAppearance?.ageGroup} skinTone={caseData.patientAppearance?.skinTone} age={parseFloat(caseData.age)} className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[20px] leading-none truncate" data-testid="patient-name">
              {patient ? `${patient.name.th} ${patient.age.th}` : caseData.title}
            </p>
            {patient ? (
              <div className="relative mt-1.5 bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[6px] px-2 py-1 text-[15px] leading-snug text-[#3a2a2f]">
                <span className="absolute -left-[7px] top-2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-[#e7d3a8]" />
                <span className="text-[#86522e]">{patient.by.th}: </span>&ldquo;{patient.quote.th}&rdquo;
              </div>
            ) : (
              <p className="text-[15px] leading-tight mt-1 line-clamp-2">{caseData.chiefComplaint}</p>
            )}
          </div>
          <button onClick={() => router.push('/hub')} className="cozy-btn px-2 py-0.5 text-[15px] leading-none self-start" aria-label="back">✕</button>
        </div>

        {/* Bedside monitor */}
        <div className="flex-shrink-0 rounded-[6px] border-[3px] border-[#3a2a2f] p-1 cozy-wood-dark">
          <div className="grid grid-cols-5 bg-[#1b2320] rounded-[3px] px-1 py-1.5 text-center shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]" data-testid="vitals">
            {[
              { k: 'HR', v: shownVitals.hr, bad: shownVitals.hr > 110 || shownVitals.hr < 40 },
              { k: 'BP', v: shownVitals.bp, bad: String(shownVitals.bp).includes('0/0') || shownSystolic < 90 },
              { k: 'RR', v: caseData.vitals?.rr?.value || 16, bad: (caseData.vitals?.rr?.value || 16) > 24 },
              { k: 'SpO2', v: shownVitals.o2, bad: parseInt(String(shownVitals.o2)) < 92 },
              { k: 'T', v: caseData.vitals?.temp?.value || 37.0, bad: (caseData.vitals?.temp?.value || 37) >= 38.5 },
            ].map((x) => (
              <div key={x.k} className="flex flex-col items-center min-w-0">
                <span className="text-[#7fc8d8] text-[12px] leading-none">{x.k}</span>
                <span className={`text-[19px] leading-none mt-0.5 tabular-nums ${vitalClass(x.bad)}`}>{x.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clipboard */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          <div className="flex gap-1 px-1 relative z-10">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => { audio.playClick(); setActiveTab(tb.key); }}
                className={`flex-1 flex items-center justify-center gap-1 py-1 text-[16px] leading-none rounded-t-[5px] border-[3px] border-b-0 border-[#3a2a2f] ${activeTab === tb.key ? 'bg-[#f8ecd0] text-[#3a2a2f] -mb-[3px] pb-[7px]' : 'bg-[#c48a52] text-[#fff3df]'}`}
              >
                <PixelIcon name={tb.icon} size={13} />{tb.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 cozy-panel p-3 overflow-y-auto">
            {activeTab === 'info' && (
              <div className="space-y-3 text-[17px] leading-snug">
                {caseData.chiefComplaint && <p><span className="text-[#86522e]">CC </span>{caseData.chiefComplaint}</p>}
                <p>{caseData.background || 'ยังไม่มีใครจดอะไรไว้เลย'}</p>
              </div>
            )}

            {activeTab === 'exam' && (
              <div className="space-y-2">
                {caseData.exam ? caseData.exam.map((e: any) => (
                  <div key={e.id} className={`p-2 rounded-[4px] border-2 ${e.abnormal ? 'bg-[#fbe1dc] border-[#d95763]' : 'bg-[#fff6e3] border-[#e7d3a8]'}`}>
                    <h4 className={`text-[15px] leading-none mb-1 ${e.abnormal ? 'text-[#a93c4b]' : 'text-[#3f8a48]'}`}>{e.system}</h4>
                    <p className="text-[17px] leading-snug">{e.finding}</p>
                  </div>
                )) : <p>{'ยังไม่ได้ตรวจร่างกาย'}</p>}
              </div>
            )}

            {activeTab === 'labs' && (
              <div className="space-y-2">
                {caseData.investigations ? caseData.investigations.map((lab: any) => (
                  <div key={lab.id} className={`p-2 rounded-[4px] border-2 ${lab.abnormal ? 'bg-[#fdf0c8] border-[#e8b84f]' : 'bg-[#fff6e3] border-[#e7d3a8]'}`}>
                    <h4 className={`text-[15px] leading-none mb-1 ${lab.abnormal ? 'text-[#9a6a10]' : 'text-[#3f6f80]'}`}>{lab.name}</h4>
                    <p className="text-[17px] leading-snug">{lab.report || `${lab.value} ${lab.unit}`}</p>
                  </div>
                )) : <p>{'ผลแล็บยังไม่ออก'}</p>}
              </div>
            )}

            {activeTab === 'action' && (
              <div className="flex flex-col min-h-full" data-testid="action-tab">
                {feedback && (
                  <div className={`mb-2 p-2 rounded-[4px] border-2 text-[16px] leading-snug ${feedback.kind === 'good' ? 'bg-[#dff3d2] border-[#5fae5a]' : 'bg-[#fbe1dc] border-[#d95763]'}`}>
                    <p className={feedback.kind === 'good' ? 'text-[#3f8a48]' : 'text-[#a93c4b]'}>
                      {feedback.kind === 'good' ? '✓ ' : '✗ '}{feedback.title}
                    </p>
                    {feedback.body && <p className="mt-0.5 whitespace-pre-line text-[15px]">{feedback.body}</p>}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[20px] leading-tight">{promptText}</p>
                  {mistakes > 0 && (
                    <span className="shrink-0 cozy-tag !bg-[#f6c3c6] px-1.5 py-0.5 text-[14px] leading-none">
                      {`พลาด ${mistakes}`}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  {choices.length > 0 ? (
                    <>
                      {choices.map((opt) => {
                        const needsSupervision = isAboveRank(opt.requiredRank);
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleAction(opt)}
                            className="cozy-btn w-full py-2 px-2.5 text-left text-[17px] leading-tight flex justify-between items-center gap-2"
                          >
                            <span>{opt.text}</span>
                            {needsSupervision && <span className="shrink-0 cozy-tag !bg-[#ffd66b] px-1 py-0.5 text-[12px] leading-none">{'อาจารย์คุม'}</span>}
                          </button>
                        );
                      })}

                      {effectiveNodeId === startNodeId && (
                        <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t-2 border-dashed border-[#e7d3a8]">
                          <button className="cozy-btn cozy-btn-berry py-1.5 px-1 text-[15px] leading-tight" onClick={callAttending}>
                            {'ตามอาจารย์มาช่วย (XP ครึ่งเดียว)'}
                          </button>
                          <button className="cozy-btn cozy-btn-sky py-1.5 px-1 text-[15px] leading-tight" onClick={requestConsult}>
                            {'ฝากเคสถามเพื่อนหมอ'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (() => {
                    const grade = gradeOutcome(isNodeSuccessful(effectiveNodeId, currentNode));
                    const reward = rewardFor(grade);
                    const LABELS: Record<Grade, { en: string; th: string }> = {
                      clean: { en: '✓ Every step right', th: '✓ ถูกทุกขั้น' },
                      minor: { en: '✓ Stable, with one slip', th: '✓ ปลอดภัยดี พลาดไป 1 ครั้ง' },
                      poor: { en: '△ They made it, roughly', th: '△ รอด แต่ดูแลได้ดีกว่านี้' },
                      critical: { en: '✗ They did not do well', th: '✗ คนไข้อาการแย่ลง' },
                    };
                    const good = grade === 'clean' || grade === 'minor';
                    const coins = `${reward.cash} เหรียญ`;
                    return (
                      <>
                        {patient && (
                          <div className="mb-1 rounded-[4px] border-2 border-[#e7d3a8] bg-[#fff6e3] px-2.5 py-2 text-center" data-testid="diagnosis">
                            <p className="text-[19px] leading-tight"><span className="text-[#86522e]">Dx </span>{patient.dx.th}</p>
                            {grade !== 'critical' && patient.letter && (
                              <p className="text-[15px] leading-snug mt-1 text-[#86522e]">
                                {`${patient.name.th} อาจเขียนจดหมายมาหาหมอตอนกลับถึงบ้าน`}
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => finishCase(grade)}
                          className={`cozy-btn w-full py-3 ${good ? 'cozy-btn-leaf' : 'cozy-btn-berry'}`}
                          data-testid="finish-case"
                        >
                          <span className="block text-[21px] leading-none">{LABELS[grade].th}</span>
                          <span className="block text-[15px] leading-none mt-1.5 opacity-90">
                            {`+${reward.xp} XP และ ${coins}`}{supervised ? ' (อาจารย์คุม)' : ''}
                          </span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function CaseEngineClient({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center font-pixel">กำลังโหลด...</div>}>
      <CaseEngineContent params={params} />
    </Suspense>
  );
}
