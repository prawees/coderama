"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import case01_en from "../../../../public/locales/en/case_01.json";
import case02_en from "../../../../public/locales/en/case_02_fluids.json";
import case03_en from "../../../../public/locales/en/case_03_cardiac.json";
import case07_en from "../../../../public/locales/en/case_07.json";
import case08_en from "../../../../public/locales/en/case_08.json";
import case09_en from "../../../../public/locales/en/case_09.json";
import case10_en from "../../../../public/locales/en/case_10.json";
import case11_en from "../../../../public/locales/en/case_11.json";
import case12_en from "../../../../public/locales/en/case_12.json";
import case13_en from "../../../../public/locales/en/case_13.json";
import case14_en from "../../../../public/locales/en/case_14.json";
import case15_en from "../../../../public/locales/en/case_15.json";
import case16_en from "../../../../public/locales/en/case_16.json";
import case17_en from "../../../../public/locales/en/case_17.json";
import case18_en from "../../../../public/locales/en/case_18.json";
import case19_en from "../../../../public/locales/en/case_19.json";
import case20_en from "../../../../public/locales/en/case_20.json";
import case21_en from "../../../../public/locales/en/case_21.json";
import case22_en from "../../../../public/locales/en/case_22.json";
import case23_en from "../../../../public/locales/en/case_23.json";
import case24_en from "../../../../public/locales/en/case_24.json";
import case25_en from "../../../../public/locales/en/case_25.json";
import case26_en from "../../../../public/locales/en/case_26.json";
import case27_en from "../../../../public/locales/en/case_27.json";
import case28_en from "../../../../public/locales/en/case_28.json";
import case29_en from "../../../../public/locales/en/case_29.json";
import case30_en from "../../../../public/locales/en/case_30.json";
import case31_en from "../../../../public/locales/en/case_31.json";
import case32_en from "../../../../public/locales/en/case_32.json";
import case33_en from "../../../../public/locales/en/case_33.json";
import case34_en from "../../../../public/locales/en/case_34.json";
import case35_en from "../../../../public/locales/en/case_35.json";
import case36_en from "../../../../public/locales/en/case_36.json";
import case37_en from "../../../../public/locales/en/case_37.json";
import case38_en from "../../../../public/locales/en/case_38.json";
import case39_en from "../../../../public/locales/en/case_39.json";
import case40_en from "../../../../public/locales/en/case_40.json";
import case41_en from "../../../../public/locales/en/case_41.json";
import case42_en from "../../../../public/locales/en/case_42.json";
import case43_en from "../../../../public/locales/en/case_43.json";
import case44_en from "../../../../public/locales/en/case_44.json";
import case45_en from "../../../../public/locales/en/case_45.json";
import case46_en from "../../../../public/locales/en/case_46.json";
import case47_en from "../../../../public/locales/en/case_47.json";
import case48_en from "../../../../public/locales/en/case_48.json";
import case49_en from "../../../../public/locales/en/case_49.json";
import case50_en from "../../../../public/locales/en/case_50.json";
import case01_th from "../../../../public/locales/th/case_01.json";
import case02_th from "../../../../public/locales/th/case_02_fluids.json";
import case03_th from "../../../../public/locales/th/case_03_cardiac.json";
import case04_en from "../../../../public/locales/en/case_04_svt.json";
import case05_en from "../../../../public/locales/en/case_05_asthma.json";
import case06_en from "../../../../public/locales/en/case_06_trauma.json";
import case07_vip_en from "../../../../public/locales/en/case_07_vip.json";
import case04_th from "../../../../public/locales/th/case_04_svt.json";
import case05_th from "../../../../public/locales/th/case_05_asthma.json";
import case06_th from "../../../../public/locales/th/case_06_trauma.json";

const CASES: Record<string, Record<string, any>> = {
  "en": {
    "case_01": case01_en,
    "case_02_fluids": case02_en,
    "case_03_cardiac": case03_en,
    "case_04_svt": case04_en,
    "case_05_asthma": case05_en,
    "case_06_trauma": case06_en,
    "case_07": case07_en,
    "case_07_vip": case07_vip_en,
    "case_08": case08_en,
    "case_09": case09_en,
    "case_10": case10_en,
    "case_11": case11_en,
    "case_12": case12_en,
    "case_13": case13_en,
    "case_14": case14_en,
    "case_15": case15_en,
    "case_16": case16_en,
    "case_17": case17_en,
    "case_18": case18_en,
    "case_19": case19_en,
    "case_20": case20_en,
    "case_21": case21_en,
    "case_22": case22_en,
    "case_23": case23_en,
    "case_24": case24_en,
    "case_25": case25_en,
    "case_26": case26_en,
    "case_27": case27_en,
    "case_28": case28_en,
    "case_29": case29_en,
    "case_30": case30_en,
    "case_31": case31_en,
    "case_32": case32_en,
    "case_33": case33_en,
    "case_34": case34_en,
    "case_35": case35_en,
    "case_36": case36_en,
    "case_37": case37_en,
    "case_38": case38_en,
    "case_39": case39_en,
    "case_40": case40_en,
    "case_41": case41_en,
    "case_42": case42_en,
    "case_43": case43_en,
    "case_44": case44_en,
    "case_45": case45_en,
    "case_46": case46_en,
    "case_47": case47_en,
    "case_48": case48_en,
    "case_49": case49_en,
    "case_50": case50_en
  },
  "th": {
    "case_01": case01_th,
    "case_02_fluids": case02_th,
    "case_03_cardiac": case03_th,
    "case_04_svt": case04_th,
    "case_05_asthma": case05_th,
    "case_06_trauma": case06_th,
    "case_07": case07_en,
    "case_07_vip": case07_vip_en,
  }
};
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

import { MinigameOverlay } from "@/components/game/MinigameOverlay";

function CaseEngineContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('instanceId');
  
  const { activeCases, removeCase, addXp, addCurrency, xp, deductEnergy, language } = useERStore();
  const { getRankFromXp, RANK_THRESHOLDS } = require('@/lib/erStore');
  
  // Resolve active case and case definition key (supports both instanceId in URL and params.id)
  const activeCase = activeCases.find(c => c.id === params.id || c.id === instanceId)
    || activeCases.find(c => c.caseDataId === params.id);
  const currentInstanceId = activeCase ? activeCase.id : (instanceId || params.id);
  const caseKey = activeCase ? activeCase.caseDataId : params.id;

  // Dynamically load case data based on selected language
  const caseData = CASES[language]?.[caseKey] || CASES['en']?.[caseKey];

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<{name: string, targetNodeId: string} | null>(null);
  
  const [isShaking, setIsShaking] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{id: number, text: string, type: 'good' | 'bad', x: number, y: number}[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'exam' | 'labs' | 'action'>('action');
  const textIdCounter = useRef(0);

  const addFloatingText = (text: string, type: 'good' | 'bad', x: number, y: number) => {
    const id = textIdCounter.current++;
    setFloatingTexts(prev => [...prev, { id, text, type, x, y }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  const currentRank = getRankFromXp(xp);

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
          type: n.type || "intervention",
          outcomeType: n.data?.outcomeType,
          ethicalValue: n.data?.ethicalValue,
          options: (caseData.managementGraph.edges || [])
            .filter((e: any) => e.source === n.id)
            .map((e: any) => {
              const targetNode = caseData.managementGraph.nodes.find((tn: any) => tn.id === e.target);
              return {
                id: e.id,
                text: targetNode?.data?.label || 'Continue',
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
        <p className="text-xl text-yellow-400 mb-4">{language === 'th' ? 'ไม่พบข้อมูลเคสผู้ป่วย' : `Case ${params.id} not found!`}</p>
        <PixelButton onClick={() => router.push('/hub')}>{language === 'th' ? 'กลับสู่ห้องฉุกเฉิน' : 'Back to Hub'}</PixelButton>
      </div>
    );
  }

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
    
    // Check if wrong answer (degrading vitals or "bad" node)
    const nextNode = nodesMap[targetNodeId];
    if (nextNode) {
       const currentSystolic = parseInt(currentNode.vitals.bp.split('/')[0]);
       const nextSystolic = parseInt(nextNode.vitals.bp.split('/')[0]);
       
       if (nextSystolic < currentSystolic || nextNode.vitals.bp.includes('0/0')) {
          // Bad choice! Shake!
          setIsShaking(true);
          await Haptics.vibrate();
          setTimeout(() => setIsShaking(false), 500); // 0.5s duration
       } else if (nextSystolic > currentSystolic) {
          // Good choice!
          addFloatingText("+15 XP", "good", window.innerWidth / 2, window.innerHeight / 2);
          addXp(15);
       }
    }

    // Check for ethical choices
    if (nextNode.type === 'ethicalChoice' || nextNode.ethicalValue !== undefined) {
      const karmaChange = nextNode.ethicalValue || 0;
      if (karmaChange > 0) {
        addFloatingText("The Hospital Board will remember that.", "good", window.innerWidth / 2, window.innerHeight / 2);
        useERStore.getState().addKarma(karmaChange);
      } else if (karmaChange < 0) {
        addFloatingText("Your reputation decreased.", "bad", window.innerWidth / 2, window.innerHeight / 2);
        useERStore.getState().addKarma(karmaChange);
      }
    }

    if (option && (option.text.includes("IV") || option.text.includes("CPR") || option.text.includes("Push"))) {
       setActiveMinigame({ name: option.text, targetNodeId });
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

  const callAttending = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    alert(language === 'th' ? "อาจารย์แพทย์เข้าช่วยดูแลเคสเรียบร้อย! คุณได้รับ XP 50%" : "Attending took over! Case resolved, but you only earned 50% XP.");
    addXp(50);
    useERStore.setState(state => ({
      shiftStats: {
        casesTreated: state.shiftStats.casesTreated + 1,
        xpEarned: state.shiftStats.xpEarned + 50,
        cashEarned: state.shiftStats.cashEarned + 25,
      }
    }));
    deductEnergy(20);
    if (currentInstanceId) removeCase(currentInstanceId);
    router.push('/hub');
  };

  const requestConsult = async () => {
    if (!auth.currentUser) {
      alert(language === 'th' ? "กรุณาเข้าสู่ระบบเพื่อขอคำปรึกษาแพทย์เฉพาะทาง!" : "You must be logged in to request a consult!");
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
        options: (currentNode.options || []).map((opt: any) => ({
          text: opt.text,
          targetNode: opt.targetNode,
          isCorrect: !nodesMap[opt.targetNode]?.vitals?.bp?.includes('0/0')
        })),
        status: "open",
        createdAt: Date.now()
      });
      alert(language === 'th' ? "ส่งคำปรึกษาไปยังห้องแพทย์เรียบร้อยแล้ว!" : "Consult requested! Another doctor in the lounge can help you now.");
      deductEnergy(20);
      if (currentInstanceId) removeCase(currentInstanceId);
      router.push('/hub');
    } catch (e) {
      console.error("Failed to request consult", e);
      alert(language === 'th' ? "เกิดข้อผิดพลาดในการส่งคำปรึกษา" : "Error requesting consult.");
    }
  };

  const finishCase = async (isSuccess: boolean) => {
    if (isSuccess) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      addXp(100);
      addCurrency(50);
      useERStore.setState(state => ({
        shiftStats: {
          casesTreated: state.shiftStats.casesTreated + 1,
          xpEarned: state.shiftStats.xpEarned + 100,
          cashEarned: state.shiftStats.cashEarned + 50,
        }
      }));
    } else {
      await Haptics.vibrate();
    }
    deductEnergy(20);
    if (currentInstanceId) {
      removeCase(currentInstanceId);
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
      <div className={`min-h-screen bg-[#0d1117] text-white font-pixel flex p-2 gap-2 relative ${isShaking ? 'animate-shake bg-red-950/20' : ''}`}>
        
        {/* FLOATING TEXTS */}
        <AnimatePresence>
          {floatingTexts.map(ft => (
            <motion.div
              key={ft.id}
              initial={{ opacity: 1, y: ft.y, x: ft.x }}
              animate={{ opacity: 0, y: ft.y - 50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className={`absolute z-[100] font-bold text-2xl drop-shadow-md ${ft.type === 'good' ? 'text-[#a3e635]' : 'text-[#f87171]'}`}
              style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
            >
              {ft.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* LEFT PANEL: Portrait and Vitals */}
        <div className="w-[45%] flex flex-col gap-2">
          {/* Vitals Bar (ECG style) */}
          <div className="bg-[#161b22] border-2 border-[#30363d] rounded p-3 flex justify-between shadow-inner text-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
             <div className="flex flex-col items-center">
               <span className="text-[#1f6feb] uppercase text-xs">HR</span>
               <span className={`text-xl ${currentNode.vitals.hr > 110 || currentNode.vitals.hr < 40 ? 'text-[#f87171] animate-pulse' : 'text-[#a3e635]'}`}>{currentNode.vitals.hr}</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-[#1f6feb] uppercase text-xs">BP</span>
               <span className={`text-xl ${currentNode.vitals.bp.includes('0/0') || currentNode.vitals.bp.includes('70/40') ? 'text-[#f87171] animate-pulse' : 'text-[#a3e635]'}`}>{currentNode.vitals.bp}</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-[#1f6feb] uppercase text-xs">RR</span>
               <span className="text-xl text-[#a3e635]">{caseData.vitals?.rr?.value || 16}</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-[#1f6feb] uppercase text-xs">SpO2</span>
               <span className="text-xl text-[#a3e635]">{currentNode.vitals.o2}</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-[#1f6feb] uppercase text-xs">Temp</span>
               <span className="text-xl text-gray-300">{caseData.vitals?.temp?.value || 37.0} C</span>
             </div>
          </div>
          
          {/* Portrait */}
          <div className="flex-1 bg-black border-2 border-[#30363d] rounded flex flex-col overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
            <div className="flex-1 w-full bg-[#161b22] flex items-center justify-center relative overflow-hidden group">
               {/* Use the default assets for now depending on age/sex or just a generic one */}
               {caseData.patientAppearance?.ageGroup === 'child' ? (
                 <img src="/assets/patient.jpg" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform" />
               ) : (
                 <div className="text-[120px]">👤</div>
               )}
               
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>
            
            <div className="bg-[#0d1117] p-3 border-t-2 border-[#30363d] grid grid-cols-2 gap-2 text-sm">
               <div className="col-span-2">
                 <span className="text-gray-400">Name:</span> <span className="text-white">{caseData.title}</span>
               </div>
               <div>
                 <span className="text-gray-400">Sex:</span> <span className="text-white">{caseData.sex}</span>
               </div>
               <div>
                 <span className="text-gray-400">Age:</span> <span className="text-white">{caseData.age}</span>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Tabs & Content */}
        <div className="w-[55%] flex flex-col bg-[#161b22] border-2 border-[#30363d] rounded shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-[#0d1117] border-b-2 border-[#30363d] text-sm md:text-base">
             <button onClick={() => setActiveTab('info')} className={`px-2 md:px-4 py-3 flex-1 border-r border-[#30363d] transition-colors ${activeTab === 'info' ? 'bg-[#1f6feb] font-bold text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:bg-[#21262d]'}`}>👤 Info</button>
             <button onClick={() => setActiveTab('exam')} className={`px-2 md:px-4 py-3 flex-1 border-r border-[#30363d] transition-colors ${activeTab === 'exam' ? 'bg-[#1f6feb] font-bold text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:bg-[#21262d]'}`}>🩺 Exam</button>
             <button onClick={() => setActiveTab('labs')} className={`px-2 md:px-4 py-3 flex-1 border-r border-[#30363d] transition-colors ${activeTab === 'labs' ? 'bg-[#1f6feb] font-bold text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:bg-[#21262d]'}`}>🔬 Labs</button>
             <button onClick={() => setActiveTab('action')} className={`px-2 md:px-4 py-3 flex-1 transition-colors ${activeTab === 'action' ? 'bg-[#a3e635] text-black font-bold shadow-[inset_0_4px_0_rgba(255,255,255,0.4)]' : 'text-gray-400 hover:bg-[#21262d]'}`}>💉 Action</button>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 p-5 overflow-y-auto bg-[#0d1117] shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] relative">
             {activeTab === 'info' && (
                <div className="animate-in fade-in duration-200">
                  <h3 className="text-[#58a6ff] mb-2 font-bold border-b border-[#30363d] pb-1 uppercase tracking-widest text-sm">Complaint</h3>
                  <p className="mb-6 text-gray-200 leading-relaxed bg-[#161b22] p-3 rounded border border-[#21262d]">{caseData.chiefComplaint || 'No complaint recorded.'}</p>
                  
                  <h3 className="text-[#58a6ff] mb-2 font-bold border-b border-[#30363d] pb-1 uppercase tracking-widest text-sm">History of Present Illness</h3>
                  <p className="mb-6 text-gray-200 leading-relaxed bg-[#161b22] p-3 rounded border border-[#21262d]">{caseData.background || 'No background provided.'}</p>
                </div>
             )}
             
             {activeTab === 'exam' && (
                <div className="animate-in fade-in duration-200 space-y-3">
                  <h3 className="text-[#58a6ff] mb-4 font-bold border-b border-[#30363d] pb-1 uppercase tracking-widest text-sm">Physical Examination</h3>
                  {caseData.exam ? caseData.exam.map((e: any) => (
                    <div key={e.id} className={`p-3 rounded border ${e.abnormal ? 'bg-[#450a0a]/30 border-[#f87171]/50' : 'bg-[#161b22] border-[#21262d]'}`}>
                       <h4 className={`text-sm uppercase tracking-wide mb-1 ${e.abnormal ? 'text-[#f87171]' : 'text-[#a3e635]'}`}>{e.system}</h4>
                       <p className="text-gray-200">{e.finding}</p>
                    </div>
                  )) : <p className="text-gray-500">No examination data available.</p>}
                </div>
             )}
             
             {activeTab === 'labs' && (
                <div className="animate-in fade-in duration-200 space-y-3">
                  <h3 className="text-[#58a6ff] mb-4 font-bold border-b border-[#30363d] pb-1 uppercase tracking-widest text-sm">Investigations</h3>
                  {caseData.investigations ? caseData.investigations.map((l: any) => (
                    <div key={l.id} className={`p-3 rounded border ${l.abnormal ? 'bg-[#422006]/30 border-[#facc15]/50' : 'bg-[#161b22] border-[#21262d]'}`}>
                       <h4 className={`text-sm uppercase tracking-wide mb-1 ${l.abnormal ? 'text-[#facc15]' : 'text-[#58a6ff]'}`}>{l.name}</h4>
                       <p className="text-gray-200">{l.report || `${l.value} ${l.unit}`}</p>
                    </div>
                  )) : <p className="text-gray-500">No lab results available.</p>}
                </div>
             )}
             
             {activeTab === 'action' && (
                <div className="flex flex-col h-full animate-in fade-in duration-200">
                  <div className="bg-black/60 p-4 border-2 border-[#30363d] rounded-lg mb-4 min-h-[5rem] shadow-inner flex items-center justify-center">
                    <p className="text-lg text-center text-pixel-gold leading-relaxed">{currentNode.narrative}</p>
                  </div>
                  
                  <div className="flex flex-col gap-3 flex-1 justify-end">
                    {currentNode.options ? (
                      <>
                        {currentNode.options.map((opt: any) => {
                          const isLocked = xp < RANK_THRESHOLDS[opt.requiredRank];
                          return (
                            <button 
                              key={opt.id} 
                              onClick={() => handleAction(opt.targetNode, opt.requiredRank)}
                              disabled={isLocked}
                              className={`w-full py-4 px-4 text-left text-sm md:text-base font-bold rounded shadow-md border-2 transition-transform active:scale-95 flex justify-between items-center ${isLocked ? 'bg-[#21262d] border-[#30363d] text-gray-500 cursor-not-allowed' : 'bg-[#161b22] border-[#1f6feb] text-white hover:bg-[#1f6feb]'}`}
                            >
                              <span>{opt.text}</span>
                              {isLocked && <span className="text-xs border border-gray-600 px-2 py-1 rounded bg-black/50 text-gray-400 uppercase">Req: {opt.requiredRank}</span>}
                            </button>
                          );
                        })}
                        
                        {effectiveNodeId === startNodeId && (
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#30363d]">
                            <button className="bg-[#450a0a] hover:bg-[#7f1d1d] border-2 border-[#f87171] text-white py-3 px-2 text-xs rounded transition-colors uppercase tracking-wider font-bold" onClick={callAttending}>
                              {language === 'th' ? 'เรียกอาจารย์แพทย์ (-50% XP)' : 'Call Attending (-50% XP)'}
                            </button>
                            <button className="bg-[#172554] hover:bg-[#1e3a8a] border-2 border-[#60a5fa] text-white py-3 px-2 text-xs rounded transition-colors uppercase tracking-wider font-bold" onClick={requestConsult}>
                              {language === 'th' ? 'ปรึกษาแพทย์เวร (Consult)' : 'Ask Colleague (Consult)'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (() => {
                      const success = isNodeSuccessful(effectiveNodeId, currentNode);
                      return (
                        <button 
                          onClick={() => finishCase(success)}
                          className={`w-full py-5 font-bold uppercase tracking-widest rounded shadow-lg border-2 transition-transform active:scale-95 ${success ? 'bg-[#14532d] border-[#a3e635] text-white hover:bg-[#15803d]' : 'bg-[#7f1d1d] border-[#f87171] text-white hover:bg-[#991b1b]'}`}
                        >
                          {success 
                            ? (language === 'th' ? '✓ ผู้ป่วยปลอดภัย (บันทึกผล / ออกเวร)' : '✓ CASE RESOLVED: PATIENT STABILIZED')
                            : (language === 'th' ? '✗ ผู้ป่วยวิกฤต (ส่งต่อ / บันทึกผล)' : '✗ CASE CLOSED: PATIENT CRITICAL')}
                        </button>
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
    <Suspense fallback={<div className="min-h-screen bg-pixel-bg text-pixel-text flex items-center justify-center font-pixel">LOADING...</div>}>
      <CaseEngineContent params={params} />
    </Suspense>
  );
}
