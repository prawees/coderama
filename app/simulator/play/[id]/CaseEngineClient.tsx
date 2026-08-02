"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import case01_en from "../../../../public/locales/en/case_01.json";
import case02_en from "../../../../public/locales/en/case_02_fluids.json";
import case03_en from "../../../../public/locales/en/case_03_cardiac.json";
import case01_th from "../../../../public/locales/th/case_01.json";
import case02_th from "../../../../public/locales/th/case_02_fluids.json";
import case03_th from "../../../../public/locales/th/case_03_cardiac.json";

const CASES: Record<string, Record<string, any>> = {
  "en": {
    "case_01": case01_en,
    "case_02_fluids": case02_en,
    "case_03_cardiac": case03_en
  },
  "th": {
    "case_01": case01_th,
    "case_02_fluids": case02_th,
    "case_03_cardiac": case03_th
  }
};
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { GameCanvas } from "@/components/game/GameCanvas";
import { MinigameOverlay } from "@/components/game/MinigameOverlay";

function CaseEngineContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('instanceId');
  
  const { activeCases, removeCase, addXp, addCurrency, xp, deductEnergy, language } = useERStore();
  const { getRankFromXp, RANK_THRESHOLDS } = require('@/lib/erStore');
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [activeMinigame, setActiveMinigame] = useState<{name: string, targetNodeId: string} | null>(null);

  const currentRank = getRankFromXp(xp);

  // Dynamically load case data based on selected language
  const caseData = CASES[language]?.[params.id] || CASES['en']?.[params.id];
  if (!caseData) return <div className="p-4 text-white">Case {params.id} not found!</div>;

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

  // The actual nodes might be nested under managementGraph.nodes (array or object) depending on the case version
  // In case_03_cardiac, it's an object under managementGraph.nodes.
  // In case_02_fluids, it's an array under managementGraph.nodes.
  // In case_01, it's an array under managementGraph.nodes.
  let nodesMap: any = {};
  if (Array.isArray(caseData.managementGraph?.nodes)) {
    // Convert array to object
    caseData.managementGraph.nodes.forEach((n: any) => {
      nodesMap[n.id] = {
        vitals: normalizeVitals(caseData.vitals, n.data.vitalChanges),
        narrative: n.data.narrative || n.data.label,
        // map edges to options
        options: caseData.managementGraph.edges.filter((e: any) => e.source === n.id).map((e: any) => {
          const targetNode = caseData.managementGraph.nodes.find((tn: any) => tn.id === e.target);
          return {
            id: e.id,
            text: targetNode?.data?.label || 'Continue',
            targetNode: e.target,
            requiredRank: targetNode?.data?.requiredRank || 'MS1'
          };
        })
      };
      if (nodesMap[n.id].options.length === 0) nodesMap[n.id].options = null;
    });
  } else if (caseData.managementGraph?.nodes) {
    // case_03 style
    Object.entries(caseData.managementGraph.nodes).forEach(([id, data]: [string, any]) => {
      nodesMap[id] = {
        ...data,
        vitals: normalizeVitals(data.vitals) // assuming nodes define their own vitals fully here
      };
    });
  } else {
    nodesMap = caseData.nodes; // old mock style
  }

  const currentNode = nodesMap[currentNodeId];

  useEffect(() => {
    // Validate case exists
    const isValid = activeCases.some(c => c.id === instanceId);
    if (!isValid) {
      router.push('/hub'); // Fixed route
    }
  }, [activeCases, instanceId, router]);

  const handleAction = async (targetNodeId: string, requiredRank: string) => {
    const requiredXp = RANK_THRESHOLDS[requiredRank];
    if (xp < requiredXp) {
       await Haptics.vibrate();
       alert(`You must be at least ${requiredRank} to perform this intervention! Use 'Call Attending' or gain more XP.`);
       return;
    }
    await Haptics.impact({ style: ImpactStyle.Light });
    
    // Determine if it's a physical intervention (e.g. IV bolus)
    const option = currentNode.options.find((o: any) => o.targetNode === targetNodeId);
    if (option && (option.text.includes("IV") || option.text.includes("CPR") || option.text.includes("Push"))) {
       setActiveMinigame({ name: option.text, targetNodeId });
    } else {
       setCurrentNodeId(targetNodeId);
    }
  };

  const callAttending = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    alert("Attending took over! Case resolved, but you only earned 50% XP.");
    addXp(50); // Reduced XP
    deductEnergy(20);
    if (instanceId) removeCase(instanceId);
    router.push('/hub');
  };

  const finishCase = async (isSuccess: boolean) => {
    if (isSuccess) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      addXp(100);
      addCurrency(50);
    } else {
      await Haptics.vibrate();
    }
    deductEnergy(20);
    if (instanceId) {
      removeCase(instanceId);
    }
    router.push('/hub');
  };

  if (!currentNode) return null;

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
              alert("Intervention failed! You missed the green zone. You lost 10 Energy.");
              deductEnergy(10);
            }
          }}
        />
      )}
      <div className="min-h-screen bg-pixel-bg text-pixel-text font-pixel flex flex-col p-4 relative">
        <GameCanvas />
        <div className="relative z-10 flex flex-col h-full pointer-events-none">
          <PixelPanel className="mb-4 flex justify-between pointer-events-auto" variant="dark">
            <div>
              <span className="text-pixel-text-muted text-xs uppercase">BP</span>
              <p className={`text-xl ${currentNode.vitals.bp.includes('0/0') || currentNode.vitals.bp.includes('70/40') ? 'text-pixel-alert animate-pulse' : 'text-pixel-success'}`}>
                {currentNode.vitals.bp}
              </p>
          </div>
          <div>
            <span className="text-pixel-text-muted text-xs uppercase">HR</span>
            <p className={`text-xl ${currentNode.vitals.hr > 110 || currentNode.vitals.hr < 40 ? 'text-pixel-alert' : 'text-pixel-success'}`}>
              {currentNode.vitals.hr}
            </p>
          </div>
          <div>
            <span className="text-pixel-text-muted text-xs uppercase">O2</span>
            <p className="text-xl text-pixel-success">{currentNode.vitals.o2}</p>
          </div>
        </PixelPanel>

        <div className="flex-1 flex flex-col items-center justify-end mb-6 pointer-events-auto">
          <PixelPanel className="w-full text-center mb-2" variant="light">
            <p className="text-lg leading-relaxed min-h-[4rem]">
              {currentNode.narrative}
            </p>
          </PixelPanel>
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto">
          {currentNode.options ? (
            <>
              {currentNode.options.map((opt: any) => {
                const isLocked = xp < RANK_THRESHOLDS[opt.requiredRank];
                return (
                  <PixelButton 
                    key={opt.id} 
                    onClick={() => handleAction(opt.targetNode, opt.requiredRank)}
                    variant={isLocked ? "alert" : "primary"}
                    className={`py-3 text-sm flex justify-between ${isLocked ? 'opacity-50 grayscale' : ''}`}
                  >
                    <span>{opt.text}</span>
                    {isLocked && <span className="text-white text-xs">Req: {opt.requiredRank}</span>}
                  </PixelButton>
                );
              })}
              {currentNodeId === 'start' && (
                <PixelButton variant="alert" className="py-3 mt-4" onClick={callAttending}>
                  CALL ATTENDING (Resolve Case, -50% XP)
                </PixelButton>
              )}
            </>
          ) : (
            <PixelButton 
              onClick={() => finishCase(currentNodeId === 'correct_saline')}
              variant={currentNodeId === 'correct_saline' ? 'success' : 'alert'}
              className="py-4"
            >
              {currentNodeId === 'correct_saline' ? 'CASE RESOLVED (RETURN TO ER)' : 'PATIENT CRITICAL (RETURN TO ER)'}
            </PixelButton>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export function CaseEngineClient({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center font-pixel">LOADING...</div>}>
      <CaseEngineContent params={params} />
    </Suspense>
  );
}
