"use client";

import { useERStore, PlayerAppearance } from "@/lib/erStore";
import { generateDoctorSprites } from "@/lib/assets";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

const HAIR_COLORS = ['#8b4513', '#fcd53f', '#000000', '#ff0000', '#ffffff'];
const SCRUB_COLORS = ['#1f6feb', '#7ee787', '#ff7b72', '#ff69b4', '#9932cc'];
const SKIN_COLORS = ['#ffc0cb', '#f1c27d', '#c68642', '#8d5524', '#3d2210'];

export default function ProfilePage() {
  const router = useRouter();
  const { appearance, setAppearance } = useERStore();
  const [sprites, setSprites] = useState<any>(null);

  useEffect(() => {
    setSprites(generateDoctorSprites(appearance));
  }, [appearance]);

  const updateColor = (key: keyof PlayerAppearance, val: string) => {
    setAppearance({ [key]: val });
  };

  if (!sprites) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 font-mono flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#58a6ff]">ID Badge</h1>
        <PixelButton onClick={() => router.push('/hub')}>Back to Hub</PixelButton>
      </div>

      <PixelPanel className="flex-1 flex flex-col items-center">
        <div className="bg-[#161b22] border-4 border-[#30363d] w-48 h-48 rounded flex items-center justify-center mb-6 shadow-lg shadow-black relative overflow-hidden">
          {/* Animated SVG Preview */}
          <img 
            src={sprites.DoctorIdle} 
            alt="Doctor Preview"
            className="w-32 h-32 pixelated animate-bounce" 
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Hair Style</label>
            <div className="flex gap-2">
              {HAIR_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => updateColor('hairColor', c)}
                  className={`w-10 h-10 rounded border-2 ${appearance.hairColor === c ? 'border-white' : 'border-[#30363d]'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Scrubs Color</label>
            <div className="flex gap-2">
              {SCRUB_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => updateColor('scrubsColor', c)}
                  className={`w-10 h-10 rounded border-2 ${appearance.scrubsColor === c ? 'border-white' : 'border-[#30363d]'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Skin Tone</label>
            <div className="flex gap-2">
              {SKIN_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => updateColor('skinColor', c)}
                  className={`w-10 h-10 rounded border-2 ${appearance.skinColor === c ? 'border-white' : 'border-[#30363d]'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </PixelPanel>
    </div>
  );
}
