"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useERStore, getEra } from "@/lib/erStore";
import { getLocalizedRankTitle, translate } from "@/lib/localization";
import { scheduleOnCallCases, cancelOnCallCases } from "@/lib/notifications";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { MapData } from "@/components/game/Engine2D";
import { PixiEngine2D } from "@/components/game/PixiEngine2D";
import { MAPS } from "@/lib/maps";
import { Pager } from "@/components/ui/Pager";
import { DialogueBox } from "@/components/game/DialogueBox";
import { QuestsModal } from "@/components/game/QuestsModal";
import { LeaderboardModal } from "@/components/game/LeaderboardModal";
import { ConsultsModal } from "@/components/game/ConsultsModal";
import { SettingsMenu } from "@/components/game/SettingsMenu";
import { STORY_CAMPAIGN, CutsceneNode, CutsceneChoice } from "@/lib/StoryManager";
import { STORY_CAMPAIGN_TH } from "@/lib/StoryManagerTH";
import { audio } from "@/lib/audio";
import { music, TrackId } from "@/lib/music";
import { AnimatePresence } from "framer-motion";

export default function HubPage() {
  const router = useRouter();
  const { 
    shiftMode, setShiftMode, xp, lifetimeXp, currency, energy, maxEnergy, 
    clockMinutes, incrementClock, setClock, addCase, activeCases, resolveMissedCases,
    playerName, playerGender, language, setPendingPromotion, deductEnergy, resetShiftStats,
    tutorialCompleted, completeTutorial, updateFriendship, friendships,
    activeQuests, completedQuests, startQuest, completeQuest, restoreEnergy,
    currentDay, incrementDay, inventory, removeFromInventory, setStoryFlag, addKarma, addXp, forcePromote, storyFlags,
    hospitalUpgrades
  } = useERStore();
  
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);
  
  const { getRankFromXp, RANK_THRESHOLDS } = require('@/lib/erStore');
  const currentRankId = getRankFromXp(lifetimeXp || xp);
  const localizedRank = getLocalizedRankTitle(currentRankId, playerName, playerGender, language);
  
  // Calculate next rank threshold
  const thresholds = Object.values(RANK_THRESHOLDS) as number[];
  const nextThresholds = thresholds.filter((t: number) => t > lifetimeXp);
  const nextThreshold = nextThresholds.length > 0 ? Math.min(...nextThresholds) : Infinity;
  
  // They are ready to take the End of Year Test if their lifetimeXp is capped just below the threshold!
  const isReadyForPromotion = lifetimeXp >= nextThreshold - 1;
  const prevThreshold = [...thresholds].reverse().find(t => t <= (lifetimeXp || 0)) || 0;
  const progressPercent = Math.min(100, Math.max(0, ((lifetimeXp || 0) - prevThreshold) / (nextThreshold === Infinity ? prevThreshold : nextThreshold - prevThreshold) * 100));
  
  const [logs, setLogs] = useState<string[]>(['System: ER Dashboard initialized.']);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isConsultsOpen, setIsConsultsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [pagerMessage, setPagerMessage] = useState<string | null>(null);
  const [currentMap, setCurrentMap] = useState<string>('ER_MAIN');
  const [spawnPos, setSpawnPos] = useState<{x: number, y: number} | undefined>(undefined);
  const [dialogueQueue, setDialogueQueue] = useState<CutsceneNode[]>([]);
  const [caseToInject, setCaseToInject] = useState<string | null>(null);
  const [actionOnDialogueEnd, setActionOnDialogueEnd] = useState<'START_SHIFT' | 'END_SHIFT' | 'PRESTIGE' | null>(null);
  const prevCasesCount = useRef<number | null>(null);
  const triggeredEvents = useRef<Set<number>>(new Set());
  const [isPowerOutage, setIsPowerOutage] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'LOGS'>('ACTIONS');
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const fastForwardTarget = useRef<number | null>(null);

  const currentEra = getEra(currentDay);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })} - ${msg}`]);
  };

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    resolveMissedCases();
  }, [resolveMissedCases]);

  // Phase 75: Dynamic Generative Music & SFX
  useEffect(() => {
    if (prevCasesCount.current === null) {
       prevCasesCount.current = activeCases.length;
       return;
    }
    
    if (activeCases.length > prevCasesCount.current) {
        audio.playPager();
    }
    prevCasesCount.current = activeCases.length;

    let targetTrack: TrackId | null = null;
    const isEmergency = activeCases.length > 0;

    if (shiftMode === 'on-shift' || shiftMode === 'boss-battle') {
      if (activeCases.length > 2) {
         targetTrack = 'the_void'; // Overwhelmed
      } else if (activeCases.length > 0) {
         targetTrack = 'deep_mines'; // Active tense cases
      } else {
         // Idle on-shift
         if (clockMinutes < 240) targetTrack = 'sunrise'; // Morning (8am - 12pm)
         else if (clockMinutes > 420) targetTrack = 'nightfall'; // Night (3pm - 5pm+)
         else targetTrack = 'wandering'; // Afternoon (12pm - 3pm)
      }
    } else {
       targetTrack = 'first_house'; // Pre-shift / Hub
    }

    const currentTrack = music.getCurrentTrack();
    
    if (currentTrack === targetTrack) return; // No change needed

    // If entering an idle state from a different track, 30% chance to just enjoy silence
    // By grouping clockMinutes, we don't spam this random roll every minute.
    if (!isEmergency && currentTrack !== targetTrack && targetTrack !== null) {
        if (Math.random() < 0.3) {
            targetTrack = null;
        }
    }

    music.fadeToTrack(targetTrack, 4.0); // 4 second smooth crossfade
  }, [shiftMode, activeCases.length, Math.floor(clockMinutes / 120)]);

  useEffect(() => {
    if (!tutorialCompleted) {
      audio.playPAChime();
      setDialogueQueue([
        { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `ยินดีต้อนรับสู่ Code Rama ER, ${localizedRank}.` : `Welcome to Code Rama ER, ${localizedRank}.` },
        { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `เตรียมตัวพบกับ 'เวรเยิน' ของจริง คืนนี้คุณต้องเข้าเวร 36 ชั่วโมงต่อเนื่อง แถมเครื่องชงกาแฟก็เพิ่งพัง` : `Get ready for a real 'Ward Wen Yern' (brutal shift). You're on a 36-hour call and the coffee machine is broken.` },
        { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `เคสที่คุณจะเจออ้างอิงตามเกณฑ์สอบใบประกอบวิชาชีพ (NL) ทุกเคส เพราะฉะนั้นตั้งใจรักษาล่ะ!` : `Every case you see here is mapped to the National License (NL) exam blueprints. So pay attention!` },
        { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `เมื่อเพจเจอร์ดัง ให้เดินไปที่เตียงแล้วกด 'A' เพื่อเริ่มรักษา อย่าปล่อยให้คนไข้รอนานจนหมดสติ` : `When the pager beeps, walk to the bed and press 'A' to treat. Don't let them pass out.` },
        { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `ขอให้โชคดีนะ... คุณต้องใช้มันแน่` : `Good luck... you'll need it.` }
      ]);
    }
    
    // Start First Shift quest
    if (tutorialCompleted && !activeQuests.includes('q_first_shift') && !completedQuests.includes('q_first_shift')) {
      startQuest('q_first_shift');
    }
  }, [tutorialCompleted, localizedRank, activeQuests, completedQuests, startQuest]);

  const handleDialogueComplete = (choice?: CutsceneChoice) => {
    // Process effects
    if (choice) {
       if (choice.karmaEffect) addKarma(choice.karmaEffect);
       if (choice.flagEffect) setStoryFlag(choice.flagEffect, true);
       if (choice.xpEffect) addXp(choice.xpEffect);
    }
    
    // Determine next node ID
    const nextNodeId = choice?.nextId || dialogueQueue[0]?.nextId;
    
    setDialogueQueue(prev => {
      let next: CutsceneNode[] = [];
      
      if (nextNodeId) {
         // Search the campaign data to jump to nextNodeId
         const campaignData = language === 'th' ? STORY_CAMPAIGN_TH[currentDay] : STORY_CAMPAIGN[currentDay];
         
         const searchAndSlice = (arr: CutsceneNode[] | undefined) => {
             if (!arr) return null;
             const idx = arr.findIndex(n => n.id === nextNodeId);
             if (idx !== -1) return arr.slice(idx);
             return null;
         };
         
         let jumpedNext = searchAndSlice(campaignData?.startOfDayCutscene) || searchAndSlice(campaignData?.endOfDayCutscene);
         if (!jumpedNext && campaignData?.midShiftEvents && campaignData.midShiftEvents.length > 0) {
             if ('text' in campaignData.midShiftEvents[0]) {
                 jumpedNext = searchAndSlice(campaignData.midShiftEvents as CutsceneNode[]);
             } else {
                 for (const event of campaignData.midShiftEvents as any[]) {
                     jumpedNext = searchAndSlice(event.cutscene);
                     if (jumpedNext) break;
                 }
             }
         }
         
         if (jumpedNext) {
             next = jumpedNext;
         } else {
             next = prev.slice(1);
         }
      } else {
         next = prev.slice(1);
      }
      
      // Auto-resolve router nodes
      while (next.length > 0 && next[0].speaker === 'System' && next[0].id?.endsWith('_check')) {
          const routerNode = next[0];
          let chosenNextId: string | undefined = undefined;
          
          if (routerNode.choices) {
              const flags = useERStore.getState().storyFlags;
              for (const c of routerNode.choices) {
                  if (c.text.startsWith('[IF_FLAG:')) {
                      const flagMatch = c.text.match(/\[IF_FLAG:(.*?)\]/);
                      if (flagMatch && flags[flagMatch[1]]) {
                          chosenNextId = c.nextId;
                          break;
                      }
                  } else if (c.text.startsWith('[IF_NOT_FLAG:')) {
                      const flagMatch = c.text.match(/\[IF_NOT_FLAG:(.*?)\]/);
                      if (flagMatch && !flags[flagMatch[1]]) {
                          chosenNextId = c.nextId;
                          break;
                      }
                  } else if (c.text.startsWith('[ELSE]')) {
                      chosenNextId = c.nextId;
                      break;
                  }
              }
          }
          
          if (chosenNextId) {
             const campaignData = STORY_CAMPAIGN[currentDay];
             const searchAndSlice = (arr: CutsceneNode[] | undefined) => {
                 if (!arr) return null;
                 const idx = arr.findIndex(n => n.id === chosenNextId);
                 if (idx !== -1) return arr.slice(idx);
                 return null;
             };
             
             let jumpedNext = searchAndSlice(campaignData?.startOfDayCutscene) || searchAndSlice(campaignData?.endOfDayCutscene);
             if (!jumpedNext && campaignData?.midShiftEvents && campaignData.midShiftEvents.length > 0) {
                 if ('text' in campaignData.midShiftEvents[0]) {
                     jumpedNext = searchAndSlice(campaignData.midShiftEvents as CutsceneNode[]);
                 } else {
                     for (const event of campaignData.midShiftEvents as any[]) {
                         jumpedNext = searchAndSlice(event.cutscene);
                         if (jumpedNext) break;
                     }
                 }
             }
             
             if (jumpedNext) {
                 next = jumpedNext;
             } else {
                 next = next.slice(1);
             }
          } else {
             next = next.slice(1);
          }
      }
      
      if (next.length === 0) {
        if (!tutorialCompleted) {
          completeTutorial();
        }
        if (actionOnDialogueEnd === 'START_SHIFT') {
          executeStartShift();
          setActionOnDialogueEnd(null);
        } else if (actionOnDialogueEnd === 'END_SHIFT') {
          executeEndShift();
          setActionOnDialogueEnd(null);
        } else if (actionOnDialogueEnd === 'PRESTIGE') {
          const state = useERStore.getState();
          let perk = 'legacy_unknown';
          if (state.storyFlags['prestige_wealth']) perk = 'legacy_wealth';
          if (state.storyFlags['prestige_knowledge']) perk = 'legacy_knowledge';
          
          useERStore.getState().prestige(perk);
          
          if (perk === 'legacy_wealth') useERStore.getState().addCurrency(5000);
          if (perk === 'legacy_knowledge') useERStore.getState().addXp(5000);
          
          addLog("PRESTIGE COMPLETE. A new legacy begins.");
          setActionOnDialogueEnd(null);
        }
        
        setIsCinematic(false);
        
        if (caseToInject) {
           const skinTones = ["#ffc0cb", "#8d5524", "#c68642", "#e0ac69", "#f1c27d", "#ffdbac"];
           const shirtColors = ["#1f6feb", "#f87171", "#a3e635", "#facc15", "#c084fc"];
           addCase({
             id: `case_${Date.now()}`,
             caseDataId: caseToInject,
             skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
             shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
             receivedAt: Date.now(),
             expiresAt: Date.now() + 5 * 60 * 1000,
           });
           setCaseToInject(null);
           audio.playPager();
        }
      }
      return next;
    });
  };


  useEffect(() => {
     if (isFastForwarding) {
        if (activeCases.length > 0) {
           setIsFastForwarding(false);
           fastForwardTarget.current = null;
        } else if (fastForwardTarget.current !== null && clockMinutes >= fastForwardTarget.current) {
           setIsFastForwarding(false);
           fastForwardTarget.current = null;
        }
     }
  }, [isFastForwarding, activeCases.length, clockMinutes]);

  // Shift Timer & Spawner Loop
  useEffect(() => {
    if (shiftMode === 'off-duty' || shiftMode === 'on-call') return;
    if (dialogueQueue.length > 0) return; // Pause game during cutscenes

    const tickRate = isFastForwarding ? 20 : 1000;
    const spawnRate = isFastForwarding ? 160 : 8000;

    const timer = setInterval(() => {
      incrementClock(1); 
      const state = useERStore.getState();
      
      // Boss battle drains energy passively faster
      if (shiftMode === 'boss-battle' && Math.random() > 0.5) {
        deductEnergy(1);
      }
      
      // Stage 3 Polish: Chaos Events (Power Outage)
      if (state.clockMinutes === 200 && Math.random() < 0.3 && !isPowerOutage) {
         setIsPowerOutage(true);
         audio.playBump();
         addLog("WARNING: POWER OUTAGE DETECTED! Emergency generators kicking in.");
      }
      if (state.clockMinutes === 260 && isPowerOutage) {
         setIsPowerOutage(false);
         audio.playShiftStart();
         addLog("Power restored.");
      }
      
    }, tickRate);

    const spawner = setInterval(() => {
      const state = useERStore.getState();
      if (shiftMode === 'boss-battle') {
         // BOSS BATTLE SCRIPT
         if (state.activeCases.length === 0 && state.clockMinutes < 300) {
            audio.playPager();
            addLog("BOSS BATTLE: INCOMING MASS CASUALTY!");
            
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
         let maxCases = 3;
         let spawnChance = 0.5;
         let possibleCases = ["case_01", "case_02_fluids", "case_03_cardiac"];
         
         if (currentEra === 'MED_Y5') {
            maxCases = 2; spawnChance = 0.3; possibleCases = ["case_01", "case_02_fluids"];
         } else if (currentEra === 'MED_Y6') {
            maxCases = 5; spawnChance = 0.8; possibleCases = ["case_01", "case_02_fluids", "case_06_trauma"];
         } else if (currentEra === 'INTERN') {
            maxCases = 3; spawnChance = 0.5; possibleCases = ["case_03_cardiac", "case_07", "case_08", "case_10"];
         } else if (currentEra === 'RESIDENT' || currentEra === 'PROFESSOR') {
            maxCases = 4; spawnChance = 0.7; possibleCases = ["case_06_trauma", "case_03_cardiac", "case_08", "case_09", "case_11"];
         }

         const campaignData = STORY_CAMPAIGN[currentDay];
         if (campaignData && campaignData.cases && campaignData.cases.length > 0) {
            possibleCases = campaignData.cases;
         }
         
         if (state.activeCases.length < maxCases && Math.random() < spawnChance) {
            audio.playPager();
            addLog("Triage: New patient arrived at ER!");
            const selectedCase = possibleCases[Math.floor(Math.random() * possibleCases.length)];
            
            if (selectedCase === "case_01") setPagerMessage("*BEEP BEEP*\n28yo M - Toxicology");
            else if (selectedCase === "case_02_fluids") setPagerMessage("*BEEP BEEP*\n45yo F - Hypovolemic Shock");
            else if (selectedCase === "case_03_cardiac") setPagerMessage("*BEEP BEEP*\n55yo M - Cardiac Arrest");
            else if (selectedCase === "case_04_svt") setPagerMessage("*BEEP BEEP*\n35yo F - Palpitations");
            else if (selectedCase === "case_05_asthma") setPagerMessage("*BEEP BEEP*\n6yo M - Severe Wheezing");
            else if (selectedCase === "case_06_trauma") setPagerMessage("*BEEP BEEP*\n22yo M - Motorcycle Crash");
            else if (selectedCase === "case_07" || selectedCase === "case_07_vip") setPagerMessage("*BEEP BEEP*\n55yo M - Chest Pain (VIP)");
            else if (selectedCase === "case_08") setPagerMessage("*BEEP BEEP*\n19yo F - DKA");
            else if (selectedCase === "case_09") setPagerMessage("*BEEP BEEP*\nAnaphylaxis");
            else if (selectedCase === "case_10") setPagerMessage("*BEEP BEEP*\nSepsis Protocol");
            else if (selectedCase === "case_11") setPagerMessage("*BEEP BEEP*\nComplex Trauma");
            else setPagerMessage(`*BEEP BEEP*\nNew Patient (${selectedCase})`);

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
    }, spawnRate);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [shiftMode, activeCases.length, currentEra, currentDay, isFastForwarding, dialogueQueue.length]);

  // Story Events Check
  useEffect(() => {
    if (shiftMode === 'off-duty' || shiftMode === 'on-call') return;
    if (dialogueQueue.length > 0) return;

    const campaignData = STORY_CAMPAIGN[currentDay];
    if (campaignData?.midShiftEvents && campaignData.midShiftEvents.length > 0) {
       let eventNode = null;
       let targetCutscene: CutsceneNode[] = [];
       let targetCase: string | undefined = undefined;

       if ('text' in campaignData.midShiftEvents[0]) {
          if (clockMinutes === 240) {
             eventNode = true;
             targetCutscene = campaignData.midShiftEvents as CutsceneNode[];
          }
       } else {
          const event = (campaignData.midShiftEvents as any[]).find(e => e.triggerMinute === clockMinutes);
          if (event) {
             eventNode = event;
             targetCutscene = event.cutscene;
             targetCase = event.injectCase;
          }
       }

       if (eventNode && !triggeredEvents.current.has(clockMinutes)) {
          triggeredEvents.current.add(clockMinutes);
          setDialogueQueue(targetCutscene);
          if (targetCase) setCaseToInject(targetCase);
       }
    }
  }, [clockMinutes, shiftMode, dialogueQueue.length, currentDay]);

  // Handle End of Shift or Pass Out
  useEffect(() => {
    if (shiftMode === 'on-shift' || shiftMode === 'boss-battle') {
      if (clockMinutes >= 540 || energy <= 0) { // 540 mins = 9 hours (8 AM to 5 PM)
        audio.playShiftEnd();
        audio.stopAmbientHum();
        
        // If boss battle passed!
        if (shiftMode === 'boss-battle' && energy > 0) {
           forcePromote();
           
           if (getRankFromXp(lifetimeXp) === 'Prof') {
             setDialogueQueue([
               { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: "You have reached the pinnacle of medicine. You are now the Chief of Medicine!" },
               { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: "Will you retire and start a new legacy, passing on your knowledge to the next generation?", choices: [
                  { text: "Legacy of Wealth (Start with 5000 Cash)", nextId: "legacy_wealth", flagEffect: "prestige_wealth" },
                  { text: "Legacy of Knowledge (Start with 5000 XP)", nextId: "legacy_knowledge", flagEffect: "prestige_knowledge" }
               ]}
             ]);
             setActionOnDialogueEnd('PRESTIGE');
           } else {
             addLog(language === 'th' ? "เอาชนะบอสได้แล้ว! ปลดล็อกการเลื่อนขั้น!" : "BOSS DEFEATED! PROMOTION UNLOCKED!");
             setDialogueQueue([
               { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `ยอดเยี่ยมมากวันนี้ คุณรับมือกับเหตุการณ์ผู้ป่วยจำนวนมากได้อย่างไร้ที่ติ` : `Incredible work today. You handled that mass casualty event flawlessly.` },
               { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `ผมขออนุมัติการเลื่อนขั้นของคุณอย่างเป็นทางการ` : `I am officially authorizing your promotion.` },
               { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: language === 'th' ? `ขอแสดงความยินดีกับตำแหน่งใหม่ของคุณ!` : `Congratulations on your new rank!` },
             ]);
           }
        } else {
           // Normal shift ended
           const campaignData = language === 'th' ? STORY_CAMPAIGN_TH[currentDay] : STORY_CAMPAIGN[currentDay];
           if (campaignData && campaignData.endOfDayCutscene) {
             setDialogueQueue(campaignData.endOfDayCutscene);
             setActionOnDialogueEnd('END_SHIFT');
             return;
           }
        }
        
        executeEndShift();
      }
    }
  }, [clockMinutes, energy, shiftMode, setShiftMode, router, setPendingPromotion, currentDay]);

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
    audio.playClick();
    const campaignData = language === 'th' ? STORY_CAMPAIGN_TH[currentDay] : STORY_CAMPAIGN[currentDay];
    if (campaignData && campaignData.startOfDayCutscene) {
      setDialogueQueue(campaignData.startOfDayCutscene);
      setActionOnDialogueEnd('START_SHIFT');
    } else {
      executeStartShift();
    }
  };

  const executeStartShift = () => {
    audio.playShiftStart();
    audio.playAmbientHum();
    setClock(0);
    resetShiftStats();
    setShiftMode('on-shift');
    
    // Apply Upgrades
    if (hospitalUpgrades.includes('upg_espresso')) {
      restoreEnergy(10);
      addLog(`${localizedRank} clocked in for Day ${currentDay}. (Espresso: +10 Energy)`);
    } else {
      addLog(`${localizedRank} clocked in for Day ${currentDay}.`);
    }
  };

  const executeEndShift = () => {
    audio.playShiftEnd();
    audio.stopAmbientHum();
    setShiftMode('off-duty');
    incrementDay();
    router.push('/summary');
  };

  const startBossBattle = () => {
    audio.playShiftStart();
    audio.playAmbientHum();
    setClock(0);
    resetShiftStats();
    setShiftMode('boss-battle');
    addLog(`PROMOTION EXAM STARTED! Good luck, ${localizedRank}.`);
  };

  const handleInteract = (id: string, type: string) => {
    if (type === 'bed') {
      const bedIndex = parseInt(id.replace('bed_', '')) - 1;
      const activeCase = activeCases.find(c => c.bedIndex === bedIndex);
      if (activeCase) {
        audio.playClick();
        router.push(`/simulator/play/${activeCase.caseDataId}?instanceId=${activeCase.id}`);
      } else {
        addLog(`Bed is empty.`);
      }
    } else if (type === 'npc') {
      audio.playClick();
      
      if (id === 'grump_npc') {
         setDialogueQueue([
           { speaker: "Dr. Grump", text: `Don't bother me, ${localizedRank}. I'm on my break. Go see patients!` }
         ]);
         return;
      }
      
      const currentHearts = friendships['nurse_ann'] || 0;
      
      if (inventory.includes('special_coffee')) {
         // Gift flow
         removeFromInventory('special_coffee');
         updateFriendship('nurse_ann', 1);
         addLog(`You gave Nurse Ann a Specialty Coffee! (Hearts +1)`);
         
         const newHearts = currentHearts + 1;
         
         if (newHearts === 2) {
           setIsCinematic(true);
           setDialogueQueue([
             { speaker: "Nurse Ann", portrait: "/assets/nurse_sprite.png", text: `This is exactly what I needed! You're really thoughtful.` },
             { speaker: "Nurse Ann", portrait: "/assets/nurse_sprite.png", text: `I was actually having a really rough day... we lost a patient this morning.` },
             { speaker: "Nurse Ann", portrait: "/assets/nurse_sprite.png", text: `But this helps. Thank you.` },
             { speaker: "System", text: `Nurse Ann's friendship increased to ${newHearts} hearts!` }
           ]);
           addLog(`Heart Event Triggered: The Rough Day`);
         } else if (newHearts === 4) {
           setIsCinematic(true);
           setDialogueQueue([
             { speaker: "Nurse Ann", portrait: "/assets/nurse_sprite.png", text: `You always know how to cheer me up. I'm glad we're working together.` },
             { speaker: "Nurse Ann", portrait: "/assets/nurse_sprite.png", text: `In this hospital, it's easy to burn out. But having someone like you around makes it bearable.` },
             { speaker: "System", text: `Nurse Ann's friendship increased to ${newHearts} hearts!` }
           ]);
           addLog(`Heart Event Triggered: Close Coworkers!`);
         } else {
           setDialogueQueue([
             { speaker: "Nurse Ann", portrait: "/assets/nurse_sprite.png", text: `Oh wow, is this coffee for me? Thank you so much, ${localizedRank}!` },
             { speaker: "System", text: `Nurse Ann's friendship increased to ${newHearts} hearts!` }
           ]);
         }
         
         if (newHearts >= 2 && activeQuests.includes('q_social_butterfly')) {
           completeQuest('q_social_butterfly');
           addLog("Quest Completed: Social Butterfly!");
         }
      } else {
         // Standard chat flow
         let dialogText = `Oh, hi ${localizedRank}. It's so busy today!`;
         if (currentHearts >= 2) dialogText = `Thanks for all your hard work today. We really appreciate it!`;
         if (currentHearts >= 4) dialogText = `You're one of my favorite doctors to work with! Keep it up!`;
         
         setDialogueQueue([
           { speaker: "Nurse Ann", portrait: "/assets/nurse_sprite.png", text: dialogText }
         ]);
      }
      
      if (currentHearts >= 2 && activeQuests.includes('q_social_butterfly')) {
        completeQuest('q_social_butterfly');
        addLog("Quest Completed: Social Butterfly!");
      }
    } else if (id === 'leaderboard') {
      audio.playClick();
      setIsLeaderboardOpen(true);
    } else if (id === 'consults') {
      audio.playClick();
      setIsConsultsOpen(true);
    }
  };

  const handleDoor = (target: string) => {
    addLog(`Traveling to ${target}...`);
    if (target === 'AMBULANCE_BAY') {
      setSpawnPos({ x: 7, y: 1 });
    } else if (target === 'ER_MAIN') {
      setSpawnPos({ x: 7, y: 8 });
    } else {
      setSpawnPos(undefined);
    }
    setCurrentMap(target);
  };

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60) + 8;
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

      {/* Top: Game Area */}
      <div className="relative h-[60%] w-full border-b-[4px] border-[#30363d] overflow-hidden bg-black flex items-center justify-center">
        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
          <PixelButton onClick={() => router.push('/hub/shop')} variant="secondary" className="px-2.5 py-1.5 text-xs bg-black/80 border-amber-500/60 hover:border-amber-400 text-amber-300 shadow-md">
            🛒 SHOP
          </PixelButton>
          <PixelButton onClick={() => router.push('/profile')} variant="secondary" className="px-2.5 py-1.5 text-xs bg-black/80 border-blue-500/60 hover:border-blue-400 text-blue-300 shadow-md">
            🪪 BADGE
          </PixelButton>
          <PixelButton onClick={() => setIsSettingsOpen(true)} variant="secondary" className="px-2.5 py-1.5 text-xs bg-black/80 shadow-md">
            ⚙️
          </PixelButton>
        </div>
        
        <div className="w-full h-full bg-black overflow-hidden relative shadow-inner">
            <PixiEngine2D 
              mapData={MAPS[currentMap]} 
              onInteract={handleInteract} 
              onDoor={handleDoor} 
              activeCases={activeCases} 
              clockMinutes={clockMinutes}
              spawnPos={spawnPos}
              era={getEra(lifetimeXp)}
              npcEmote={friendships['nurse_ann'] >= 4 ? "❤️" : null}
              currentDay={currentDay}
              isFastForwarding={isFastForwarding}
            />
            
            {/* Power Outage Overlay */}
            {isPowerOutage && (
              <div className="absolute inset-0 pointer-events-none z-[60]" style={{
                 background: `radial-gradient(circle at center, transparent 10%, rgba(0,0,0,0.9) 60%)`
              }} />
            )}
        </div>
        
        {shiftMode !== 'on-shift' && shiftMode !== 'boss-battle' && (
          <div className="absolute top-4 left-4 z-50 bg-black/70 backdrop-blur-md p-4 rounded-xl border-2 border-[#30363d] shadow-lg pointer-events-none">
            <span className="text-4xl block mb-2 text-center animate-pulse">🏥</span>
            <p className="text-white font-bold text-lg">Code Rama Hospital</p>
            <p className="text-xs mt-1 text-[#8b949e]">Waiting for shift to begin...</p>
          </div>
        )}
        
        {dialogueQueue.length > 0 && (
          <DialogueBox 
            speakerName={dialogueQueue[0].speaker}
            text={dialogueQueue[0].text}
            portraitUrl={dialogueQueue[0].portrait}
            choices={dialogueQueue[0].choices}
            onComplete={handleDialogueComplete}
          />
        )}

        {/* Cinematic Letterbox */}
        <div className={`absolute top-0 left-0 w-full h-24 bg-black transition-transform duration-1000 z-40 ${isCinematic ? 'translate-y-0' : '-translate-y-full'}`} />
        <div className={`absolute bottom-0 left-0 w-full h-24 bg-black transition-transform duration-1000 z-40 ${isCinematic ? 'translate-y-0' : 'translate-y-full'}`} />
      </div>

      {/* Bottom 40%: The Dashboard */}
      <div className="h-[40%] bg-[#0d1117] flex flex-col z-10 relative shadow-[0_-10px_30px_rgba(0,0,0,0.8)] border-t-4 border-[#30363d]">
        <div className="flex justify-between items-center bg-[#161b22] px-4 py-3 border-b-4 border-[#21262d] shadow-inner">
              <div className="flex flex-col gap-1 w-1/3">
                <p className="text-xs text-[#d29922] drop-shadow-md">{translate('current_rank', language)}: <span className="text-white text-sm font-bold ml-1">{localizedRank}</span></p>
                {isReadyForPromotion ? (
                  <p className="text-xs text-[#da3633] animate-pulse font-bold tracking-widest">PROMOTION READY!</p>
                ) : (
                  <div className="w-full h-3 bg-black border-2 border-[#30363d] rounded-full cursor-pointer shadow-inner overflow-hidden" onClick={() => setIsQuestsOpen(true)}>
                    <div className="h-full bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                )}
                <button 
                  onClick={() => setIsQuestsOpen(true)}
                  className="mt-1 text-[10px] text-gray-400 hover:text-white hover:underline text-left transition-colors"
                >
                  View Quests ({activeQuests.length})
                </button>
              </div>
          
          {/* Dashboard Tabs Toggle */}
          <div className="flex gap-2 bg-black/50 p-1 rounded-lg border-2 border-[#30363d]">
            <button 
              onClick={() => setActiveTab('ACTIONS')}
              className={`px-3 py-1 text-xs rounded font-bold transition-colors ${activeTab === 'ACTIONS' ? 'bg-[#1f6feb] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              ACTIONS
            </button>
            <button 
              onClick={() => setActiveTab('LOGS')}
              className={`px-3 py-1 text-xs rounded font-bold transition-colors flex items-center gap-1 ${activeTab === 'LOGS' ? 'bg-[#2ea043] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              LOGS
              {logs.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </button>
          </div>
          
          <div className="flex flex-col items-end w-1/3">
            <span className="text-2xl text-white font-bold drop-shadow-md tracking-wider">{formatTime(clockMinutes)}</span>
            <div className="flex items-center gap-2 w-28 mt-1">
              <span className="text-xs text-[#8b949e] font-bold">EN</span>
              <div className="w-full h-3 bg-black rounded-full border-2 border-[#30363d] shadow-inner overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${energy > 50 ? 'bg-gradient-to-r from-[#2ea043] to-[#3fb950]' : energy > 20 ? 'bg-gradient-to-r from-[#d29922] to-[#e3b341]' : 'bg-gradient-to-r from-[#da3633] to-[#ff7b72]'}`}
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 bg-repeat relative bg-[url(/assets/carbon_fiber.png)]">
          
          {activeTab === 'ACTIONS' && (
            <div className="w-full flex flex-col gap-4 max-w-md mx-auto">
              <div className="flex gap-4">
                <div className="flex-1 flex items-center justify-between bg-black/50 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-[#30363d] shadow-inner">
                   <span className="text-[#8b949e] font-bold tracking-widest">XP</span>
                   <span className="text-[#58a6ff] font-bold text-lg drop-shadow-[0_0_5px_rgba(88,166,255,0.8)]">{xp}</span>
                </div>
                <div className="flex-1 flex items-center justify-between bg-black/50 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-[#30363d] shadow-inner">
                   <span className="text-[#8b949e] font-bold tracking-widest">CASH</span>
                   <span className="text-[#3fb950] font-bold text-lg drop-shadow-[0_0_5px_rgba(63,185,80,0.8)]">${currency}</span>
                </div>
              </div>
              
              {shiftMode === 'on-shift' || shiftMode === 'boss-battle' ? (
                <>
                  {/* ER Beds Quick Status */}
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {[0, 1, 2].map((bedIdx) => {
                      const c = activeCases.find((item) => item.bedIndex === bedIdx);
                      return (
                        <button
                          key={bedIdx}
                          onClick={() => {
                            if (c) {
                              audio.playClick();
                              router.push(`/simulator/play/${c.caseDataId}?instanceId=${c.id}`);
                            }
                          }}
                          disabled={!c}
                          className={`py-2 px-1 rounded-lg border-2 text-xs flex flex-col items-center justify-center transition-all ${
                            c 
                              ? 'bg-red-950/80 border-red-500 text-red-100 hover:bg-red-900 active:scale-95 shadow-[0_0_12px_rgba(255,0,0,0.4)] animate-pulse cursor-pointer' 
                              : 'bg-black/40 border-[#30363d] text-gray-500 opacity-60 cursor-default'
                          }`}
                        >
                          <span className="font-bold">BED {bedIdx + 1}</span>
                          <span className="text-[10px] mt-0.5 truncate max-w-full font-mono">
                            {c ? '🚨 TREAT' : 'EMPTY'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 w-full">
                    <PixelButton onClick={() => { setShiftMode('off-duty'); router.push('/summary'); }} variant="alert" className="flex-1 py-3 text-base shadow-lg">
                      {shiftMode === 'boss-battle' ? (language === 'th' ? 'ยอมแพ้' : 'SURRENDER') : translate('end_shift', language)}
                    </PixelButton>
                    
                    {activeCases.length === 0 && (
                       <PixelButton onClick={() => { setIsFastForwarding(true); fastForwardTarget.current = clockMinutes + 60; }} variant="secondary" className="flex-1 py-3 text-base shadow-lg animate-pulse text-[#d29922] border-[#d29922]">
                         ⏩ +60m
                       </PixelButton>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  {isReadyForPromotion && (
                    <PixelButton onClick={() => { audio.playShiftStart(); setClock(0); resetShiftStats(); setShiftMode('boss-battle'); addLog(language === 'th' ? `เริ่มสอบเลื่อนขั้น! โชคดีนะ ${localizedRank}` : `END OF YEAR TEST STARTED! Good luck, ${localizedRank}.`); }} variant="alert" className="w-full py-4 text-base shadow-[0_0_15px_rgba(255,0,0,0.5)] animate-pulse">
                      {language === 'th' ? 'สอบเลื่อนขั้นประจำปี' : 'END OF YEAR TEST'}
                    </PixelButton>
                  )}
                  <div className="relative">
                    <PixelButton onClick={startShift} variant="primary" className="w-full py-4 text-base shadow-lg">
                      {translate('start_shift', language)}
                    </PixelButton>
                    {currentDay === 1 && !tutorialCompleted && dialogueQueue.length === 0 && (
                      <div className="absolute top-1/2 -translate-y-1/2 -left-12 text-3xl animate-bounce drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
                         👉
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <PixelButton 
                      onClick={() => router.push('/hub/shop')} 
                      variant="secondary" 
                      className="py-2 text-xs border-amber-500/50 hover:border-amber-400 text-amber-300"
                    >
                      🛒 SUPPLY CLOSET
                    </PixelButton>
                    <PixelButton 
                      onClick={() => router.push('/profile')} 
                      variant="secondary" 
                      className="py-2 text-xs border-blue-500/50 hover:border-blue-400 text-blue-300"
                    >
                      🪪 ID BADGE
                    </PixelButton>
                  </div>
                </div>
              )}
              
              <PixelButton 
                onClick={toggleOnCall} 
                variant="secondary" 
                className="w-full py-2 text-base"
                disabled={shiftMode !== 'off-duty' && shiftMode !== 'on-call'}
              >
                {shiftMode === 'on-call' ? translate('pager_off', language) : translate('pager_on', language)}
              </PixelButton>
            </div>
          )}
          
          {activeTab === 'LOGS' && (
            <div className="w-full h-full bg-black/80 backdrop-blur-md border-4 border-[#30363d] rounded-xl p-3 overflow-y-auto font-mono text-xs leading-relaxed flex flex-col shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="mb-1.5 flex gap-2">
                  <span className="text-[#1f6feb]">{`>`}</span>
                  <span className={log.includes('Triage:') || log.includes('BOSS') ? 'text-[#ff7b72] font-bold' : 'text-[#c9d1d9]'}>{log}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {isQuestsOpen && <QuestsModal onClose={() => setIsQuestsOpen(false)} />}
        {isLeaderboardOpen && <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} />}
        {isConsultsOpen && <ConsultsModal onClose={() => setIsConsultsOpen(false)} />}
        {isSettingsOpen && <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
      </AnimatePresence>
      </div>
    </PageTransition>
  );
}
