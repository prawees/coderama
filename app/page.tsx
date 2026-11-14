"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useERStore, useHydrated, PlayerAppearance } from "@/lib/erStore";
import { Wardrobe } from "@/components/game/Wardrobe";
import { useCloud } from "@/lib/account";
import { RichText } from "@/components/game/RichText";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { haptic } from "@/lib/haptics";
import { audio } from "@/lib/audio";
import { music } from "@/lib/music";

import { TitleScene } from "@/components/game/TitleScene";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { playerLookFrom } from "@/lib/playerLook";
import { SpritePreview } from "@/components/game/SpritePreview";
import { SettingsMenu } from "@/components/game/SettingsMenu";
import { ColdOpen } from "@/components/game/ColdOpen";
import { PixelLogo } from "@/components/game/PixelLogo";
import { shiftInChapter } from "@/lib/chapters";
import { teaserAfter } from "@/lib/teasers";
import { type Challenge, fmtSecs, readChallenge } from "@/lib/invite";
import { setCalm, useCalm } from "@/lib/calm";
import { dailyNumber, liveStreak, playedToday, readDaily } from "@/lib/daily";

/** The cold open plays once on a device. After that the title goes straight to the menu. */
const SEEN_KEY = "coderama.coldOpenSeen";
/** The name on the badge when the player leaves it blank */
const DEFAULT_NAME = { M: "บิ๊ก", F: "นาน่า", O: "บิ๊ก" } as const;
const seenColdOpen = () => { try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; } };
const markColdOpenSeen = () => { try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode */ } };

type MenuState = 'INTRO' | 'SPLASH' | 'COLD_OPEN' | 'MENU' | 'SETUP' | 'SETTINGS';

export default function RootPage() {
  const router = useRouter();
  const { setupPlayer, xp, currentDay, tutorialCompleted, playerName } = useERStore();
  const hasSave = xp > 0 || currentDay > 1 || tutorialCompleted;
  const hydrated = useHydrated();
  const cloud = useCloud();
  const [replaying, setReplaying] = useState(false);
  const calm = useCalm();
  // The case of the day: its number, whether this device has played it, and the streak (read after mount)
  const [dailyInfo, setDailyInfo] = useState<{ n: number; played: boolean; streak: number } | null>(null);
  useEffect(() => { const st = readDaily(), n = dailyNumber(); setDailyInfo({ n, played: playedToday(st, n), streak: liveStreak(st, n) }); }, []);
  // A friend's challenge link (/?vf=34&cpr=88&n=...) opens on the cold open, even for someone with a save
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  useEffect(() => { setChallenge(readChallenge(window.location.search)); }, []);

  const [menuState, setMenuState] = useState<MenuState | 'ABOUT' | 'CREDITS'>('INTRO');
  const [wizardStep, setWizardStep] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [genderInput, setGenderInput] = useState<'M'|'F'|'O'>('M');
  const [uniInput, setUniInput] = useState("Rama");

  // Customization State
  const [look, setLook] = useState<PlayerAppearance>({ skinColor: "#f4c7a1", hairColor: "#2c2328", topColor: "#ffffff", bottomColor: "#333333", shoeColor: "#000000", hairStyle: "short", topStyle: "gown_long", glasses: false });

  // Someone coming back wants their game, not the logo again
  useEffect(() => {
    if (hydrated && hasSave && !readChallenge(window.location.search)) setMenuState((m) => (m === 'INTRO' || m === 'SPLASH' ? 'MENU' : m));
  }, [hydrated, hasSave]);

  // Auto-transition from Intro to Splash
  useEffect(() => {
    if (menuState === 'INTRO') {
      const timer = setTimeout(() => {
        setMenuState('SPLASH');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [menuState]);

  // Browsers hold sound until the first tap, and a returning player skips the splash that would give it
  useEffect(() => {
    const start = () => { if (music.getCurrentTrack() !== 'title') music.fadeToTrack('title', 1.5); };
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, []);

  const handleSplashTap = () => {
    haptic.impact("light");
    audio.playClick();

    // A first-time player goes straight into a resus, and so does anyone taking up a friend's challenge
    if (challenge) {
      music.stopTrack();
      setReplaying(hasSave || seenColdOpen());
      setMenuState('COLD_OPEN');
      return;
    }
    if (!hasSave && !seenColdOpen()) {
      music.stopTrack();
      setMenuState('COLD_OPEN');
      return;
    }
    music.fadeToTrack('title', 1.5);
    setMenuState('MENU');
  };

  const finishColdOpen = () => {
    markColdOpenSeen();
    if (challenge) { setChallenge(null); try { window.history.replaceState(null, '', window.location.pathname); } catch { /* old browser */ } }
    music.fadeToTrack('title', 1.5);
    if (replaying) { setReplaying(false); setMenuState('MENU'); return; }
    setWizardStep(1);
    setMenuState('SETUP');
  };

  const replayColdOpen = () => {
    audio.playClick();
    music.stopTrack();
    setReplaying(true);
    setMenuState('COLD_OPEN');
  };

  const handleNewGame = () => {
    haptic.impact("medium");
    audio.playClick();
    
    // Reset stats for New Game
    useERStore.setState({
      xp: 0,
      lifetimeXp: 0,
      currency: 1000,
      currentDay: 1,
      activeCases: [],
      shiftMode: 'off-duty',
      energy: 100,
      maxEnergy: 100,
      inventory: [],
      equipped: { stethoscope: null, scrubs: null, shoes: null },
      hospitalUpgrades: [],
      unlockedSkills: [],
      activeQuests: [],
      completedQuests: [],
      tutorialCompleted: false,
      friendships: {},
      gifts: {},
      npcDaily: {},
      knownTastes: {},
      heartEventsSeen: [],
      propDaily: {},
      patientLog: {},
      storyFlags: {},
      karma: 0,
      clockMinutes: 0,
      shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0, patients: [], spawned: [], midPlayed: [] },
      isPendingPromotion: false,
      requestsDone: [],
      casebookClaimed: [],
      lastSeen: {},
      savedTotal: 0,
      goodStreak: 0,
      bestStreak: 0
    });
    
    setWizardStep(1);
    setMenuState('SETUP');
  };

  const handleContinue = () => {
    haptic.impact("heavy");
    audio.playClick();
    audio.stopMenuChiptune();
    music.stopTrack();
    router.push("/hub");
  };

  const handleStart = async () => {
    haptic.impact("heavy");
    // An empty name falls back to the placeholder shown in the field rather than blocking the start.
    audio.stopMenuChiptune();
    music.stopTrack();
    setupPlayer(nameInput.trim() || DEFAULT_NAME[genderInput], genderInput, 'th', look, uniInput);
    audio.playShiftStart(); // A little dramatic sound for starting
    router.push("/hub");
  };

  const tr = (_en: string, th: string) => th;
  const previewLook = playerLookFrom(look, "MS5");

  return (
    <div className="min-h-screen text-pixel-text font-pixel flex flex-col items-center justify-center p-4 relative overflow-hidden select-none cozy-night">
      <TitleScene />
      {menuState === 'COLD_OPEN' && <ColdOpen onDone={finishColdOpen} replay={replaying} challenge={challenge} playerName={hasSave ? playerName : null} />}

      {menuState === 'INTRO' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1c1522] cursor-pointer" onClick={() => setMenuState('SPLASH')}>
          <div className="text-center flex flex-col gap-2 animate-[cozyPop_0.6s_ease-out]">
            <p className="text-[#c9b79c] text-lg">เกมจาก Rama G7 Club</p>
            <h1 className="mt-3 flex justify-center"><PixelLogo scale={3} animated /></h1>
            <div className="mt-6 flex flex-col gap-1 text-[#c9b79c] text-base">
              <p>พัฒนาโดย Prawees</p>
              <p>ไอเดียโดย Porames</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md z-10 flex flex-col items-center justify-center min-h-screen py-4">
        {menuState !== 'SETUP' && menuState !== 'COLD_OPEN' && (
          <div className="flex flex-col items-center mb-6 animate-[cozyBob_3s_ease-in-out_infinite]">
            <div className="cozy-panel px-4 pt-3 pb-2 text-center">
              <h1 className="flex justify-center"><PixelLogo scale={3} animated /></h1>
              <p className="text-[18px] leading-tight mt-1 text-[#86522e]">จาก นศพ. ปี 5 สู่อาจารย์หมอ</p>
            </div>
          </div>
        )}

        {menuState === 'SPLASH' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-28 cursor-pointer" onClick={handleSplashTap}>
            {challenge && (
              <div className="cozy-panel mx-6 mb-4 px-4 py-3 text-center animate-[cozyPop_0.4s_ease-out]" data-testid="challenge-splash">
                <p className="text-[20px] leading-none text-[#c4374a]">{challenge.name ?? 'เพื่อน'}ท้าคุณ!</p>
                <p className="text-[18px] leading-snug mt-1.5">ลุง 58 ปี หัวใจหยุดเต้นหน้าห้องตรวจ<br />{challenge.name ?? 'เพื่อน'}ช่วยกลับมาได้ใน {fmtSecs(challenge.secs)} วินาที</p>
                <p className="text-[15px] leading-none mt-1.5 text-[#86522e]">ใช้เวลาไม่ถึงนาที</p>
              </div>
            )}
            <p className="cozy-tag px-4 py-1.5 text-2xl animate-[cozyBob_1.4s_ease-in-out_infinite]">{challenge ? 'แตะเพื่อรับคำท้า' : 'แตะเพื่อเริ่ม'}</p>
          </div>
        )}

        {menuState === 'MENU' && (
          <div className="w-64 flex flex-col gap-3 animate-slide-up">
            {hasSave && (() => {
              const at = shiftInChapter(currentDay);
              return (
                <div className="flex flex-col gap-1.5">
                  <PixelButton onClick={handleContinue} variant="primary" className="w-full py-2 text-2xl" data-testid="continue">เล่นต่อ</PixelButton>
                  <div className="cozy-panel px-2.5 py-2 text-left" data-testid="continue-card">
                    <p className="text-[15px] leading-none text-[#86522e]">{at ? `บท ${at.chapter.n} ${at.chapter.title} เวร ${at.position}/${at.total}` : `เวรที่ ${currentDay}`}</p>
                    {currentDay > 1 && <RichText text={teaserAfter(currentDay - 1)} className="text-[15px] leading-snug mt-1" />}
                  </div>
                </div>
              );
            })()}
            {dailyInfo && (
              <button onClick={() => { audio.playClick(); router.push('/daily'); }} data-testid="daily-link"
                className={`cozy-btn ${dailyInfo.played ? '' : 'cozy-btn-sun'} w-full px-3 py-2 flex items-center justify-between gap-2 text-left`}>
                <span className="text-[21px] leading-none">Daily Case #{dailyInfo.n}</span>
                {dailyInfo.streak > 0 && <span className="ml-auto text-[15px] leading-none text-[#86522e]" data-testid="daily-link-streak">Streak {dailyInfo.streak}</span>}
                {!dailyInfo.played && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#d95763] animate-pulse" />}
              </button>
            )}
            <button onClick={() => { audio.playClick(); router.push('/quiz'); }} data-testid="quiz-link" className="cozy-btn w-full px-3 py-2 text-left text-[20px] leading-none">หมอ ER สายไหน <span className="text-[15px] text-[#86522e]">1 นาที</span></button>
            <PixelButton onClick={handleNewGame} variant={hasSave ? "wood" : "primary"} className="w-full py-2 text-2xl" data-testid="new-game">เริ่มใหม่</PixelButton>
            <PixelButton onClick={() => router.push('/cases')} variant="secondary" className="w-full py-1.5 text-xl" data-testid="case-library-link">คลังเคส</PixelButton>
            <PixelButton onClick={() => router.push('/login')} variant="secondary" className="w-full py-1.5 text-xl" data-testid="account-link">
              {cloud.user ? 'Account ✓ Saved to cloud' : 'Log in / Save to cloud'}
            </PixelButton>
            <PixelButton onClick={() => setMenuState('SETTINGS')} variant="secondary" className="w-full py-1.5 text-xl">ตั้งค่า</PixelButton>
            {/* In plain sight on purpose: the players who need it are the least likely to open settings */}
            <button onClick={() => { audio.playClick(); setCalm(!calm); }} aria-pressed={calm} data-testid="calm-menu"
              className={`cozy-tag self-center px-3 py-1 text-[16px] leading-none ${calm ? '!bg-[#c8ecb4]' : ''}`}>
              โหมดสบายตา {calm ? 'เปิดอยู่' : 'ปิดอยู่'}
            </button>
            <PixelButton onClick={replayColdOpen} variant="secondary" className="w-full py-1.5 text-xl" data-testid="replay-intro">เล่นฉากเปิด ท้าเพื่อนแข่ง</PixelButton>
            <div className="flex gap-3">
              <PixelButton onClick={() => setMenuState('ABOUT')} variant="secondary" className="flex-1 py-1.5 text-lg">เกี่ยวกับเกม</PixelButton>
              <PixelButton onClick={() => setMenuState('CREDITS')} variant="secondary" className="flex-1 py-1.5 text-lg">ทีมงาน</PixelButton>
            </div>
          </div>
        )}

        {menuState === 'ABOUT' && (
          <PixelPanel variant="parchment" className="w-full space-y-4 animate-slide-up">
            <h2 className="text-center text-3xl leading-none">เกี่ยวกับเกม</h2>
            <p className="text-lg leading-snug text-center">
              Code Rama คือชีวิตหมอคนหนึ่ง ตั้งแต่ขึ้นวอร์ดตอน นศพ. ปี 5 จนได้เป็นอาจารย์ ผ่านโรงพยาบาลสามแห่งที่ไม่เหมือนกันเลย
              ดูคนไข้ ผูกมิตรกับพี่ๆ ในวอร์ด แล้วเลือกเองว่าจะเป็นหมอแบบไหน
            </p>
            <PixelButton onClick={() => setMenuState('MENU')} variant="wood" className="w-full">กลับ</PixelButton>
          </PixelPanel>
        )}

        {menuState === 'CREDITS' && (
          <PixelPanel variant="parchment" className="w-full space-y-4 animate-slide-up">
            <h2 className="text-center text-3xl leading-none">ทีมงาน</h2>
            <div className="text-lg leading-snug text-center space-y-1">
              <p>พัฒนาโดย Prawees</p>
              <p>ไอเดียโดย Porames</p>
              <p>โปรเจกต์ของ Rama G7 Club</p>
                          </div>
            <PixelButton onClick={() => setMenuState('MENU')} variant="wood" className="w-full">กลับ</PixelButton>
          </PixelPanel>
        )}

        <SettingsMenu isOpen={menuState === 'SETTINGS'} onClose={() => setMenuState('MENU')} />

        {menuState === 'SETUP' && (
          <PixelPanel variant="parchment" className="w-full max-h-[92vh] overflow-y-auto space-y-3 animate-slide-up relative z-10">
            {wizardStep === 1 && (
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex gap-3 items-start w-full">
                  <div className="w-20 h-20 shrink-0 rounded-[4px] overflow-hidden border-[3px] border-[#3a2a2f]">
                    <PixelPortrait speaker="Auntie Noi" className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <p className="cozy-tag inline-block px-2 py-0.5 text-base leading-none !bg-[#ffd66b]">ป้าน้อย ห้องเก็บของ</p>
                    <p className="text-xl leading-tight mt-2">คุณหมอคนใหม่ใช่ไหมจ๊ะ ป้าทำป้ายชื่อให้ก่อน ชื่อเล่นอะไรจ๊ะ</p>
                  </div>
                </div>
                <div className="w-full flex items-center gap-2 bg-[#fff6e3] border-[3px] border-[#3a2a2f] rounded-[4px] p-2.5 text-xl">
                  <span className="text-[#86522e]">นศพ.</span>
                  <input
                    type="text"
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-center text-[#3a2a2f]"
                    placeholder={DEFAULT_NAME[genderInput]}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={15}
                  />
                  <span className="text-[#86522e]">ปี 5</span>
                </div>
                <div className="space-y-2 w-full">
                  <label className="text-lg leading-none text-[#86522e]">{tr("Gender", "เพศ")}</label>
                  <div className="flex gap-2">
                    {(['M', 'F', 'O'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => { audio.playClick(); setGenderInput(g); }}
                        className={`cozy-btn flex-1 py-1.5 text-xl ${genderInput === g ? 'cozy-btn-sky' : ''}`}
                      >
                        {g === 'M' ? tr('Male', 'ชาย') : g === 'F' ? tr('Female', 'หญิง') : 'ไม่ระบุ'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-lg leading-none text-[#86522e]">คณะแพทย์ที่เรียน</label>
                  <select
                    className="w-full bg-[#fff6e3] border-[3px] border-[#3a2a2f] rounded-[4px] p-2 text-xl text-[#3a2a2f] outline-none"
                    value={uniInput}
                    onChange={(e) => { audio.playClick(); setUniInput(e.target.value); }}
                  >
                    <option value="Rama">รามาธิบดี</option>
                    <option value="Siriraj">ศิริราช</option>
                    <option value="Chula">จุฬาฯ</option>
                    <option value="ChiangMai">เชียงใหม่</option>
                    <option value="KhonKaen">ขอนแก่น</option>
                    <option value="Other">ที่อื่น</option>
                  </select>
                </div>
                <div className="pt-1 flex flex-col gap-2 w-full">
                  <PixelButton onClick={handleStart} variant="primary" className="w-full py-2 text-2xl" data-testid="start-game">เข้าเวรเลย</PixelButton>
                  <div className="flex gap-2">
                    <PixelButton onClick={() => setMenuState('MENU')} variant="wood" className="w-1/3">กลับ</PixelButton>
                    <PixelButton onClick={() => setWizardStep(3)} variant="secondary" className="flex-1 text-xl" data-testid="customize">แต่งตัวก่อน</PixelButton>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-24 h-32 rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#cfe8d8] flex items-end justify-center overflow-hidden" data-testid="char-preview">
                      <SpritePreview look={previewLook} />
                    </div>
                    <span className="text-[14px] text-[#86522e]">{tr("preview", "ตัวอย่าง")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Wardrobe value={look} rank="MS5" onChange={(p) => setLook((l) => ({ ...l, ...p }))} />
                  </div>
                </div>
                <div className="pt-1 flex gap-3">
                  <PixelButton onClick={() => setWizardStep(1)} variant="wood" className="w-1/3">กลับ</PixelButton>
                  <PixelButton onClick={handleStart} variant="primary" className="flex-1 text-2xl">เข้าเวรเลย</PixelButton>
                </div>
              </div>
            )}
          </PixelPanel>
        )}
      </div>
    </div>
  );
}

/** The real in-game sprite, turning slowly so you can see all sides */
