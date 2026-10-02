"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useERStore, getEra } from "@/lib/erStore";
import { getLocalizedRankTitle } from "@/lib/localization";
import { useT } from "@/lib/i18n/useT";
import { useTransition } from "@/lib/transition";
import { QUEST_DATABASE } from "@/lib/quests";
import { PixiPreview } from "@/components/game/PixiPreview";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { scheduleOnCallCases, cancelOnCallCases } from "@/lib/notifications";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixiEngine2D } from "@/components/game/PixiEngine2D";
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
    hospitalUpgrades, appearance, consultUsedThisShift, drinkCoffee
  } = useERStore();
  const { t } = useT();
  const { wipeTo } = useTransition();
  
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const lastBreak = useRef<{ coffee: number | null; nap: number | null }>({ coffee: null, nap: null });
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
  
  const [logs, setLogs] = useState<string[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isConsultsOpen, setIsConsultsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [pagerMessage, setPagerMessage] = useState<string | null>(null);
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
  const onShift = shiftMode === 'on-shift' || shiftMode === 'boss-battle';

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
          
          addLog(t('hub.prestige_done'));
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
         addLog(t('hub.power_outage'));
      }
      if (state.clockMinutes === 260 && isPowerOutage) {
         setIsPowerOutage(false);
         audio.playShiftStart();
         addLog(t('hub.power_restored'));
      }
      
    }, tickRate);

    const spawner = setInterval(() => {
      const state = useERStore.getState();
      if (shiftMode === 'boss-battle') {
         // BOSS BATTLE SCRIPT
         if (state.activeCases.length === 0 && state.clockMinutes < 300) {
            audio.playPager();
            addLog(t('hub.boss_incoming'));
            
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
            addLog(t('hub.new_patient'));
            const selectedCase = possibleCases[Math.floor(Math.random() * possibleCases.length)];
            
            const pagerKey = `pager.${selectedCase}`;
            const pagerLine = t(pagerKey) === pagerKey ? t('pager.generic', { id: selectedCase }) : t(pagerKey);
            setPagerMessage(`*BEEP BEEP*\n${pagerLine}`);

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
               { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: t('hub.prestige_1') },
               { speaker: "Prof. Somchai", portrait: "/assets/doctor_sprite.png", text: t('hub.prestige_2'), choices: [
                  { text: t('hub.legacy_wealth'), nextId: "legacy_wealth", flagEffect: "prestige_wealth" },
                  { text: t('hub.legacy_knowledge'), nextId: "legacy_knowledge", flagEffect: "prestige_knowledge" }
               ]}
             ]);
             setActionOnDialogueEnd('PRESTIGE');
           } else {
             addLog(t('hub.boss_defeated'));
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
      addLog(t('hub.clocked_in_espresso', { rank: localizedRank, day: currentDay }));
    } else {
      addLog(t('hub.clocked_in', { rank: localizedRank, day: currentDay }));
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
    addLog(t('hub.exam_started', { rank: localizedRank }));
  };

  const handleInteract = (id: string, type: string) => {
    if (type === 'bed') {
      const bedIndex = parseInt(id.replace('bed_', '')) - 1;
      const activeCase = activeCases.find(c => c.bedIndex === bedIndex);
      if (activeCase) {
        audio.playClick();
        wipeTo(`/simulator/play/${activeCase.caseDataId}?instanceId=${activeCase.id}`, t('hub.treat'));
      } else {
        addLog(t('hub.bed_empty_log'));
      }
    } else if (type === 'npc') {
      audio.playClick();
      
      if (id === 'grump_npc') {
         const gh = friendships['dr_grump'] || 0;
         const grump = t('npc.grump');
         if (inventory.includes('special_coffee')) {
           removeFromInventory('special_coffee');
           updateFriendship('dr_grump', 1);
           addLog(t('hub.gift_coffee_grump'));
           const nh = gh + 1;
           if (nh === 3) {
             setIsCinematic(true);
             setDialogueQueue([
               { speaker: grump, text: t('npc.grump_gift') },
               { speaker: grump, text: t('npc.grump_3') },
               { speaker: "System", text: t('npc.grump_3_sys') },
             ]);
             addLog(t('hub.heart_event', { name: grump }));
           } else if (nh === 2) {
             setDialogueQueue([{ speaker: grump, text: t('npc.grump_2') }, { speaker: "System", text: t('npc.friendship_up', { name: grump, n: nh }) }]);
           } else {
             setDialogueQueue([{ speaker: grump, text: t('npc.grump_gift') }, { speaker: "System", text: t('npc.friendship_up', { name: grump, n: nh }) }]);
           }
           return;
         }
         const line = gh >= 3 ? t('npc.grump_3') : gh >= 1 ? t('npc.grump_1') : t('npc.grump_idle', { rank: localizedRank });
         setDialogueQueue([{ speaker: grump, text: line }]);
         return;
      }
      
      const currentHearts = friendships['nurse_ann'] || 0;
      const ann = t('npc.ann');
      
      if (inventory.includes('special_coffee')) {
         // Gift flow
         removeFromInventory('special_coffee');
         updateFriendship('nurse_ann', 1);
         addLog(t('hub.gift_coffee_ann'));
         
         const newHearts = currentHearts + 1;
         
         if (newHearts === 2) {
           setIsCinematic(true);
           setDialogueQueue([
             { speaker: ann, portrait: "/assets/nurse_sprite.png", text: t('npc.ann_ev2_a') },
             { speaker: ann, portrait: "/assets/nurse_sprite.png", text: t('npc.ann_ev2_b') },
             { speaker: ann, portrait: "/assets/nurse_sprite.png", text: t('npc.ann_ev2_c') },
             { speaker: "System", text: t('npc.friendship_up', { name: ann, n: newHearts }) }
           ]);
           addLog(t('hub.heart_event', { name: ann }));
         } else if (newHearts === 4) {
           setIsCinematic(true);
           setDialogueQueue([
             { speaker: ann, portrait: "/assets/nurse_sprite.png", text: t('npc.ann_ev4_a') },
             { speaker: ann, portrait: "/assets/nurse_sprite.png", text: t('npc.ann_ev4_b') },
             { speaker: "System", text: t('npc.friendship_up', { name: ann, n: newHearts }) }
           ]);
           addLog(t('hub.heart_event', { name: ann }));
         } else {
           setDialogueQueue([
             { speaker: ann, portrait: "/assets/nurse_sprite.png", text: t('npc.ann_gift', { rank: localizedRank }) },
             { speaker: "System", text: t('npc.friendship_up', { name: ann, n: newHearts }) }
           ]);
         }
         
         if (newHearts >= 2 && activeQuests.includes('q_social_butterfly')) {
           completeQuest('q_social_butterfly');
           addLog(t('hub.quest_done', { name: t('quest.q_social_butterfly.title') }));
         }
      } else {
         // Standard chat flow
         let dialogText = t('npc.ann_idle', { rank: localizedRank });
         if (currentHearts >= 2) dialogText = t('npc.ann_2');
         if (currentHearts >= 4) dialogText = t('npc.ann_4');
         
         setDialogueQueue([
           { speaker: ann, portrait: "/assets/nurse_sprite.png", text: dialogText }
         ]);
      }
      
      if (currentHearts >= 2 && activeQuests.includes('q_social_butterfly')) {
        completeQuest('q_social_butterfly');
        addLog(t('hub.quest_done', { name: t('quest.q_social_butterfly.title') }));
      }
    } else if (type === 'coffee') {
      const last = lastBreak.current.coffee;
      if (last !== null && clockMinutes - last < 120 && onShift) { setDialogueQueue([{ speaker: "System", text: t('hub.coffee_empty') }]); return; }
      lastBreak.current.coffee = clockMinutes;
      audio.playCashRegister();
      restoreEnergy(15);
      if (onShift) incrementClock(10);
      addLog(t('hub.coffee_brewed'));
    } else if (type === 'rest') {
      const last = lastBreak.current.nap;
      if (last !== null && clockMinutes - last < 180 && onShift) { setDialogueQueue([{ speaker: "System", text: t('hub.nap_denied') }]); return; }
      lastBreak.current.nap = clockMinutes;
      restoreEnergy(onShift ? 30 : 50);
      if (onShift) incrementClock(45);
      setDialogueQueue([{ speaker: "System", text: onShift ? t('hub.nap_shift') : t('hub.nap_off') }]);
      addLog(t('hub.nap_log'));
    } else if (id === 'leaderboard') {
      audio.playClick();
      setIsLeaderboardOpen(true);
    } else if (id === 'consults') {
      audio.playClick();
      setIsConsultsOpen(true);
    }
  };


  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60) + 8;
    const m = Math.floor(mins % 60);
    return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const grumpHearts = friendships['dr_grump'] || 0;
  const annHearts = friendships['nurse_ann'] || 0;
  const eraKey = ({ MED_Y5: 'hub.era_ms5', MED_Y6: 'hub.era_ms6', INTERN: 'hub.era_intern', RESIDENT: 'hub.era_resident', PROFESSOR: 'hub.era_professor' } as Record<string, string>)[currentEra];
  const questNames = activeQuests.map((q) => t(`quest.${q}.title`));
  const Hearts = ({ n }: { n: number }) => (
    <span className="tracking-tighter">{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < n ? 'text-[#d95763]' : 'text-[#2c4a73]'}>♥</span>)}</span>
  );

  return (
    <PageTransition>
      <div className="absolute inset-0 flex font-pixel select-none bg-pixel-bg">
        <Pager message={pagerMessage} onClear={() => setPagerMessage(null)} />

        {/* ═══ LEFT SIDEBAR - Doctor / Clock / Energy ═══ */}
        <aside className="w-[22%] min-w-[260px] h-full flex flex-col gap-3 p-3 bg-pixel-ink border-r-8 border-pixel-ink overflow-hidden">
          <PixelPanel variant="wood" title={t('hub.rank')} className="shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-16 h-[72px] bg-[#c7dafa] border-4 border-[#0b1626] flex items-start justify-center overflow-hidden shrink-0">
                <PixiPreview {...(appearance as any)} />
              </div>
              <div className="min-w-0">
                <div className="text-xl text-pixel-gold truncate">{localizedRank}</div>
                <div className="text-sm text-pixel-text-muted truncate">{t(eraKey)} · {t('hub.day')} {currentDay}</div>
              </div>
            </div>
            {isReadyForPromotion ? (
              <div className="mt-2 text-lg text-[#d95763] blink">{t('hub.promotion_ready')}</div>
            ) : (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-pixel-text-muted"><span>{t('hub.next_rank')}</span><span>{lifetimeXp}/{nextThreshold === Infinity ? '∞' : nextThreshold}</span></div>
                <div className="pixel-bar mt-1"><div className="fill bg-[#41a6f6]" style={{ width: `${progressPercent}%` }} /><div className="ticks" /></div>
              </div>
            )}
          </PixelPanel>

          <PixelPanel variant="metal" title={t('hub.clock')} className="shrink-0">
            <div className="font-heading text-2xl text-[#99e550] text-center py-1 scanlines">{formatTime(clockMinutes)}</div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-pixel-text-muted"><span>{t('hub.energy')}</span><span>{Math.round(energy)}/{maxEnergy}</span></div>
              <div className="pixel-bar mt-1"><div className={`fill ${energy > 50 ? 'bg-[#6abe30]' : energy > 20 ? 'bg-[#d29922]' : 'bg-[#d95763]'}`} style={{ width: `${(energy / maxEnergy) * 100}%` }} /><div className="ticks" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-center">
              <div className="border-4 border-[#2c4a73] bg-pixel-ink py-1"><div className="text-sm text-pixel-text-muted">{t('hub.xp')}</div><div className="text-xl text-[#b5e2ff]">{Math.round(xp)}</div></div>
              <div className="border-4 border-[#2c4a73] bg-pixel-ink py-1"><div className="text-sm text-pixel-text-muted">{t('hub.cash')}</div><div className="text-xl text-[#99e550]">${currency}</div></div>
            </div>
            <PixelButton size="sm" variant="wood" className="w-full mt-2" disabled={!inventory.includes('special_coffee')} onClick={() => { if (drinkCoffee()) { audio.playCashRegister(); addLog(t('hub.coffee_drunk')); } }}>
              ☕ {inventory.includes('special_coffee') ? t('hub.drink_coffee') : t('hub.no_coffee')}
            </PixelButton>
          </PixelPanel>

          <PixelPanel variant="wood" title={t('hub.relationships')} className="shrink-0">
            <div className="flex justify-between text-lg"><span className="text-[#b5e2ff]">{t('npc.ann')}</span><Hearts n={annHearts} /></div>
            <div className="flex justify-between text-lg"><span className="text-[#ef7d57]">{t('npc.grump')}</span><Hearts n={grumpHearts} /></div>
            <div className={`mt-2 text-sm border-4 px-2 py-1 ${grumpHearts >= 3 ? (consultUsedThisShift ? 'border-[#2c4a73] text-pixel-text-muted' : 'border-[#99e550] text-[#99e550]') : 'border-[#2c4a73] text-pixel-text-muted'}`}>
              {t('hub.consult_attending')}: {grumpHearts >= 3 ? (consultUsedThisShift ? t('hub.consult_used') : t('hub.consult_ready')) : t('hub.consult_locked')}
            </div>
          </PixelPanel>

          <PixelButton size="sm" variant="wood" className="w-full mt-auto" onClick={() => router.push('/cases')}>📚 {t('nav.cases')}</PixelButton>
          <div className="grid grid-cols-3 gap-2">
            <PixelButton size="sm" variant="gold" onClick={() => router.push('/hub/shop')}>🛒</PixelButton>
            <PixelButton size="sm" variant="primary" onClick={() => router.push('/profile')}>🪪</PixelButton>
            <PixelButton size="sm" variant="secondary" onClick={() => setIsSettingsOpen(true)}>⚙</PixelButton>
          </div>
        </aside>

        {/* ═══ CENTER - 2D Ward viewport ═══ */}
        <main className="flex-1 h-full relative bg-black overflow-hidden">
          <PixiEngine2D
            onInteract={handleInteract}
            activeCases={activeCases}
            clockMinutes={clockMinutes}
            npcEmote={annHearts >= 4 ? "♥" : null}
            isFastForwarding={isFastForwarding}
            paused={dialogueQueue.length > 0 || isSettingsOpen || isQuestsOpen || isLeaderboardOpen || isConsultsOpen}
          />
          {/* Ambient Lighting & Vignette */}
          <div className="absolute inset-0 pointer-events-none z-[55] mix-blend-multiply bg-[radial-gradient(ellipse_at_center,transparent_20%,#090916_120%)] opacity-80" />
          {isPowerOutage && <div className="absolute inset-0 pointer-events-none z-[60] bg-[#050a14]/90 dither" />}

          {!onShift && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pixel-frame-metal rivets pointer-events-none">
              <div className="frame-inner px-6 py-3 text-center">
                <p className="font-heading text-xs text-pixel-gold">{t('hub.hospital')}</p>
                <p className="text-lg text-pixel-text-muted mt-1">{t('hub.waiting_shift')}</p>
              </div>
            </div>
          )}

          {dialogueQueue.length > 0 && (
            <DialogueBox speakerName={dialogueQueue[0].speaker} text={dialogueQueue[0].text} portraitUrl={dialogueQueue[0].portrait} choices={dialogueQueue[0].choices} onComplete={handleDialogueComplete} />
          )}
          <div className={`absolute top-0 left-0 w-full h-16 bg-black transition-transform duration-700 z-40 ${isCinematic ? 'translate-y-0' : '-translate-y-full'}`} />
          <div className={`absolute bottom-0 left-0 w-full h-16 bg-black transition-transform duration-700 z-40 ${isCinematic ? 'translate-y-0' : 'translate-y-full'}`} />
        </main>

        {/* ═══ RIGHT SIDEBAR - Objectives / Triage / Log ═══ */}
        <aside className="w-[24%] min-w-[280px] h-full flex flex-col gap-3 p-3 bg-pixel-ink border-l-8 border-pixel-ink overflow-hidden">
          <PixelPanel variant="wood" title={t('hub.objectives')} className="shrink-0">
            {questNames.length === 0 ? <p className="text-lg text-pixel-text-muted">-</p> : questNames.slice(0, 4).map((q, i) => (
              <div key={i} className="text-lg leading-tight flex gap-2"><span className="text-pixel-gold">▸</span><span className="truncate">{q}</span></div>
            ))}
            <button onClick={() => setIsQuestsOpen(true)} className="mt-1 text-sm text-[#b5e2ff] hover:underline text-left">{t('hub.view_quests', { n: activeQuests.length })}</button>
          </PixelPanel>

          <PixelPanel variant="metal" title={t('hub.triage_queue')} className="shrink-0">
            {[0, 1, 2].map((bedIdx) => {
              const c = activeCases.find((item) => item.bedIndex === bedIdx);
              const critical = c ? Date.now() > c.expiresAt - 60000 : false;
              return (
                <button key={bedIdx} disabled={!c}
                  onClick={() => { if (c) { audio.playClick(); wipeTo(`/simulator/play/${c.caseDataId}?instanceId=${c.id}`, t('hub.treat')); } }}
                  className={`w-full flex items-center justify-between px-3 py-2 mb-1 border-4 text-lg ${c ? (critical ? 'border-[#d95763] bg-[#3a0e14] text-white blink' : 'border-[#ffcd75] bg-[#3a2a08] text-white hover:bg-[#5a3f0c]') : 'border-[#2c4a73] bg-pixel-ink text-pixel-text-muted'}`}>
                  <span>{t('hub.bed')} {bedIdx + 1}</span>
                  <span>{c ? `${critical ? '‼ ' : ''}${t('pager.' + c.caseDataId) !== 'pager.' + c.caseDataId ? t('pager.' + c.caseDataId) : c.caseDataId}` : t('hub.empty')}</span>
                </button>
              );
            })}
            {activeCases.length === 0 && <p className="text-sm text-pixel-text-muted mt-1">{t('hub.no_patients')}</p>}
          </PixelPanel>

          <div className="flex flex-col gap-2 shrink-0">
            {onShift ? (
              <div className="flex gap-2">
                <PixelButton variant="alert" className="flex-1" onClick={() => { setShiftMode('off-duty'); router.push('/summary'); }}>
                  {shiftMode === 'boss-battle' ? t('hub.surrender') : t('hub.end_shift')}
                </PixelButton>
                {activeCases.length === 0 && (
                  <PixelButton variant="gold" onClick={() => { setIsFastForwarding(true); fastForwardTarget.current = clockMinutes + 60; }}>⏩</PixelButton>
                )}
              </div>
            ) : (
              <>
                {isReadyForPromotion && (
                  <PixelButton variant="alert" className="w-full blink" onClick={() => { audio.playShiftStart(); setClock(0); resetShiftStats(); setShiftMode('boss-battle'); addLog(t('hub.exam_started', { rank: localizedRank })); }}>
                    {t('hub.year_end_test')}
                  </PixelButton>
                )}
                <div className="relative">
                  <PixelButton variant="success" size="lg" className="w-full" onClick={startShift}>{t('hub.start_shift')}</PixelButton>
                  {currentDay === 1 && !tutorialCompleted && dialogueQueue.length === 0 && <div className="absolute top-1/2 -translate-y-1/2 -left-10 text-3xl animate-bounce">👉</div>}
                </div>
                <PixelButton variant="secondary" size="sm" className="w-full" onClick={toggleOnCall} disabled={shiftMode !== 'off-duty' && shiftMode !== 'on-call'}>
                  {shiftMode === 'on-call' ? t('hub.pager_off') : t('hub.pager_on')}
                </PixelButton>
              </>
            )}
          </div>

          <PixelPanel variant="metal" title={t('hub.ward_log')} className="flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto text-base leading-snug scanlines pr-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2"><span className="text-[#41a6f6]">›</span><span className={/Triage|BOSS|คัดกรอง|บอส/.test(log) ? 'text-[#ef7d57]' : 'text-[#c2c3c7]'}>{log}</span></div>
              ))}
              <div ref={logEndRef} />
            </div>
          </PixelPanel>
        </aside>

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
