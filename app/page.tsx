"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { audio } from "@/lib/audio";
import { music, TrackId } from "@/lib/music";

import { TitleScene } from "@/components/game/TitleScene";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { playerLookFrom } from "@/lib/playerLook";
import { drawCharacter, Look, Dir } from "@/lib/pixel/characters";
import { SettingsMenu } from "@/components/game/SettingsMenu";

type MenuState = 'INTRO' | 'SPLASH' | 'MENU' | 'SETUP' | 'SETTINGS';

export default function RootPage() {
  const router = useRouter();
  const { setupPlayer, playerName, playerGender, language, xp, currentDay, tutorialCompleted } = useERStore();
  const hasSave = xp > 0 || currentDay > 1 || tutorialCompleted;

  const [menuState, setMenuState] = useState<MenuState | 'ABOUT' | 'CREDITS'>('INTRO');
  const [wizardStep, setWizardStep] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [genderInput, setGenderInput] = useState<'M'|'F'|'O'>('M');
  const [uniInput, setUniInput] = useState("Rama");
  const [langInput, setLangInput] = useState<'en' | 'th'>(language);

  // Customization State
  const [skinColor, setSkinColor] = useState("#f4c7a1");
  const [hairColor, setHairColor] = useState("#2c2328");
  const [topColor, setTopColor] = useState("#ffffff");
  const [bottomColor, setBottomColor] = useState("#333333");
  const [shoeColor, setShoeColor] = useState("#000000");
  const [hairStyle, setHairStyle] = useState("hair_1");
  const [topStyle, setTopStyle] = useState("top_1");

  // Auto-transition from Intro to Splash
  useEffect(() => {
    if (menuState === 'INTRO') {
      const timer = setTimeout(() => {
        setMenuState('SPLASH');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [menuState]);

  const handleSplashTap = () => {
    Haptics.impact({ style: ImpactStyle.Light });
    audio.playClick();
    
    const tracks: TrackId[] = ['sunrise', 'first_house', 'home', 'wandering', 'deep_mines', 'the_void', 'nightfall'];
    music.playTrack(tracks[Math.floor(Math.random() * tracks.length)]);
    
    setMenuState('MENU');
  };

  const handleNewGame = () => {
    Haptics.impact({ style: ImpactStyle.Medium });
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
      storyFlags: {},
      karma: 0,
      clockMinutes: 0,
      shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0 },
      isPendingPromotion: false
    });
    
    setWizardStep(1);
    setMenuState('SETUP');
  };

  const handleContinue = () => {
    Haptics.impact({ style: ImpactStyle.Heavy });
    audio.playClick();
    audio.stopMenuChiptune();
    music.stopTrack();
    router.push("/hub");
  };

  const handleStart = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    // An empty name falls back to the placeholder shown in the field rather than blocking the start.
    audio.stopMenuChiptune();
    music.stopTrack();
    setupPlayer(nameInput.trim() || (langInput === 'th' ? 'สมชาย' : 'John Doe'), genderInput, langInput, {
      skinColor,
      hairColor,
      topColor,
      bottomColor,
      shoeColor,
      hairStyle,
      topStyle
    }, uniInput);
    audio.playShiftStart(); // A little dramatic sound for starting
    router.push("/hub");
  };

  const tr = (en: string, th: string) => (langInput === "th" ? th : en);
  const previewLook = playerLookFrom({ skinColor, hairColor, topColor, bottomColor, shoeColor, hairStyle, topStyle }, "MS5");
  const swatch = (value: string, set: (v: string) => void, options: string[], label: string) => (
    <div className="flex flex-col gap-1">
      <span className="text-[15px] leading-none text-[#6b5258]">{label}</span>
      <div className="flex gap-1 flex-wrap">
        {options.map((c) => (
          <button
            key={c}
            aria-label={`${label} ${c}`}
            onClick={() => { audio.playClick(); set(c); }}
            className={`w-6 h-6 rounded-[3px] border-2 ${value === c ? "border-[#3a2a2f] outline outline-2 outline-[#ffd66b]" : "border-[#3a2a2f]/60"}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-pixel-text font-pixel flex flex-col items-center justify-center p-4 relative overflow-hidden select-none cozy-night">
      <TitleScene />

      {menuState === 'INTRO' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1c1522] cursor-pointer" onClick={() => setMenuState('SPLASH')}>
          <div className="text-center flex flex-col gap-2 animate-[cozyPop_0.6s_ease-out]">
            <p className="text-[#c9b79c] text-lg tracking-[0.3em]">A GAME BY RAMA G7 CLUB</p>
            <h1 className="text-[#ffd66b] text-6xl mt-3 leading-none drop-shadow-[0_3px_0_#5e3923]">Code Rama</h1>
            <div className="mt-6 flex flex-col gap-1 text-[#c9b79c] text-base tracking-widest">
              <p>DEVELOPED BY PRAWEES</p>
              <p>CONCEPT BY PORAMES</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md z-10 flex flex-col items-center justify-center min-h-screen py-4">
        {menuState !== 'SETUP' && (
          <div className="flex flex-col items-center mb-6 animate-[cozyBob_3s_ease-in-out_infinite]">
            <div className="cozy-panel px-6 pt-3 pb-2 text-center">
              <h1 className="text-[56px] leading-[0.9] text-[#d95763] drop-shadow-[0_3px_0_#86522e]">Code Rama</h1>
              <p className="text-[18px] leading-none mt-1 text-[#6b5258]">{langInput === 'th' ? 'เกมโรงพยาบาลแสนอบอุ่น' : 'a cozy little hospital RPG'}</p>
            </div>
          </div>
        )}

        {menuState === 'SPLASH' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-28 cursor-pointer" onClick={handleSplashTap}>
            <p className="cozy-tag px-4 py-1.5 text-2xl animate-[cozyBob_1.4s_ease-in-out_infinite]">TAP TO START</p>
          </div>
        )}

        {menuState === 'MENU' && (
          <div className="w-64 flex flex-col gap-3 animate-slide-up">
            {hasSave && (
              <PixelButton onClick={handleContinue} variant="primary" className="w-full py-2 text-2xl">CONTINUE</PixelButton>
            )}
            <PixelButton onClick={handleNewGame} variant={hasSave ? "wood" : "primary"} className="w-full py-2 text-2xl">NEW GAME</PixelButton>
            <PixelButton onClick={() => setMenuState('SETTINGS')} variant="secondary" className="w-full py-1.5 text-xl">SETTINGS</PixelButton>
            <div className="flex gap-3">
              <PixelButton onClick={() => setMenuState('ABOUT')} variant="secondary" className="flex-1 py-1.5 text-lg">ABOUT</PixelButton>
              <PixelButton onClick={() => setMenuState('CREDITS')} variant="secondary" className="flex-1 py-1.5 text-lg">CREDITS</PixelButton>
            </div>
          </div>
        )}

        {menuState === 'ABOUT' && (
          <PixelPanel variant="parchment" className="w-full space-y-4 animate-slide-up">
            <h2 className="text-center text-3xl leading-none">About</h2>
            <p className="text-lg leading-snug text-center">
              Code Rama follows one doctor from medical school to professorship, across three very different hospitals.
              Treat patients, make friends, and decide what kind of doctor you become.
            </p>
            <PixelButton onClick={() => setMenuState('MENU')} variant="wood" className="w-full">BACK</PixelButton>
          </PixelPanel>
        )}

        {menuState === 'CREDITS' && (
          <PixelPanel variant="parchment" className="w-full space-y-4 animate-slide-up">
            <h2 className="text-center text-3xl leading-none">Credits</h2>
            <div className="text-lg leading-snug text-center space-y-1">
              <p>Developed by Prawees</p>
              <p>Concept by Porames</p>
              <p>A Rama G7 Club project</p>
              <p className="text-[#6b5258]">Font: VT323 (SIL Open Font License)</p>
            </div>
            <PixelButton onClick={() => setMenuState('MENU')} variant="wood" className="w-full">BACK</PixelButton>
          </PixelPanel>
        )}

        <SettingsMenu isOpen={menuState === 'SETTINGS'} onClose={() => setMenuState('MENU')} />

        {menuState === 'SETUP' && (
          <PixelPanel variant="parchment" className="w-full max-h-[92vh] overflow-y-auto space-y-3 animate-slide-up relative z-10">
            {wizardStep === 1 && (
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex gap-3 items-start w-full">
                  <div className="w-20 h-20 shrink-0 rounded-[4px] overflow-hidden border-[3px] border-[#3a2a2f]">
                    <PixelPortrait speaker="Prof. Somchai" className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <p className="cozy-tag inline-block px-2 py-0.5 text-base leading-none !bg-[#ffd66b]">Prof. Somchai</p>
                    <p className="text-xl leading-tight mt-2">{tr("Medical student... what is your name?", "นศพ....ชื่ออะไรจ๊ะ?")}</p>
                  </div>
                </div>
                <div className="w-full flex items-center gap-2 bg-[#fff6e3] border-[3px] border-[#3a2a2f] rounded-[4px] p-2.5 text-xl">
                  <span className="text-[#6b5258]">{tr("MS.", "นศพ.")}</span>
                  <input
                    type="text"
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-center text-[#3a2a2f]"
                    placeholder={tr("John Doe", "สมชาย")}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={15}
                  />
                  <span className="text-[#6b5258]">{tr("Yr 5", "ปี 5")}</span>
                </div>
                <div className="pt-1 flex gap-3 w-full">
                  <PixelButton onClick={() => setMenuState('MENU')} variant="wood" className="w-1/3">BACK</PixelButton>
                  <PixelButton onClick={() => setWizardStep(2)} variant="primary" className="flex-1 text-2xl">NEXT</PixelButton>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-lg leading-none text-[#6b5258]">{tr("Gender", "เพศ")}</label>
                  <div className="flex gap-2">
                    {(['M', 'F', 'O'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => { audio.playClick(); setGenderInput(g); }}
                        className={`cozy-btn flex-1 py-1.5 text-xl ${genderInput === g ? 'cozy-btn-sky' : ''}`}
                      >
                        {g === 'M' ? tr('Male', 'ชาย') : g === 'F' ? tr('Female', 'หญิง') : tr('Other', 'อื่นๆ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-lg leading-none text-[#6b5258]">{tr("Medical school", "สถาบันการศึกษา")}</label>
                  <select
                    className="w-full bg-[#fff6e3] border-[3px] border-[#3a2a2f] rounded-[4px] p-2 text-xl text-[#3a2a2f] outline-none"
                    value={uniInput}
                    onChange={(e) => { audio.playClick(); setUniInput(e.target.value); }}
                  >
                    <option value="Rama">Ramathibodi Hospital (Rama)</option>
                    <option value="Siriraj">Siriraj Hospital</option>
                    <option value="Chula">Chulalongkorn University</option>
                    <option value="ChiangMai">Chiang Mai University (CMU)</option>
                    <option value="KhonKaen">Khon Kaen University (KKU)</option>
                    <option value="Other">Other / General</option>
                  </select>
                </div>
                <div className="pt-1 flex gap-3 w-full">
                  <PixelButton onClick={() => setWizardStep(1)} variant="wood" className="w-1/3">BACK</PixelButton>
                  <PixelButton onClick={() => setWizardStep(3)} variant="primary" className="flex-1 text-2xl">NEXT</PixelButton>
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
                    <span className="text-[13px] text-[#6b5258]">{tr("preview", "ตัวอย่าง")}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    {swatch(skinColor, setSkinColor, ["#ffdcc2", "#f4c7a1", "#e8b089", "#d19a6e", "#b97f55", "#9a6544"], tr("Skin", "สีผิว"))}
                    {swatch(hairColor, setHairColor, ["#2c2328", "#5a3a2a", "#7a4a2c", "#8a3f2c", "#b8b2ad", "#d9739a", "#5b7fbf"], tr("Hair", "สีผม"))}
                    {swatch(topColor, setTopColor, ["#ffffff", "#9fd3e6", "#86c35f", "#f4c7d8", "#ffd66b", "#c98ad1", "#e07a3a"], tr("Shirt", "เสื้อ"))}
                    {swatch(bottomColor, setBottomColor, ["#333333", "#3f4a6b", "#5a5466", "#6e4428", "#2f5f4f"], tr("Pants", "กางเกง"))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px] leading-none text-[#6b5258]">{tr("Hair style", "ทรงผม")}</span>
                    <div className="flex gap-1">
                      {[["hair_1", tr("Short", "สั้น")], ["hair_2", tr("Long", "ยาว")]].map(([v, lbl]) => (
                        <button key={v} onClick={() => { audio.playClick(); setHairStyle(v); }} className={`cozy-btn flex-1 py-1 text-lg ${hairStyle === v ? 'cozy-btn-sky' : ''}`}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px] leading-none text-[#6b5258]">{tr("Outfit", "ชุด")}</span>
                    <div className="flex gap-1">
                      {[["top_1", tr("Shirt", "เสื้อ")], ["top_2", tr("Scrubs", "สครับ")]].map(([v, lbl]) => (
                        <button key={v} onClick={() => { audio.playClick(); setTopStyle(v); }} className={`cozy-btn flex-1 py-1 text-lg ${topStyle === v ? 'cozy-btn-sky' : ''}`}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[15px] leading-none text-[#6b5258]">Language / ภาษา</span>
                  <div className="flex gap-2">
                    <button onClick={() => { audio.playClick(); setLangInput('en'); }} className={`cozy-btn flex-1 py-1.5 text-xl ${langInput === 'en' ? 'cozy-btn-leaf' : ''}`}>English</button>
                    <button onClick={() => { audio.playClick(); setLangInput('th'); }} className={`cozy-btn flex-1 py-1.5 text-xl ${langInput === 'th' ? 'cozy-btn-leaf' : ''}`}>ไทย</button>
                  </div>
                </div>
                <div className="pt-1 flex gap-3">
                  <PixelButton onClick={() => setWizardStep(2)} variant="wood" className="w-1/3">BACK</PixelButton>
                  <PixelButton onClick={handleStart} variant="primary" className="flex-1 text-2xl">{tr("START", "เริ่มเกม")}</PixelButton>
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
function SpritePreview({ look }: { look: Look }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 220);
    return () => clearInterval(id);
  }, []);
  const dirs: Dir[] = ["down", "right", "up", "left"];
  const dir = dirs[Math.floor(tick / 8) % 4];
  const frame = [1, 0, 2, 0][tick % 4];
  const g = drawCharacter(look, dir, frame);
  const rects: JSX.Element[] = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = g.get(x, y);
    if (c) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={c.slice(0, 7)} fillOpacity={c.length > 7 ? 0.2 : 1} />);
  }
  return <svg viewBox="0 0 16 24" className="w-20 h-[7.5rem] mb-1" shapeRendering="crispEdges">{rects}</svg>;
}
