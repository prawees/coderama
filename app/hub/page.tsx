"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useERStore, getEra, useHydrated, chapterXpCap, rankFloorForDay, getRankFromXp, RANK_THRESHOLDS } from "@/lib/erStore";
import { getLocalizedRankTitle, translate } from "@/lib/localization";
import { scheduleOnCallCases, cancelOnCallCases } from "@/lib/notifications";
import { PageTransition } from "@/components/ui/PageTransition";
import { PixelButton } from "@/components/ui/PixelButton";
import { ClinicWorld, WorldApi } from "@/components/game/ClinicWorld";
import { phaseForDay, LOCATION_NAMES, MapId } from "@/lib/world/maps";
import { playerLookFrom } from "@/lib/playerLook";
import { useWorldSocial } from "./useWorldSocial";
import { patientFor } from "@/lib/patients";
import { pickCase } from "@/lib/schedule";
import { PATIENT_SKIN } from "@/lib/patientSkin";
import { STARTER_QUESTS, QUEST_DATABASE } from "@/lib/quests";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { FriendsModal } from "@/components/game/FriendsModal";
import { DayCard } from "@/components/game/DayCard";
import { Pager } from "@/components/ui/Pager";
import { DialogueBox } from "@/components/game/DialogueBox";
import { QuestsModal } from "@/components/game/QuestsModal";
import { LettersModal } from "@/components/game/LettersModal";
import { unreadLetters } from "@/lib/letters";
import { LeaderboardModal } from "@/components/game/LeaderboardModal";
import { ConsultsModal } from "@/components/game/ConsultsModal";
import { SettingsMenu } from "@/components/game/SettingsMenu";
import { CutsceneNode, CutsceneChoice } from "@/lib/StoryManager";
import { getDayStory, advanceQueue, resolveRouters, visibleChoices, shiftStartMinutes, timeInScene, worldLightMinutes } from "@/lib/story";
import { audio } from "@/lib/audio";
import { music, TrackId } from "@/lib/music";
import { AnimatePresence } from "framer-motion";

// Story choices were authored with XP in the thousands (about 637,000 across the campaign),
// while a perfect case pays 100 (about 12,000 across 31 days). At 2% the story and the
// cases contribute roughly equally, so dialogue nudges progression instead of skipping ranks.
const STORY_XP_SCALE = 0.02;

export default function HubPage() {
  const router = useRouter();
  const { 
    shiftMode, setShiftMode, xp, lifetimeXp, currency, energy, maxEnergy, 
    clockMinutes, incrementClock, setClock, addCase, activeCases, resolveMissedCases,
    playerName, playerGender, language, setPendingPromotion, deductEnergy, resetShiftStats,
    tutorialCompleted, completeTutorial, updateFriendship, friendships,
    activeQuests, completedQuests, startQuest, completeQuest, restoreEnergy,
    currentDay, incrementDay, inventory, removeFromInventory, setStoryFlag, addKarma, addXp, forcePromote, storyFlags,
    hospitalUpgrades, shiftStats
  } = useERStore();
  
  const hydrated = useHydrated();
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isLettersOpen, setIsLettersOpen] = useState(false);
  const patientLog = useERStore((s) => s.patientLog);
  const [isCinematic, setIsCinematic] = useState(false);
  
  const currentRankId = getRankFromXp(lifetimeXp || xp);
  const localizedRank = getLocalizedRankTitle(currentRankId, playerName, playerGender, language);
  
  // Calculate next rank threshold
  const thresholds = Object.values(RANK_THRESHOLDS) as number[];
  const nextThresholds = thresholds.filter((t: number) => t > lifetimeXp);
  const nextThreshold = nextThresholds.length > 0 ? Math.min(...nextThresholds) : Infinity;
  
  // The promotion exam is the endgame loop. During the campaign, chapters promote you.
  const isReadyForPromotion = currentDay >= 31 && lifetimeXp >= nextThreshold - 1;
  const chapterCapped = currentDay <= 30 && lifetimeXp >= chapterXpCap(currentDay);

  // Saves from before chapter promotions: bring rank up to what the story says you are.
  useEffect(() => {
    if (!hydrated) return;
    const floor = RANK_THRESHOLDS[rankFloorForDay(currentDay)];
    if ((useERStore.getState().lifetimeXp || 0) < floor) useERStore.setState({ lifetimeXp: floor });
  }, [hydrated, currentDay]);
  const prevThreshold = [...thresholds].reverse().find(t => t <= (lifetimeXp || 0)) || 0;
  const progressPercent = Math.min(100, Math.max(0, ((lifetimeXp || 0) - prevThreshold) / (nextThreshold === Infinity ? prevThreshold : nextThreshold - prevThreshold) * 100));
  
  const [logs, setLogs] = useState<string[]>(['เปิดสมุดบันทึกเวรแล้ว']);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isConsultsOpen, setIsConsultsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [pagerMessage, setPagerMessage] = useState<string | null>(null);
  const [currentMap, setCurrentMap] = useState<MapId>('ER_MAIN');
  const [spawnPos, setSpawnPos] = useState<{x: number, y: number} | undefined>(undefined);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [dayCard, setDayCard] = useState<number | null>(null);
  const worldApi = useRef<WorldApi | null>(null);
  const [dialogueQueue, setDialogueQueue] = useState<CutsceneNode[]>([]);
  const [caseToInject, setCaseToInject] = useState<string | null>(null);
  const [actionOnDialogueEnd, setActionOnDialogueEnd] = useState<'START_SHIFT' | 'END_SHIFT' | 'PRESTIGE' | null>(null);
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
    // (the pager itself sounds where a patient is added, so it is not doubled here)

    // One patient waiting is the normal rhythm of a shift, so the song of the hour keeps playing;
    // two waiting tightens the music, three or more drives it
    let targetTrack: TrackId;
    if (shiftMode === 'on-shift' || shiftMode === 'boss-battle') {
      const hour = Math.floor(((shiftStart + clockMinutes) % 1440) / 60);
      if (activeCases.length >= 3) targetTrack = 'the_void';
      else if (activeCases.length === 2) targetTrack = 'deep_mines';
      else if (hour >= 5 && hour < 12) targetTrack = 'sunrise';
      else if (hour >= 12 && hour < 18) targetTrack = 'wandering';
      else targetTrack = 'nightfall';
    } else {
      targetTrack = 'first_house';
    }
    if (music.getCurrentTrack() !== targetTrack) music.fadeToTrack(targetTrack, 3.0);
  }, [shiftMode, activeCases.length, Math.floor(clockMinutes / 60)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // wait for the saved game, otherwise a returning player sees the tutorial again
    if (!hydrated) return;
    if (!tutorialCompleted) {
      audio.playPAChime();
      // Read the saved name at this moment; never greet anyone by the store's placeholder.
      // Nobody in the cast has met the player yet, so the narrator speaks; Bob and Ann
      // introduce themselves in the day 1 scene and give the pager tip after it (FIRST_SHIFT_TIP).
      const saved = useERStore.getState().playerName;
      const name = saved && saved !== 'Doctor' ? ` ${saved}` : '';
      setDialogueQueue([
        { speaker: "System", text: `03:10 น. วันแรกของ นศพ.${name} ที่ ER รามาเซ็นทรัล` },
        { speaker: "System", text: `เดินดูรอบๆ ได้ แตะคนหรือของเพื่อคุยด้วย พร้อมเมื่อไหร่ แตะ "เริ่มเวร" ด้านล่าง` },
      ]);
    }
    
    // Start First Shift quest
    if (tutorialCompleted) {
      for (const q of STARTER_QUESTS) if (!activeQuests.includes(q) && !completedQuests.includes(q)) startQuest(q);
    }
  }, [hydrated, tutorialCompleted, localizedRank, activeQuests, completedQuests, startQuest]);

  // Start a scene, skipping any flag-check node it opens on
  const playable = (scene: CutsceneNode[]) =>
    resolveRouters(scene, getDayStory(currentDay, language), useERStore.getState().storyFlags);

  /** Skip to the next decision, or to the scene's last line, so the end-of-scene logic still runs on the next tap */
  const skipScene = () => {
    const story = getDayStory(currentDay, language);
    const flags = useERStore.getState().storyFlags;
    let q = dialogueQueue;
    for (let guard = 0; q.length && guard < 300; guard++) {
      const head = q[0];
      if ((visibleChoices(head.choices, flags) ?? []).length) break;
      const nq = resolveRouters(advanceQueue(q, story, head.nextId), story, flags);
      if (!nq.length) break;
      q = nq;
    }
    if (q !== dialogueQueue) setDialogueQueue(q);
  };
  const canSkip = dialogueQueue.length > 1 || Boolean(dialogueQueue[0]?.nextId);

  const handleDialogueComplete = (choice?: CutsceneChoice) => {
    // World chats and gifting run their own action instead of following nextId
    if (choice?.onPick) {
      choice.onPick();
      return;
    }
    // Process effects
    if (choice) {
       if (choice.karmaEffect) addKarma(choice.karmaEffect);
       if (choice.flagEffect) setStoryFlag(choice.flagEffect, true);
       if (choice.xpEffect) addXp(Math.round(choice.xpEffect * STORY_XP_SCALE));
    }
    
    // Determine next node ID
    const nextNodeId = choice?.nextId || dialogueQueue[0]?.nextId;
    
    {
      // Computed from the current queue, then side effects run once (not inside a state updater,
      // which React StrictMode calls twice in development).
      const prev = dialogueQueue;
      let next: CutsceneNode[] = [];
      
      const story = getDayStory(currentDay, language);

      next = advanceQueue(prev, story, nextNodeId);
      
      // Auto-resolve router nodes (flag checks), in the player's language
      next = resolveRouters(next, story, useERStore.getState().storyFlags);
      
      if (next.length === 0) {
        if (!tutorialCompleted) {
          completeTutorial();
        }
        if (actionOnDialogueEnd === 'START_SHIFT') {
          executeStartShift();
          setActionOnDialogueEnd(null);
          // The first shift ends its scene with the pager going off: the two people the player
          // has just met tell them what to do about it
          if (!useERStore.getState().storyFlags['FIRST_SHIFT_TIP']) {
            setStoryFlag('FIRST_SHIFT_TIP', true);
            next = [
              { speaker: "Nurse Ann", text: "เพจเจอร์ดังเมื่อไหร่ แตะที่เตียงด้านล่างได้เลยค่ะหมอ ใครรอนานอาการจะแย่ลงนะคะ" },
              { speaker: "Dr. Bob", text: "สั่ง lab เท่าที่จะเปลี่ยนการรักษา แล้วอ่านสรุปท้ายเคสให้ดี เคสที่นี่ออกสอบ NL ทั้งนั้น" },
              { speaker: "Nurse Ann", text: "ว่างๆ แวะมาคุยกับพวกพี่ด้วยนะคะ ทุกคนมีของโปรด" },
            ];
          }
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
           addCase({
             id: `case_${Date.now()}`,
             caseDataId: caseToInject,
             skinTone: PATIENT_SKIN[caseToInject],
             receivedAt: Date.now(),
             expiresAt: Date.now() + 5 * 60 * 1000,
           });
           useERStore.getState().markSpawned(caseToInject);
           const who = patientFor(caseToInject);
           if (who) setPagerMessage(`${who.name.th} ${who.age.th}\n${who.pager.th}`);
           setCaseToInject(null);
           audio.playPager();
        }
      }
      setDialogueQueue(next);
    }
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
         addLog("ไฟดับ! เครื่องปั่นไฟสำรองติดแล้ว");
      }
      if (state.clockMinutes === 260 && isPowerOutage) {
         setIsPowerOutage(false);
         audio.playShiftStart();
         addLog("ไฟมาแล้ว");
      }
      
    }, tickRate);

    const spawnTick = () => {
      const state = useERStore.getState();
      if (shiftMode === 'boss-battle') {
         // BOSS BATTLE SCRIPT
         if (state.activeCases.length === 0 && state.clockMinutes < 300) {
            audio.playPager();
            addLog("สอบเลื่อนขั้น: mass casualty กำลังมา!");
            
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

         const dayCases = getDayStory(currentDay, language).cases;
         if (dayCases.length > 0) {
            possibleCases = dayCases;
         }
         const earlierCases = Array.from({ length: Math.max(0, currentDay - 1) }, (_, i) => getDayStory(i + 1, language).cases).flat();
         const selectedCase = pickCase({
            today: possibleCases,
            earlier: earlierCases,
            excluded: [...state.activeCases.map((c) => c.caseDataId), ...(state.shiftStats.spawned ?? [])],
            met: Object.keys(state.patientLog),
         });

         // An empty ER fills at once, so nobody waits around for their first patient
         const chance = state.activeCases.length === 0 ? 1 : spawnChance;
         if (selectedCase && state.activeCases.length < maxCases && Math.random() < chance) {
            audio.playPager();
            addLog("คนไข้ใหม่เข้า ER");
            state.markSpawned(selectedCase);
            
            const who = patientFor(selectedCase);
            setPagerMessage(who ? `${who.name.th} ${who.age.th}\n${who.pager.th}` : 'มีคนไข้ใหม่ค่ะหมอ');

            addCase({
              id: `case_${Date.now()}`,
              caseDataId: selectedCase,
              skinTone: PATIENT_SKIN[selectedCase],
              receivedAt: Date.now(),
              expiresAt: Date.now() + 5 * 60 * 1000, 
            });
         }
      }
    };
    const spawner = setInterval(spawnTick, spawnRate);
    const firstSpawn = activeCases.length === 0 ? setTimeout(spawnTick, 1500) : undefined;

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
      clearTimeout(firstSpawn);
    };
  }, [shiftMode, activeCases.length, currentEra, currentDay, isFastForwarding, dialogueQueue.length]);

  // Story Events Check
  useEffect(() => {
    if (shiftMode === 'off-duty' || shiftMode === 'on-call') return;
    if (dialogueQueue.length > 0) return;

    // A mid-shift scene plays at its minute, or when the player comes back from their first
    // patient, whichever is sooner. Leaving early must not skip the story or the flags it sets.
    const played = useERStore.getState().shiftStats.midPlayed ?? [];
    const event = getDayStory(currentDay, language).mid.find(
      (e) => !played.includes(e.triggerMinute) && (clockMinutes >= e.triggerMinute || shiftStats.casesTreated >= 1)
    );
    if (event) {
       useERStore.getState().markMidPlayed(event.triggerMinute);
       setDialogueQueue(playable(event.cutscene));
       if (event.injectCase) setCaseToInject(event.injectCase);
    }
  }, [clockMinutes, shiftMode, dialogueQueue.length, currentDay, language, shiftStats.casesTreated]);

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
               { speaker: "Prof. Somchai", text: "ขึ้นมาถึงจุดสูงสุดแล้วนะ ตอนนี้เป็นหัวหน้าภาควิชาเต็มตัว" },
               { speaker: "Prof. Somchai", text: "จะเกษียณแล้วส่งต่อให้รุ่นน้องไหม เริ่มใหม่อีกรอบ แต่มีของติดตัวไปด้วย", choices: [
                  { text: "ส่งต่อทรัพย์ (เริ่มใหม่พร้อม 5000 เหรียญ)", nextId: "legacy_wealth", flagEffect: "prestige_wealth" },
                  { text: "ส่งต่อความรู้ (เริ่มใหม่พร้อม 5000 XP)", nextId: "legacy_knowledge", flagEffect: "prestige_knowledge" }
               ]}
             ]);
             setActionOnDialogueEnd('PRESTIGE');
           } else {
             addLog("ผ่านสอบเลื่อนขั้นแล้ว!");
             setDialogueQueue([
               { speaker: "Prof. Somchai", text: `วันนี้เยี่ยมมาก mass casualty แบบนี้คุมอยู่ทั้ง ER` },
               { speaker: "Prof. Somchai", text: `ผมเซ็นเลื่อนขั้นให้แล้ว` },
               { speaker: "Prof. Somchai", text: `ยินดีด้วยกับตำแหน่งใหม่นะ` },
             ]);
           }
        } else {
           // Normal shift ended
           const endScene = getDayStory(currentDay, language).end;
           if (endScene.length > 0) {
             setDialogueQueue(playable(endScene));
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
    const startScene = getDayStory(currentDay, language).start;
    if (startScene.length > 0) {
      setDialogueQueue(playable(startScene));
      setActionOnDialogueEnd('START_SHIFT');
    } else {
      executeStartShift();
    }
  };

  const executeStartShift = () => {
    setDayCard(currentDay);
    audio.playShiftStart();
    audio.playAmbientHum();
    setClock(0);
    resetShiftStats();
    setShiftMode('on-shift');
    
    // Apply Upgrades
    if (hospitalUpgrades.includes('upg_espresso')) {
      restoreEnergy(10);
      addLog(`${localizedRank} เข้าเวรวันที่ ${currentDay} (เครื่องชงกาแฟใหม่ +10 พลังงาน)`);
    } else {
      addLog(`${localizedRank} เข้าเวรวันที่ ${currentDay}`);
    }
  };

  const executeEndShift = () => {
    // The closing scene says what time it is ("11:40 น."), so the shift ends then
    const story = getDayStory(currentDay, language);
    const end = timeInScene(story.end);
    if (end !== null) {
      const worked = (end - shiftStartMinutes(story) + 1440) % 1440;
      if (worked > useERStore.getState().clockMinutes) setClock(worked);
    }
    audio.playShiftEnd();
    audio.stopAmbientHum();
    setShiftMode('off-duty');
    incrementDay();
    router.push('/summary');
  };

  // Clocking out early still plays the end-of-day scene and advances the day.
  // Surrendering the promotion exam returns to the summary without advancing.
  // The story is the reward for the shift, so a shift has to have patients in it.
  // Two taps to clock out, so a thumb aimed at a bed never ends the day.
  const MIN_PATIENTS = 2;
  const [endArmed, setEndArmed] = useState(false);
  const patientsSeen = shiftStats.casesTreated;
  const canClockOut = shiftMode === 'boss-battle' || patientsSeen >= MIN_PATIENTS || clockMinutes >= 540;
  useEffect(() => {
    if (!endArmed) return;
    const t = setTimeout(() => setEndArmed(false), 3000);
    return () => clearTimeout(t);
  }, [endArmed]);

  const requestEndShift = () => {
    audio.playClick();
    if (!canClockOut) {
      showToast(`ดูคนไข้อีก ${MIN_PATIENTS - patientsSeen} คนก่อนออกเวรนะ`);
      return;
    }
    if (!endArmed) { setEndArmed(true); return; }
    setEndArmed(false);
    if (shiftMode === 'boss-battle') {
      setShiftMode('off-duty');
      router.push('/summary');
      return;
    }
    const endScene = getDayStory(currentDay, language).end;
    if (endScene.length > 0) {
      setDialogueQueue(playable(endScene));
      setActionOnDialogueEnd('END_SHIFT');
    } else {
      executeEndShift();
    }
  };

  const startBossBattle = () => {
    audio.playShiftStart();
    audio.playAmbientHum();
    setClock(0);
    resetShiftStats();
    setShiftMode('boss-battle');
    addLog(`เริ่มสอบเลื่อนขั้น โชคดีนะ ${localizedRank}`);
  };

  const phase = phaseForDay(currentDay);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((m) => (m === msg ? null : m)), 2600);
  }, []);
  const playScene = useCallback((q: CutsceneNode[]) => {
    setDialogueQueue(q);
    if (q.length === 0) setIsCinematic(false);
  }, []);

  // A nudge before the player runs dry and faints
  const warnedLowEnergy = useRef(false);
  useEffect(() => {
    if (shiftMode !== 'on-shift') { warnedLowEnergy.current = false; return; }
    if (energy > 0 && energy <= 25 && !warnedLowEnergy.current) {
      warnedLowEnergy.current = true;
      worldApi.current?.emote('player', 'sweat');
      showToast('เริ่มหมดแรงแล้ว แวะชงชาที่มุมกาต้มน้ำ หรือออกไปนั่งพักที่ม้านั่งก่อนนะ');
    }
  }, [energy, shiftMode, language, showToast]);

  // Quest completions get a little fanfare
  useEffect(() => {
    const onQuest = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      const q = QUEST_DATABASE[id];
      if (!q) return;
      audio.playCashRegister();
      worldApi.current?.emote('player', 'star');
      worldApi.current?.sparkle('player');
      showToast(language === 'th' ? `ภารกิจสำเร็จ: ${q.title_th} (${q.rewardText})` : `Quest complete: ${q.title} (${q.rewardText})`);
    };
    window.addEventListener('questComplete', onQuest);
    return () => window.removeEventListener('questComplete', onQuest);
  }, [language, showToast]);

  const social = useWorldSocial({
    phase,
    language,
    currentDay,
    setDialogueQueue: playScene,
    setIsCinematic,
    worldApi,
    openLeaderboard: () => setIsLeaderboardOpen(true),
    openConsults: () => setIsConsultsOpen(true),
    openShop: () => router.push('/hub/shop'),
    openLetters: () => setIsLettersOpen(true),
    openCase: (caseId, instanceId) => router.push(`/simulator/play/${caseId}?instanceId=${instanceId}`),
    toast: showToast,
    addLog,
  });

  const playerLook = useMemo(() => playerLookFrom(useERStore.getState().appearance, currentRankId), [currentRankId]);

  const handleDoor = (target: MapId, spawn: { x: number; y: number }) => {
    audio.playFootstep();
    setSpawnPos(spawn);
    setCurrentMap(target);
  };

  // The clock starts when the day's story says the shift starts, and the light follows real time of day
  const shiftStart = useMemo(() => shiftStartMinutes(getDayStory(currentDay, language)), [currentDay, language]);
  const shiftLive = shiftMode === 'on-shift' || shiftMode === 'boss-battle';
  // Off duty, the clock still holds the last shift's end; show the coming shift's start instead
  const shownMinutes = shiftLive ? clockMinutes : 0;
  const timeOfDay = Math.floor(shiftStart + shownMinutes) % 1440;
  const formatTime = (mins: number) => {
    const t = Math.floor(shiftStart + mins) % 1440;
    const hours = Math.floor(t / 60);
    const m = t % 60;
    return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const tr = (en: string, th: string) => (language === 'th' ? th : en);
  const onShift = shiftMode === 'on-shift' || shiftMode === 'boss-battle';
  const hasMail = unreadLetters(patientLog, currentDay).length > 0;
  const anyModal = isQuestsOpen || isLettersOpen || isLeaderboardOpen || isConsultsOpen || isSettingsOpen || isFriendsOpen || activeTab === 'LOGS';

  return (
    <PageTransition>
      <div className="w-full h-[100dvh] flex flex-col font-pixel relative select-none touch-none cozy-night">
      <Pager message={pagerMessage} onClear={() => setPagerMessage(null)} />

      {/* The clinic */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <ClinicWorld
          mapId={currentMap}
          phase={phase}
          npcs={social.npcs}
          playerLook={playerLook}
          activeCases={activeCases}
          mail={hasMail}
          clockMinutes={worldLightMinutes(timeOfDay)}
          onShift={onShift}
          paused={dialogueQueue.length > 0 || anyModal || dayCard !== null}
          fastForward={isFastForwarding}
          spawn={spawnPos}
          language={language}
          onInteract={social.onInteract}
          onDoor={handleDoor}
          describe={social.describe}
          onApi={(api) => { worldApi.current = api; }}
        />

        {/* Day and time plaque */}
        <div className="absolute top-2 left-2 z-40 cozy-tag px-2 py-1 pointer-events-none" data-testid="hud-day">
          <div className="flex items-center gap-1.5 text-[18px] leading-none">
            <PixelIcon name={timeOfDay >= 360 && timeOfDay < 1110 ? 'sun' : 'moon'} size={15} />
            <span>{tr('Day', 'วันที่')} {currentDay}</span>
            <span className="tabular-nums text-[#86522e]">{formatTime(shownMinutes)}</span>
          </div>
          <div className="text-[13px] leading-none mt-1 text-[#86522e] max-w-[11rem] truncate">
            {currentMap === 'AMBULANCE_BAY' ? tr('Courtyard', 'ลานหน้าตึก') : LOCATION_NAMES[phase][language]}
          </div>
        </div>

        {/* Coins and energy */}
        <div className="absolute top-2 right-2 z-40 flex flex-col items-end gap-1 pointer-events-none">
          <div className="cozy-tag px-2 py-1 flex items-center gap-1.5" data-testid="hud-cash">
            <PixelIcon name="coin" size={15} />
            <span className="text-[18px] leading-none tabular-nums">{currency}</span>
          </div>
          <div className="cozy-tag px-1.5 py-1 flex items-center gap-1.5" data-testid="hud-energy">
            <PixelIcon name="energy" size={13} />
            <div className="cozy-bar w-20 h-3">
              <span style={{ width: `${Math.max(0, Math.min(100, (energy / maxEnergy) * 100))}%`, background: energy > 50 ? '#86c35f' : energy > 20 ? '#ffd66b' : '#e06b72' }} />
            </div>
          </div>
        </div>

        {/* Power outage */}
        {isPowerOutage && (
          <div className="absolute inset-0 pointer-events-none z-[35]" style={{ background: `radial-gradient(circle at center, transparent 15%, rgba(20,12,24,0.88) 65%)` }} />
        )}

        {/* Cinematic letterbox */}
        <div className={`absolute top-0 left-0 w-full h-14 bg-[#1c1522] transition-transform duration-700 z-[45] ${isCinematic ? 'translate-y-0' : '-translate-y-full'}`} />
        <div className={`absolute bottom-0 left-0 w-full h-14 bg-[#1c1522] transition-transform duration-700 z-[45] ${isCinematic ? 'translate-y-0' : 'translate-y-full'}`} />

        {toastMsg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 cozy-tag px-3 py-1.5 text-[17px] text-center w-max max-w-[90%] animate-[cozyPop_0.2s_ease-out]" data-testid="toast">
            {toastMsg}
          </div>
        )}

        {dialogueQueue.length > 0 && (
          <DialogueBox
            speakerName={dialogueQueue[0].speaker}
            text={dialogueQueue[0].text}
            portraitUrl={dialogueQueue[0].portrait}
            choices={visibleChoices(dialogueQueue[0].choices, storyFlags)}
            voice={dialogueQueue[0].voice}
            onComplete={handleDialogueComplete}
            onSkip={canSkip ? skipScene : undefined}
          />
        )}

        {dayCard !== null && <DayCard day={dayCard} phase={phase} language={language} onDone={() => setDayCard(null)} />}
      </div>

      {/* The desk */}
      <div className="shrink-0 cozy-wood border-t-[3px] border-[#3a2a2f] px-3 pt-2.5 pb-[calc(0.6rem+var(--safe-bottom))] relative z-10 flex flex-col gap-2">
        <div className="cozy-panel px-2.5 py-1.5 flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[18px] leading-none truncate">{localizedRank}</span>
              <span className="text-[15px] leading-none text-[#86522e] tabular-nums">XP {Math.round(xp)}</span>
            </div>
            {isReadyForPromotion ? (
              <p className="text-[15px] leading-none mt-1.5 text-[#a93c4b] animate-pulse">{'พร้อมสอบเลื่อนขั้นแล้ว!'}</p>
            ) : chapterCapped ? (
              <p className="text-[15px] leading-none mt-1.5 text-[#4f7a3a]" data-testid="chapter-capped">{'XP เต็มบทนี้แล้ว ที่ได้เพิ่มเอาไปอัปสกิลได้'}</p>
            ) : (
              <div className="cozy-bar h-3 mt-1.5"><span style={{ width: `${progressPercent}%`, background: '#7fc8d8' }} /></div>
            )}
          </div>
          <button onClick={() => { audio.playClick(); setIsQuestsOpen(true); }} className="cozy-btn cozy-btn-sun px-2 py-1 flex items-center gap-1 text-[17px] leading-none" aria-label="quests">
            <PixelIcon name="quest" size={16} />{activeQuests.length}
          </button>
        </div>

        {onShift ? (
          <>
            <div className="grid grid-cols-3 gap-2" data-testid="bed-chips">
              {[0, 1, 2].map((bedIdx) => {
                const c = activeCases.find((item) => item.bedIndex === bedIdx);
                return (
                  <button
                    key={bedIdx}
                    onClick={() => { if (c) { audio.playClick(); router.push(`/simulator/play/${c.caseDataId}?instanceId=${c.id}`); } }}
                    disabled={!c}
                    className={`cozy-btn py-1.5 px-1 flex flex-col items-center leading-none ${c ? 'cozy-btn-berry animate-[cozyWiggle_1.2s_ease-in-out_infinite]' : 'opacity-70'}`}
                  >
                    <span className="flex items-center gap-1 text-[16px]"><PixelIcon name="bed" size={16} />{bedIdx + 1}</span>
                    <span className="text-[14px] mt-1 max-w-full truncate px-0.5">{c ? (patientFor(c.caseDataId)?.name.th ?? 'คนไข้') : tr('free', 'ว่าง')}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <PixelButton onClick={requestEndShift} disabled={dialogueQueue.length > 0} variant={endArmed ? 'alert' : 'wood'} className="flex-1 py-1.5 text-[17px]" data-testid="end-shift">
                {endArmed
                  ? (activeCases.length ? `ยังมีคนไข้รอ ${activeCases.length} คน แตะอีกครั้ง` : 'แตะอีกครั้งเพื่อออกเวร')
                  : shiftMode === 'boss-battle' ? 'ยอมแพ้'
                  : canClockOut ? 'ออกเวร' : `ออกเวร (ดูอีก ${MIN_PATIENTS - patientsSeen} คน)`}
              </PixelButton>
              {activeCases.length === 0 && (
                <PixelButton onClick={() => { setIsFastForwarding(true); fastForwardTarget.current = clockMinutes + 60; }} variant="gold" className="flex-1 py-2 text-[19px] flex items-center justify-center gap-1.5">
                  <PixelIcon name="fastforward" size={16} />+1 ชม.
                </PixelButton>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {isReadyForPromotion && (
              <PixelButton onClick={() => { audio.playShiftStart(); setClock(0); resetShiftStats(); setShiftMode('boss-battle'); addLog(`เริ่มสอบเลื่อนขั้น โชคดีนะ ${localizedRank}`); }} variant="alert" className="w-full py-2 text-[19px] animate-pulse">
                {tr('End of year exam', 'สอบเลื่อนขั้นประจำปี')}
              </PixelButton>
            )}
            <div className="relative">
              <PixelButton onClick={startShift} variant="primary" className="w-full py-2.5 text-[22px]" data-testid="start-shift">
                {tr('Start shift', 'เริ่มเวร')}
              </PixelButton>
              {currentDay === 1 && !tutorialCompleted && dialogueQueue.length === 0 && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 text-2xl animate-[cozyBob_0.8s_ease-in-out_infinite] pointer-events-none">◀</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2">
          {[
            { key: 'shop', icon: 'bag', label: tr('Shop', 'ร้าน'), onClick: () => router.push('/hub/shop') },
            { key: 'friends', icon: 'friends', label: tr('Friends', 'เพื่อน'), onClick: () => setIsFriendsOpen(true) },
            { key: 'badge', icon: 'badge', label: tr('Badge', 'บัตร'), onClick: () => router.push('/profile') },
            { key: 'log', icon: 'log', label: tr('Log', 'บันทึก'), onClick: () => setActiveTab('LOGS') },
            { key: 'settings', icon: 'gear', label: tr('Settings', 'ตั้งค่า'), onClick: () => setIsSettingsOpen(true) },
          ].map((b) => (
            <button key={b.key} onClick={() => { audio.playClick(); b.onClick(); }} className="cozy-btn py-1 flex flex-col items-center gap-0.5 leading-none" aria-label={b.key} data-testid={`btn-${b.key}`}>
              <PixelIcon name={b.icon} size={18} />
              <span className="text-[13px]">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'LOGS' && (
        <div className="absolute inset-0 z-[150] bg-[#1c1522]/70 flex items-center justify-center p-4" onClick={() => setActiveTab('ACTIONS')}>
          <div className="cozy-panel w-full max-w-sm max-h-[70%] flex flex-col p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl leading-none">{tr('Shift log', 'บันทึกเวร')}</h2>
              <button className="cozy-btn px-2 py-0.5 text-lg leading-none" onClick={() => setActiveTab('ACTIONS')}>✕</button>
            </div>
            <div className="overflow-y-auto text-[16px] leading-snug flex flex-col gap-1">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('คนไข้ใหม่') || log.includes('สอบเลื่อนขั้น') ? 'text-[#a93c4b]' : ''}>{log}</div>
              ))}
              <div ref={logEndRef} />
            </div>
            <button onClick={toggleOnCall} className="cozy-btn cozy-btn-sky mt-3 py-1 text-[17px]" disabled={shiftMode !== 'off-duty' && shiftMode !== 'on-call'}>
              {shiftMode === 'on-call' ? tr('Turn pager off', 'ปิดเพจเจอร์') : 'เปิดเพจเจอร์ (on call)'}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isQuestsOpen && <QuestsModal onClose={() => setIsQuestsOpen(false)} />}
        {isLettersOpen && <LettersModal onClose={() => setIsLettersOpen(false)} />}
        {isLeaderboardOpen && <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} />}
        {isConsultsOpen && <ConsultsModal onClose={() => setIsConsultsOpen(false)} />}
        {isSettingsOpen && <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
        {isFriendsOpen && <FriendsModal phase={phase} onClose={() => setIsFriendsOpen(false)} />}
      </AnimatePresence>
      </div>
    </PageTransition>
  );
}
