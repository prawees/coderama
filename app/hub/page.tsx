"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { getLocalizedRankTitle, translate } from "@/lib/localization";
import { scheduleOnCallCases, cancelOnCallCases } from "@/lib/notifications";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { GameCanvas } from "@/components/game/GameCanvas";
import { Pager } from "@/components/ui/Pager";
import { useState, useRef } from "react";

import { PageTransition } from "@/components/ui/PageTransition";
import { audio } from "@/lib/audio";

export default function HubPage() {
  const router = useRouter();
  const { 
    shiftMode, setShiftMode, xp, lifetimeXp, currency, energy, maxEnergy, 
    clockMinutes, incrementClock, setClock, addCase, activeCases, resolveMissedCases,
    playerName, playerGender, language, isPendingPromotion, setPendingPromotion, deductEnergy, resetShiftStats
  } = useERStore();
  
  const { getRankFromXp, RANK_THRESHOLDS } = require('@/lib/erStore');
  const currentRankId = getRankFromXp(lifetimeXp || xp);
  const localizedRank = getLocalizedRankTitle(currentRankId, playerName, playerGender, language);
  
  // Calculate next rank threshold
  const thresholds = Object.values(RANK_THRESHOLDS) as number[];
  const nextThreshold = thresholds.find(t => t > (lifetimeXp || 0)) || (lifetimeXp || 0);
  const prevThreshold = [...thresholds].reverse().find(t => t <= (lifetimeXp || 0)) || 0;
  const progressPercent = Math.min(100, Math.max(0, ((lifetimeXp || 0) - prevThreshold) / (nextThreshold - prevThreshold) * 100));
  
  const [logs, setLogs] = useState<string[]>(['System: ER Dashboard initialized.']);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [pagerMessage, setPagerMessage] = useState<string | null>(null);
  
  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })} - ${msg}`]);
  };

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    resolveMissedCases();
  }, [resolveMissedCases]);

  // Shift Timer & Spawner Loop
  useEffect(() => {
    if (shiftMode === 'off-duty' || shiftMode === 'on-call') return;

    const timer = setInterval(() => {
      incrementClock(1); 
      // Boss battle drains energy passively faster
      if (shiftMode === 'boss-battle' && Math.random() > 0.5) {
        deductEnergy(1);
      }
    }, 1000);

    const spawner = setInterval(() => {
      if (shiftMode === 'boss-battle') {
         // BOSS BATTLE SCRIPT
         // Spawn 2 specific complex cases back to back if beds are free
         if (activeCases.length === 0 && clockMinutes < 300) {
            audio.playPager();
            addLog("BOSS BATTLE: INCOMING MASS CASUALTY!");
            
            // Spawn Trauma and Asthma simultaneously
            addCase({
              id: `boss_asthma_${Date.now()}`,
              caseDataId: "case_05_asthma",
              skinTone: "#e0ac69", shirtColor: "#f87171",
              receivedAt: Date.now(), expiresAt: Date.now() + 6 * 60 * 1000
            });
            setTimeout(() => {
              audio.playPager();
              addCase({
                id: `boss_trauma_${Date.now()}`,
                caseDataId: "case_06_trauma",
                skinTone: "#c68642", shirtColor: "#1f6feb",
                receivedAt: Date.now(), expiresAt: Date.now() + 4 * 60 * 1000
              });
            }, 2000);
         }
      } else {
         // NORMAL SHIFT SCRIPT
         if (activeCases.length < 3 && Math.random() > 0.5) {
            audio.playPager();
            addLog("Triage: New patient arrived at ER!");
            
            const possibleCases = ["case_01", "case_02_fluids", "case_03_cardiac", "case_04_svt", "case_05_asthma", "case_06_trauma"];
            const selectedCase = possibleCases[Math.floor(Math.random() * possibleCases.length)];
            
            // Pager logic
            if (selectedCase === "case_01") {
               setPagerMessage("*BEEP BEEP*\n28yo M - Toxicology");
            } else if (selectedCase === "case_02_fluids") {
               setPagerMessage("*BEEP BEEP*\n45yo F - Hypovolemic Shock");
            } else if (selectedCase === "case_03_cardiac") {
               setPagerMessage("*BEEP BEEP*\n55yo M - Cardiac Arrest");
            } else if (selectedCase === "case_04_svt") {
               setPagerMessage("*BEEP BEEP*\n35yo F - Palpitations");
            } else if (selectedCase === "case_05_asthma") {
               setPagerMessage("*BEEP BEEP*\n6yo M - Severe Wheezing");
            } else if (selectedCase === "case_06_trauma") {
               setPagerMessage("*BEEP BEEP*\n22yo M - Motorcycle Crash");
            }

            const skinTones = ["#ffc0cb", "#8d5524", "#c68642", "#e0ac69", "#f1c27d", "#ffdbac"];
            const shirtColors = ["#1f6feb", "#f87171", "#a3e635", "#facc15", "#c084fc"];

            addCase({
              id: `case_${Date.now()}`,
              caseDataId: selectedCase,
              skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
              shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
              receivedAt: Date.now(),
              expiresAt: Date.now() + 5 * 60 * 1000, 
            });
         }
      }
    }, 8000);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [shiftMode, activeCases.length, incrementClock, addCase, clockMinutes]);

  // Handle End of Shift or Pass Out
  useEffect(() => {
    if (shiftMode === 'on-shift' || shiftMode === 'boss-battle') {
      if (clockMinutes >= 540 || energy <= 0) { // 540 mins = 9 hours (8 AM to 5 PM)
        audio.playShiftEnd();
        
        // If boss battle passed!
        if (shiftMode === 'boss-battle' && energy > 0) {
           setPendingPromotion(false);
           addLog("BOSS DEFEATED! PROMOTION UNLOCKED!");
        }

        setShiftMode('off-duty');
        router.push('/summary'); // Will build this next
      }
    }
  }, [clockMinutes, energy, shiftMode, setShiftMode, router, setPendingPromotion]);

  const toggleOnCall = async () => {
    if (shiftMode === 'on-call') {
      await cancelOnCallCases();
      setShiftMode('off-duty');
    } else {
      await scheduleOnCallCases();
      setShiftMode('on-call');
    }
  };

  const startShift = () => {
    audio.playShiftStart();
    setClock(0);
    resetShiftStats();
    setShiftMode('on-shift');
    addLog(`${localizedRank} clocked in.`);
  };

  const startBossBattle = () => {
    audio.playShiftStart();
    setClock(0);
    resetShiftStats();
    setShiftMode('boss-battle');
    addLog(`PROMOTION EXAM STARTED! Good luck, ${localizedRank}.`);
  };

  const endShift = () => {
    setShiftMode('off-duty');
    router.push('/summary');
  };

  const formatClock = (mins: number) => {
    const hours = Math.floor(mins / 60) + 8; // Start at 08:00
    const m = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <PageTransition>
      <div 
        className="w-full h-[100dvh] flex flex-col font-pixel relative select-none touch-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, #29366f 0%, #1a1c2c 100%)",
        }}
      >
      <Pager message={pagerMessage} onClear={() => setPagerMessage(null)} />
      
      {shiftMode === 'on-shift' && (
        <div className="absolute top-4 right-4 z-50 flex items-center justify-center bg-black bg-opacity-80 px-4 py-2 rounded-lg border-2 border-red-900 shadow-2xl pointer-events-none">
          <span className="text-3xl text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] font-bold animate-pulse">
            {formatClock(clockMinutes)}
          </span>
        </div>
      )}

      {/* Top 60%: The Game World (PixiJS) */}
      <div className="relative h-[60%] w-full border-b-[4px] border-[#30363d]">
        <GameCanvas />
      </div>

      {/* Bottom 40%: The Dashboard / Control Center */}
      <div className="h-[40%] bg-[#0d1117] flex flex-col z-10 relative">
        {/* Top Bar of Dashboard (Stats) */}
        <div className="flex justify-between items-center bg-[#161b22] px-4 py-2 border-b-2 border-[#30363d]">
          <div className="flex flex-col gap-1 w-1/3">
            <p className="text-xs text-pixel-gold">{translate('current_rank', language)}: <span className="text-white text-sm">{localizedRank}</span></p>
            {isPendingPromotion ? (
              <p className="text-xs text-pixel-alert animate-pulse font-bold">PROMOTION READY!</p>
            ) : (
              <div className="w-full h-2 bg-black border border-gray-600 rounded">
                 <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end w-1/3">
             <div className="flex justify-between w-full text-xs text-pixel-alert mb-1">
               <span>{translate('energy', language)}</span>
               <span>{energy}/{maxEnergy}</span>
             </div>
             <div className="w-full h-2 bg-black border border-white">
               <div className="h-full bg-pixel-success transition-all duration-300" style={{ width: `${(energy/maxEnergy)*100}%` }}></div>
             </div>
          </div>
        </div>

        {/* Dashboard Main Area: Split Log and Actions */}
        <div 
          className="flex-1 flex p-2 gap-2 overflow-hidden"
          style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}
        >
          {/* Status Log (Left) */}
          <div className="flex-1 bg-black border-2 border-gray-700 rounded p-3 overflow-y-auto flex flex-col text-[11px] leading-relaxed space-y-1 font-mono relative shadow-inner">
            <div className="fixed inset-0 pointer-events-none opacity-20" style={{ background: 'repeating-linear-gradient(transparent, transparent 2px, #000 2px, #000 4px)' }}></div>
            {logs.map((log, i) => (
              <div key={i} className={`z-10 relative ${log.includes('Triage') ? 'text-green-400 font-bold' : 'text-green-700'}`}>
                {'>'} {log}
              </div>
            ))}
            <div ref={logEndRef} className="h-4" />
          </div>

          {/* Action Panel (Right) */}
          <div className="w-1/3 flex flex-col gap-2">
            <div className="flex justify-between bg-black p-2 border border-gray-700 rounded text-xs">
               <span className="text-pixel-text-muted">XP: {xp}</span>
               <span className="text-pixel-success">${currency}</span>
            </div>
            
            {shiftMode === 'on-shift' || shiftMode === 'boss-battle' ? (
              <PixelButton onClick={endShift} variant="alert" className="py-4 text-sm shadow-lg">
                {shiftMode === 'boss-battle' ? 'SURRENDER' : translate('end_shift', language)}
              </PixelButton>
            ) : isPendingPromotion ? (
              <PixelButton onClick={startBossBattle} variant="alert" className="py-4 text-sm shadow-[0_0_15px_rgba(255,0,0,0.5)] animate-pulse">
                TAKE EXAM
              </PixelButton>
            ) : (
              <PixelButton onClick={startShift} variant="primary" className="py-4 text-sm shadow-lg">
                {translate('start_shift', language)}
              </PixelButton>
            )}
            
            <PixelButton 
              onClick={toggleOnCall} 
              variant={shiftMode === 'on-call' ? 'success' : 'primary'}
              className="py-3 text-xs"
            >
              {shiftMode === 'on-call' ? (language === 'th' ? 'เข้าเวร On-Call: เปิด' : 'ON CALL: ACTIVE') : (language === 'th' ? 'เตรียมรับเวร' : 'GO ON CALL')}
            </PixelButton>
            
            <div className="flex gap-2 mt-auto">
              <PixelButton onClick={() => router.push('/profile')} variant="primary" className="py-3 flex-1 text-xs">{language === 'th' ? 'ชุด' : 'DRESS'}</PixelButton>
              <PixelButton onClick={() => router.push('/hub/shop')} variant="gold" className="py-3 flex-1 text-xs">{translate('shop', language)}</PixelButton>
              <PixelButton onClick={() => router.push('/hub/skills')} variant="success" className="py-3 flex-1 text-xs">{translate('skills', language)}</PixelButton>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}
