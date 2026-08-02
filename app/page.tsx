"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export default function RootPage() {
  const router = useRouter();
  const { setupPlayer, playerName, playerGender, language } = useERStore();

  const [nameInput, setNameInput] = useState(playerName === "Player" ? "" : playerName);
  const [genderInput, setGenderInput] = useState<'M' | 'F' | 'O'>(playerGender);
  const [langInput, setLangInput] = useState<'en' | 'th'>(language);

  const handleStart = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    if (!nameInput.trim()) {
      alert(langInput === "th" ? "กรุณาใส่ชื่อของคุณ!" : "Please enter your name!");
      return;
    }
    setupPlayer(nameInput.trim(), genderInput, langInput);
    router.push("/hub");
  };

  return (
    <div className="min-h-screen bg-pixel-bg text-pixel-text font-pixel flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-pixel-primary drop-shadow-md mb-2">ER HERO</h1>
          <p className="text-pixel-text-muted text-sm tracking-widest uppercase">
            {langInput === "th" ? "เริ่มกะเวรของคุณ" : "Start your shift"}
          </p>
        </div>

        <PixelPanel variant="dark" className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-pixel-accent uppercase text-sm">
              {langInput === "th" ? "ชื่อของคุณ" : "Your Name"}
            </label>
            <input 
              type="text" 
              className="w-full bg-gray-900 border-2 border-gray-700 rounded p-3 text-white font-pixel outline-none focus:border-pixel-primary transition-colors"
              placeholder={langInput === "th" ? "เช่น ประวีร์" : "e.g. Prawee"}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={15}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-pixel-accent uppercase text-sm">
              {langInput === "th" ? "เพศ" : "Gender"}
            </label>
            <div className="flex gap-2">
              <PixelButton 
                variant={genderInput === 'M' ? 'primary' : 'secondary'} 
                className="flex-1 py-2 text-xs"
                onClick={() => { Haptics.impact({style: ImpactStyle.Light}); setGenderInput('M'); }}
              >
                {langInput === "th" ? "ชาย" : "M"}
              </PixelButton>
              <PixelButton 
                variant={genderInput === 'F' ? 'primary' : 'secondary'} 
                className="flex-1 py-2 text-xs"
                onClick={() => { Haptics.impact({style: ImpactStyle.Light}); setGenderInput('F'); }}
              >
                {langInput === "th" ? "หญิง" : "F"}
              </PixelButton>
              <PixelButton 
                variant={genderInput === 'O' ? 'primary' : 'secondary'} 
                className="flex-1 py-2 text-xs"
                onClick={() => { Haptics.impact({style: ImpactStyle.Light}); setGenderInput('O'); }}
              >
                {langInput === "th" ? "อื่นๆ" : "Other"}
              </PixelButton>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-pixel-accent uppercase text-sm">
              Language / ภาษา
            </label>
            <div className="flex gap-2">
              <PixelButton 
                variant={langInput === 'en' ? 'primary' : 'secondary'} 
                className="flex-1 py-2 text-xs"
                onClick={() => { Haptics.impact({style: ImpactStyle.Light}); setLangInput('en'); }}
              >
                English
              </PixelButton>
              <PixelButton 
                variant={langInput === 'th' ? 'primary' : 'secondary'} 
                className="flex-1 py-2 text-xs"
                onClick={() => { Haptics.impact({style: ImpactStyle.Light}); setLangInput('th'); }}
              >
                ไทย
              </PixelButton>
            </div>
          </div>

          <div className="pt-4">
            <PixelButton variant="success" className="w-full py-4 text-xl animate-pulse" onClick={handleStart}>
              {langInput === "th" ? "เริ่มเกม!" : "START GAME!"}
            </PixelButton>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
