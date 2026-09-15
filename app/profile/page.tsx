"use client";

import { PixiPreview } from "@/components/game/PixiPreview";
import { useERStore, PlayerAppearance } from "@/lib/erStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { useRouter } from "next/navigation";

const HAIR_COLORS = ['#8b4513', '#fcd53f', '#000000', '#ff0000', '#ffffff'];
const TOP_COLORS = ['#ffffff', '#1f6feb', '#7ee787', '#ff7b72', '#ff69b4', '#9932cc'];
const BOTTOM_COLORS = ['#333333', '#161b22', '#ffffff', '#1f6feb'];
const SHOE_COLORS = ['#000000', '#ffffff', '#8b4513'];
const SKIN_COLORS = ['#ffc0cb', '#f1c27d', '#c68642', '#8d5524', '#3d2210'];

export default function ProfilePage() {
  const router = useRouter();
  const { appearance, setAppearance } = useERStore();

  const updateColor = (key: keyof PlayerAppearance, val: string) => {
    setAppearance({ [key]: val } as Partial<PlayerAppearance>);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 font-mono flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#58a6ff]">ID Badge</h1>
        <PixelButton onClick={() => router.push('/hub')}>Back to Hub</PixelButton>
      </div>

      <PixelPanel className="flex-1 flex flex-col items-center">
        <div className="bg-[#161b22] border-4 border-[#30363d] w-48 h-48 rounded flex items-center justify-center mb-6 shadow-lg shadow-black relative overflow-hidden">
          <div className="scale-150">
             <PixiPreview {...appearance} />
          </div>
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
            <label className="text-sm text-gray-400 mb-2 block">Shirt Color</label>
            <div className="flex gap-2 flex-wrap">
              {TOP_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => updateColor('topColor', c)}
                  className={`w-10 h-10 rounded border-2 ${appearance.topColor === c ? 'border-white' : 'border-[#30363d]'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Pants Color</label>
            <div className="flex gap-2 flex-wrap">
              {BOTTOM_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => updateColor('bottomColor', c)}
                  className={`w-10 h-10 rounded border-2 ${appearance.bottomColor === c ? 'border-white' : 'border-[#30363d]'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Shoe Color</label>
            <div className="flex gap-2 flex-wrap">
              {SHOE_COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => updateColor('shoeColor', c)}
                  className={`w-10 h-10 rounded border-2 ${appearance.shoeColor === c ? 'border-white' : 'border-[#30363d]'}`}
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
