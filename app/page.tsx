"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { audio } from "@/lib/audio";
import { music, TrackId } from "@/lib/music";

import { PixiIntro } from "@/components/game/PixiIntro";
import { PixiPreview } from "@/components/game/PixiPreview";
import { SettingsMenu } from "@/components/game/SettingsMenu";

type MenuState = 'INTRO' | 'SPLASH' | 'MENU' | 'SETUP' | 'SETTINGS';

export default function RootPage() {
  const router = useRouter();
  const { setupPlayer, playerName, playerGender, language, xp } = useERStore();

  const [menuState, setMenuState] = useState<MenuState | 'ABOUT' | 'CREDITS'>('INTRO');
  const [wizardStep, setWizardStep] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [genderInput, setGenderInput] = useState<'M'|'F'|'O'>('M');
  const [uniInput, setUniInput] = useState("Rama");
  const [langInput, setLangInput] = useState<'en' | 'th'>(language);

  // Customization State
  const [skinColor, setSkinColor] = useState("#ffcc99");
  const [hairColor, setHairColor] = useState("#000000");
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
      friendships: { nurse_ann: 0, dr_bob: 0 }
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
    if (!nameInput.trim()) {
      alert(langInput === "th" ? "กรุณาใส่ชื่อของคุณ!" : "Please enter your name!");
      return;
    }
    
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

  return (
    <div className="min-h-screen bg-black text-pixel-text font-pixel flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* PixiJS Background and Animated Characters */}
      <PixiIntro hue={0} showCharacter={menuState === 'SETUP'} />
      
      {/* Intro Overlay */}
      {menuState === 'INTRO' && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black cursor-pointer"
          onClick={() => setMenuState('SPLASH')}
        >
          <div className="text-center animate-pulse flex flex-col gap-2">
            <h2 className="text-gray-300 text-xl tracking-[0.4em] mb-4 font-bold">A GAME BY RAMA G7 CLUB</h2>
            
            <h1 className="text-white text-5xl tracking-widest font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] mt-4">CODE RAMA</h1>
            
            <div className="mt-8 flex flex-col gap-1 text-gray-500 text-sm tracking-widest">
              <p>DEVELOPED BY PRAWEES</p>
              <p>CONCEPT BY PORAMES</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md z-10 flex flex-col items-center justify-center min-h-screen py-4">
        
        {/* Title Logo */}
        <div className={`transition-all duration-700 ease-in-out flex flex-col items-center ${
          menuState === 'SPLASH' ? 'scale-100 mb-12 opacity-100' : 
          menuState === 'SETUP' ? 'scale-0 h-0 opacity-0 mb-0 pointer-events-none' : 
          'scale-75 mb-4 opacity-100'
        }`}>
          <img src="/assets/logo_new.jpg" alt="CODE RAMA" className="w-64 md:w-80 rounded-xl shadow-[0_0_20px_rgba(88,166,255,0.4)]" />
        </div>

        {menuState === 'SPLASH' && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-32 cursor-pointer"
            onClick={handleSplashTap}
          >
            <p className="text-2xl text-yellow-400 animate-pulse drop-shadow-md">
              TAP TO START
            </p>
          </div>
        )}

        {menuState === 'MENU' && (
          <div className="w-full space-y-3 animate-slide-up flex flex-col items-center">
            {xp > 0 && (
              <PixelButton onClick={handleContinue} variant="primary" className="w-64 py-2 text-2xl shadow-[0_0_15px_rgba(46,160,67,0.5)]">
                CONTINUE
              </PixelButton>
            )}
            <PixelButton onClick={handleNewGame} variant={xp > 0 ? "secondary" : "primary"} className="w-64 py-2 text-xl">
              NEW GAME
            </PixelButton>
            <PixelButton onClick={() => setMenuState('SETTINGS')} variant="secondary" className="w-64 py-2 text-lg text-gray-400">
              SETTINGS
            </PixelButton>
            <div className="flex gap-4">
              <PixelButton onClick={() => setMenuState('ABOUT')} variant="secondary" className="w-30 py-2 text-sm text-gray-500">
                ABOUT
              </PixelButton>
              <PixelButton onClick={() => setMenuState('CREDITS')} variant="secondary" className="w-30 py-2 text-sm text-gray-500">
                CREDITS
              </PixelButton>
            </div>
          </div>
        )}

        {menuState === 'ABOUT' && (
          <PixelPanel variant="dark" className="w-full space-y-6 animate-slide-up">
            <h2 className="text-center text-xl text-yellow-400">ABOUT</h2>
            <p className="text-gray-300 text-sm leading-relaxed text-center">
              CODE RAMA is a hospital simulator set across different eras.
              Manage your shift, treat patients, and navigate the brutal realities of medical ethics.
            </p>
            <PixelButton onClick={() => setMenuState('MENU')} variant="secondary" className="w-full mt-4">
              BACK
            </PixelButton>
          </PixelPanel>
        )}

        {menuState === 'CREDITS' && (
          <PixelPanel variant="dark" className="w-full space-y-6 animate-slide-up">
            <h2 className="text-center text-xl text-yellow-400">CREDITS</h2>
            <div className="text-gray-300 text-sm leading-relaxed text-center space-y-2">
              <p>Designed and Built with passion.</p>
              <p>Engine: Next.js + React</p>
              <p>Special Thanks: The Medical Community</p>
            </div>
            <PixelButton onClick={() => setMenuState('MENU')} variant="secondary" className="w-full mt-4">
              BACK
            </PixelButton>
          </PixelPanel>
        )}

        <SettingsMenu isOpen={menuState === 'SETTINGS'} onClose={() => setMenuState('MENU')} />

        {menuState === 'SETUP' && (
          <PixelPanel variant="dark" className="w-full max-h-[90vh] space-y-3 animate-slide-up shadow-2xl relative z-10 pb-4">
            
            {/* Step 1: Introduction and Name */}
            {wizardStep === 1 && (
              <div className="space-y-4 flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-900 border-4 border-[#1f6feb] rounded-xl overflow-hidden relative mb-2">
                  <img 
                    src="/assets/doctor_sprite.png" 
                    alt="Prof. Somchai" 
                    className="absolute max-w-none pixelated" 
                    style={{ 
                      width: "300%", height: "400%", left: "-100%", top: "0%" 
                    }} 
                  />
                </div>
                <div className="bg-black/80 border-4 border-[#30363d] rounded-xl p-4 w-full">
                  <p className="text-[#58a6ff] text-lg font-bold mb-2">Prof. Somchai</p>
                  <p className="text-white text-lg">
                    {langInput === "th" ? "นศพ...ชื่ออะไรจ้ะ ?" : "Medical Student... what is your name?"}
                  </p>
                </div>
                
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2 bg-black border-4 border-[#30363d] rounded p-3 focus-within:border-[#58a6ff] transition-colors shadow-inner text-white font-pixel">
                     <span>{langInput === "th" ? "นศพ." : "MS."}</span>
                     <input 
                       type="text" 
                       className="flex-1 bg-transparent border-none outline-none text-center"
                       placeholder={langInput === "th" ? "สมชาย" : "John Doe"}
                       value={nameInput}
                       onChange={(e) => setNameInput(e.target.value)}
                       maxLength={15}
                     />
                     <span>{langInput === "th" ? "ปี 5" : "Yr 5"}</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-4 w-full">
                  <PixelButton onClick={() => setMenuState('MENU')} variant="secondary" className="w-1/3">
                    BACK
                  </PixelButton>
                  <PixelButton onClick={() => setWizardStep(2)} variant="primary" className="flex-1 text-xl shadow-[0_0_15px_rgba(88,166,255,0.6)]">
                    NEXT
                  </PixelButton>
                </div>
              </div>
            )}
            
            {/* Step 2: Basic Info */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-pixel-accent uppercase text-sm">
                    {langInput === "th" ? "เพศ" : "Gender"}
                  </label>
                  <div className="flex gap-2">
                    {(['M', 'F', 'O'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => { audio.playClick(); setGenderInput(g); }}
                        className={`flex-1 py-2 text-center border-4 font-bold transition-all ${
                          genderInput === g 
                            ? 'bg-[#1f6feb] border-[#58a6ff] text-white shadow-[0_0_10px_rgba(88,166,255,0.5)]' 
                            : 'bg-[#21262d] border-[#30363d] text-gray-400'
                        }`}
                      >
                        {g === 'M' ? (langInput === 'th' ? 'ชาย' : 'Male') : 
                         g === 'F' ? (langInput === 'th' ? 'หญิง' : 'Female') : 
                         (langInput === 'th' ? 'อื่นๆ' : 'Other')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-pixel-accent uppercase text-sm">
                    {langInput === "th" ? "สถาบันการศึกษา" : "University / Medical School"}
                  </label>
                  <select 
                    className="w-full bg-black border-4 border-[#30363d] rounded p-3 text-white font-pixel outline-none focus:border-[#58a6ff] transition-colors shadow-inner"
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
                
                <div className="pt-4 flex gap-4 w-full">
                  <PixelButton onClick={() => setWizardStep(1)} variant="secondary" className="w-1/3">
                    BACK
                  </PixelButton>
                  <PixelButton onClick={() => setWizardStep(3)} variant="primary" className="flex-1 text-xl shadow-[0_0_15px_rgba(88,166,255,0.6)]">
                    NEXT
                  </PixelButton>
                </div>
              </div>
            )}

            {/* Step 3: Customization */}
            {wizardStep === 3 && (
              <div className="space-y-2">
                <label className="text-pixel-accent uppercase text-sm">
                  {langInput === "th" ? "ปรับแต่งตัวละคร" : "Character Customization"}
                </label>
                
                <div className="flex flex-col md:flex-row gap-4 items-start bg-black/40 p-3 rounded-lg border-2 border-[#30363d]">
                  
                  {/* Left Side: Preview */}
                  <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
                    <div className="w-24 h-24 rounded-md border-4 border-[#30363d] bg-black/80 flex items-center justify-center relative shadow-inner overflow-hidden">
                       <PixiPreview 
                         skinColor={skinColor}
                         hairColor={hairColor}
                         topColor={topColor}
                         bottomColor={bottomColor}
                         shoeColor={shoeColor}
                         hairStyle={hairStyle}
                         topStyle={topStyle}
                       />
                       <div className="absolute inset-0 z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] rounded-sm pointer-events-none" />
                    </div>
                    <span className="text-xs text-gray-500 text-center uppercase tracking-widest mt-2">
                      {langInput === "th" ? "ตัวอย่าง" : "PREVIEW"}
                    </span>
                  </div>

                  {/* Right Side: Options */}
                  <div className="flex flex-col gap-2 w-full md:w-2/3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{langInput === "th" ? "สีผิว" : "Skin"}</label>
                        <input type="color" value={skinColor} onChange={(e) => setSkinColor(e.target.value)} className="w-full h-6 cursor-pointer rounded border-0" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{langInput === "th" ? "สีผม" : "Hair"}</label>
                        <input type="color" value={hairColor} onChange={(e) => setHairColor(e.target.value)} className="w-full h-6 cursor-pointer rounded border-0" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{langInput === "th" ? "เสื้อ" : "Shirt"}</label>
                        <input type="color" value={topColor} onChange={(e) => setTopColor(e.target.value)} className="w-full h-6 cursor-pointer rounded border-0" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{langInput === "th" ? "กางเกง" : "Pants"}</label>
                        <input type="color" value={bottomColor} onChange={(e) => setBottomColor(e.target.value)} className="w-full h-6 cursor-pointer rounded border-0" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{langInput === "th" ? "รองเท้า" : "Shoes"}</label>
                        <input type="color" value={shoeColor} onChange={(e) => setShoeColor(e.target.value)} className="w-full h-6 cursor-pointer rounded border-0" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <label className="text-xs text-gray-400">{langInput === "th" ? "ทรงผม" : "Hair Style"}</label>
                      <select 
                        value={hairStyle} 
                        onChange={(e) => setHairStyle(e.target.value)}
                        className="w-full bg-black border-2 border-[#30363d] rounded p-1 text-white text-sm outline-none focus:border-[#58a6ff]"
                      >
                        <option value="hair_1">{langInput === "th" ? "ผมสั้น" : "Short Hair"}</option>
                        <option value="hair_2">{langInput === "th" ? "ผมยาว" : "Long Hair"}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <label className="text-xs text-gray-400">{langInput === "th" ? "ชุดประจำตำแหน่ง" : "Uniform"}</label>
                      <select 
                        value={topStyle} 
                        onChange={(e) => setTopStyle(e.target.value)}
                        className="w-full bg-black border-2 border-[#30363d] rounded p-1 text-white text-sm outline-none focus:border-[#58a6ff]"
                      >
                        <option value="top_1">{langInput === "th" ? "ชุดนักศึกษาแพทย์" : "Medical Student Uniform"}</option>
                        <option value="top_2">{langInput === "th" ? "ชุดสครับ" : "Scrubs"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <label className="text-pixel-accent uppercase text-sm">
                    Language / ภาษา
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => { audio.playClick(); setLangInput('en'); }} className={`flex-1 py-3 text-center border-4 font-bold transition-all ${langInput === 'en' ? 'bg-[#2ea043] border-[#3fb950] text-white shadow-[0_0_10px_rgba(63,185,80,0.5)]' : 'bg-[#21262d] border-[#30363d] text-gray-400'}`}>
                      English
                    </button>
                    <button onClick={() => { audio.playClick(); setLangInput('th'); }} className={`flex-1 py-3 text-center border-4 font-bold transition-all ${langInput === 'th' ? 'bg-[#2ea043] border-[#3fb950] text-white shadow-[0_0_10px_rgba(63,185,80,0.5)]' : 'bg-[#21262d] border-[#30363d] text-gray-400'}`}>
                      ไทย
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <PixelButton onClick={() => setWizardStep(2)} variant="secondary" className="w-1/3">
                    BACK
                  </PixelButton>
                  <PixelButton onClick={handleStart} variant="primary" className="flex-1 text-xl shadow-[0_0_15px_rgba(88,166,255,0.6)]">
                    {langInput === "th" ? "เริ่มเกม" : "START"}
                  </PixelButton>
                </div>
              </div>
            )}
          </PixelPanel>
        )}
        
      </div>
    </div>
  );
}
