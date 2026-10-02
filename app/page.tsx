"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { audio } from "@/lib/audio";
import { music, TrackId } from "@/lib/music";
import { AppearancePicker } from "@/components/game/AppearancePicker";
import { SettingsMenu } from "@/components/game/SettingsMenu";
import { SpriteWalker } from "@/components/game/SpriteWalker";
import { tr, Lang } from "@/lib/i18n/dictionary";
import { motion, AnimatePresence } from "framer-motion";

type MenuState = 'INTRO' | 'SPLASH' | 'MENU' | 'SETUP' | 'SETTINGS' | 'ABOUT' | 'CREDITS';

const SCHOOLS: { id: string; en: string; th: string }[] = [
  { id: 'Rama', en: 'Ramathibodi Hospital', th: 'คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี' },
  { id: 'Siriraj', en: 'Siriraj Hospital', th: 'คณะแพทยศาสตร์ศิริราชพยาบาล' },
  { id: 'Chula', en: 'Chulalongkorn University', th: 'คณะแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย' },
  { id: 'ChiangMai', en: 'Chiang Mai University', th: 'คณะแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่' },
  { id: 'KhonKaen', en: 'Khon Kaen University', th: 'คณะแพทยศาสตร์ มหาวิทยาลัยขอนแก่น' },
  { id: 'Other', en: 'Other medical school', th: 'สถาบันอื่น' },
];

export default function RootPage() {
  const router = useRouter();
  const { setupPlayer, language, xp, setLanguage } = useERStore() as any;

  const [menuState, setMenuState] = useState<MenuState>('INTRO');
  const [wizardStep, setWizardStep] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [genderInput, setGenderInput] = useState<'M' | 'F' | 'O'>('M');
  const [uniInput, setUniInput] = useState("Rama");
  const [langInput, setLangInput] = useState<Lang>(language);
  const [look, setLook] = useState({ skinRamp: 'skin_light', hairRamp: 'hair_brown', topRamp: 'scrub_navy' });
  const [nameError, setNameError] = useState(false);
  const t = (k: string, v?: Record<string, string | number>) => tr(k, langInput, v);

  useEffect(() => {
    if (menuState !== 'INTRO') return;
    const timer = setTimeout(() => setMenuState('SPLASH'), 2600);
    return () => clearTimeout(timer);
  }, [menuState]);

  const pickLang = (l: Lang) => { audio.playClick(); setLangInput(l); useERStore.setState({ language: l }); };

  const handleSplashTap = () => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    audio.playClick();
    const tracks: TrackId[] = ['sunrise', 'first_house', 'home', 'wandering'];
    music.playTrack(tracks[Math.floor(Math.random() * tracks.length)]);
    setMenuState('MENU');
  };

  const handleNewGame = () => {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    audio.playClick();
    useERStore.setState({
      xp: 0, lifetimeXp: 0, currency: 1000, currentDay: 1, activeCases: [], shiftMode: 'off-duty',
      energy: 100, maxEnergy: 100, inventory: [], equipped: { stethoscope: null, scrubs: null, shoes: null },
      hospitalUpgrades: [], unlockedSkills: [], activeQuests: [], completedQuests: [], tutorialCompleted: false,
      friendships: { nurse_ann: 0, dr_grump: 0 }, caseReports: [], consultUsedThisShift: false,
    });
    setWizardStep(1);
    setMenuState('SETUP');
  };

  const handleContinue = () => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    audio.playClick(); audio.stopMenuChiptune(); music.stopTrack();
    router.push("/hub");
  };

  const handleStart = () => {
    if (!nameInput.trim()) { setNameError(true); setWizardStep(1); return; }
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    audio.stopMenuChiptune(); music.stopTrack();
    setupPlayer(nameInput.trim(), genderInput, langInput, {
      ...look, bottomRamp: 'pants_charcoal', shoeRamp: 'shoes_black', hairStyle: 'short', topStyle: 'scrubs',
    }, uniInput);
    audio.playShiftStart();
    router.push("/hub");
  };

  const Choice = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => { audio.playClick(); onClick(); }}
      className={`flex-1 py-2 px-3 text-xl border-4 ${active ? 'border-[#ffd866] bg-[#3f7fc0] text-white' : 'border-[#0b1626] bg-[#16263f] text-[#a9bfd9] hover:text-white'}`}>
      {children}
    </motion.button>
  );

  return (
    <div className="absolute inset-0 bg-[#16263f] font-pixel text-white overflow-hidden select-none">
      {/* Floor-tile dither backdrop */}
      <div className="absolute inset-0 opacity-40 dither-light" />

      <AnimatePresence mode="wait">
        {menuState === 'INTRO' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-50 bg-[#0b1626] flex flex-col items-center justify-center gap-3 cursor-pointer" 
            onClick={() => setMenuState('SPLASH')}
          >
            <p className="text-xl tracking-[0.4em] text-[#a9bfd9]">{t('title.presents')}</p>
            <p className="font-heading text-2xl text-white mt-3">CODE RAMA</p>
            <p className="text-lg text-[#6d82a3] mt-6">{t('title.credit_dev')}</p>
            <p className="text-lg text-[#6d82a3]">{t('title.credit_concept')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left: the isometric ward with slow panning */}
      <div className="absolute left-0 top-0 bottom-0 w-[58%] flex items-center justify-center p-6">
        <motion.img 
          src="/assets/ui/ward_iso.png" alt="" 
          animate={{ x: [0, -15, 0], y: [0, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="max-w-full max-h-full" style={{ imageRendering: 'pixelated', scale: 1.05 }} 
        />
        <AnimatePresence>
          {(menuState === 'MENU' || menuState === 'SPLASH') && (
            <motion.div 
              key="characters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-[9%] left-[46%] flex items-end gap-2 pointer-events-none"
            >
              <SpriteWalker sheet="doctor" dir="down" walking={false} scale={1.5} />
              <SpriteWalker sheet="nurse" dir="left" walking fps={4} scale={1.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: logo and menus */}
      <div className="absolute right-0 top-0 bottom-0 w-[42%] flex flex-col items-center justify-center gap-3 p-6 z-10">
        <AnimatePresence mode="wait">
          {menuState !== 'SETUP' && (
            <motion.img 
              key="logo"
              initial={{ opacity: 0, scale: 0.8, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", bounce: 0.5 }}
              src="/assets/ui/logo.png" alt="CODE RAMA" 
              className="w-[48%] max-w-[260px]" style={{ imageRendering: 'pixelated' }} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {menuState === 'SPLASH' && (
            <motion.button 
              key="splash-btn"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleSplashTap} className="mt-4 text-3xl text-[#ffd866] blink"
            >
              {t('title.press_start')}
            </motion.button>
          )}

          {menuState === 'MENU' && (
            <motion.div 
              key="menu-opts"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-stretch gap-2 w-[70%] max-w-[320px]"
            >
              {xp > 0 && <PixelButton variant="success" onClick={handleContinue}>{t('title.continue')}</PixelButton>}
              <PixelButton variant={xp > 0 ? 'secondary' : 'success'} onClick={handleNewGame}>{t('title.new_game')}</PixelButton>
              <PixelButton variant="primary" onClick={() => router.push('/cases')}>{t('nav.cases')}</PixelButton>
              <PixelButton variant="secondary" onClick={() => setMenuState('SETTINGS')}>{t('nav.settings')}</PixelButton>
              <div className="flex gap-2">
                <PixelButton size="sm" variant="secondary" className="flex-1" onClick={() => setMenuState('ABOUT')}>{t('title.about')}</PixelButton>
                <PixelButton size="sm" variant="secondary" className="flex-1" onClick={() => setMenuState('CREDITS')}>{t('title.credits')}</PixelButton>
              </div>
              <div className="flex gap-2 mt-1">
                <Choice active={langInput === 'en'} onClick={() => pickLang('en')}>English</Choice>
                <Choice active={langInput === 'th'} onClick={() => pickLang('th')}>ไทย</Choice>
              </div>
            </motion.div>
          )}

          {(menuState === 'ABOUT' || menuState === 'CREDITS') && (
            <motion.div key="about" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-[86%]">
              <PixelPanel variant="wood" title={menuState === 'ABOUT' ? t('title.about') : t('title.credits')}>
                <p className="text-xl leading-snug whitespace-pre-line">{menuState === 'ABOUT' ? t('title.about_body') : t('title.credits_body')}</p>
                <PixelButton size="sm" variant="secondary" className="mt-3" onClick={() => setMenuState('MENU')}>{t('nav.back')}</PixelButton>
              </PixelPanel>
            </motion.div>
          )}
        </AnimatePresence>

        <SettingsMenu isOpen={menuState === 'SETTINGS'} onClose={() => setMenuState('MENU')} />
      </div>

      {/* Setup wizard */}
      <AnimatePresence>
        {menuState === 'SETUP' && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 z-20 bg-[#0b1626]/60 flex items-center justify-center p-8"
          >
            <PixelPanel variant="wood" title={t('title.setup_step', { n: wizardStep })} className="w-[880px] max-w-full">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={wizardStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  {wizardStep === 1 && (
                    <div className="flex gap-5 items-center">
                      <div className="shrink-0 bg-[#c7dafa] border-4 border-[#0b1626] p-2"><SpriteWalker sheet="doctor" dir="down" walking={false} /></div>
                      <div className="flex-1 space-y-3">
                        <div className="inline-block px-2 bg-[#f3f6ff] border-2 border-[#0b1626] text-[#254671] text-lg">Prof. Somchai</div>
                        <p className="text-2xl leading-snug">{t('title.ask_name')}</p>
                        <div className={`flex items-center gap-2 bg-[#0b1626] border-4 ${nameError ? 'border-[#dd363d]' : 'border-[#2c4a73]'} px-3 py-2 text-2xl`}>
                          <span className="text-[#a9bfd9]">{t('title.ms_prefix')}</span>
                          <input autoFocus value={nameInput} maxLength={18} onChange={(e) => { setNameInput(e.target.value); setNameError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && nameInput.trim() && setWizardStep(2)}
                            placeholder={t('title.name_placeholder')} className="flex-1 bg-transparent outline-none select-text text-white" />
                        </div>
                        {nameError && <p className="text-lg text-[#ef5b5f]">{t('title.name_required')}</p>}
                      </div>
                    </div>
                  )}
                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-lg text-[#b5e2ff] mb-1">{t('title.gender')}</div>
                        <div className="flex gap-2">
                          <Choice active={genderInput === 'M'} onClick={() => setGenderInput('M')}>{t('title.male')}</Choice>
                          <Choice active={genderInput === 'F'} onClick={() => setGenderInput('F')}>{t('title.female')}</Choice>
                          <Choice active={genderInput === 'O'} onClick={() => setGenderInput('O')}>{t('title.other')}</Choice>
                        </div>
                      </div>
                      <div>
                        <div className="text-lg text-[#b5e2ff] mb-1">{t('title.school')}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {SCHOOLS.map((s) => <Choice key={s.id} active={uniInput === s.id} onClick={() => setUniInput(s.id)}>{s[langInput]}</Choice>)}
                        </div>
                      </div>
                    </div>
                  )}
                  {wizardStep === 3 && <AppearancePicker value={look} onChange={(v) => setLook(v as typeof look)} />}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-5">
                <PixelButton variant="secondary" onClick={() => (wizardStep === 1 ? setMenuState('MENU') : setWizardStep(wizardStep - 1))}>{t('nav.back')}</PixelButton>
                {wizardStep < 3
                  ? <PixelButton variant="primary" onClick={() => { if (wizardStep === 1 && !nameInput.trim()) { setNameError(true); return; } setWizardStep(wizardStep + 1); }}>{t('title.next')}</PixelButton>
                  : <PixelButton variant="success" size="lg" onClick={handleStart}>{t('title.begin')}</PixelButton>}
              </div>
            </PixelPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
