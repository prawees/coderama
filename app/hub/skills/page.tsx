"use client";

import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PageTransition } from "@/components/ui/PageTransition";

const SKILLS_DB = [
  {
    id: "IRON_BLADDER",
    name: "กระเพาะปัสสาวะเหล็ก",
    description: "พลังงานสูงสุด +50 อยู่เวรได้นานขึ้นโดยไม่ล้ม",
    cost: 500,
  },
  {
    id: "CAFFEINE_ADDICT",
    name: "ติดกาแฟ",
    description: "กาแฟฟื้นพลังงาน 75 แทน 50 มือสั่นแถมให้ฟรี",
    cost: 750,
  },
  {
    id: "SPEED_READER",
    name: "อ่านเร็ว",
    description: "ได้เงินจากทุกเคสที่รักษาเพิ่ม 10% กวาดตาอ่าน chart ได้เร็วปานแสง",
    cost: 1000,
  }
];

export default function SkillsPage() {
  const router = useRouter();
  const { xp, unlockedSkills, unlockSkill } = useERStore();

  const handleUnlock = (skillId: string, cost: number) => {
    if (xp >= cost) {
      const success = unlockSkill(skillId, cost);
      if (success) {
        // success state handled globally
      }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-pixel-bg text-pixel-text font-pixel flex flex-col p-4 relative pb-[var(--safe-bottom)]">
        
        {/* Header */}
        <PixelPanel className="flex justify-between items-center mb-6 z-10 sticky top-[var(--safe-top)]" variant="dark">
          <div>
            <h1 className="text-2xl text-pixel-gold">ทักษะ</h1>
            <p className="text-sm text-gray-400">XP ที่ใช้ได้: {xp}</p>
          </div>
          <PixelButton onClick={() => router.push('/hub')} variant="alert">
            กลับ
          </PixelButton>
        </PixelPanel>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
          {SKILLS_DB.map((skill) => {
            const isUnlocked = unlockedSkills.includes(skill.id);
            const canAfford = xp >= skill.cost;
            
            return (
              <PixelPanel 
                key={skill.id} 
                className={`flex flex-col gap-4 ${isUnlocked ? 'border-pixel-gold opacity-80 bg-black' : 'border-gray-600 bg-[#3a2c3d]'}`}
                variant="dark"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl text-pixel-primary">{skill.name}</h2>
                  {isUnlocked && <span className="text-pixel-gold text-sm animate-pulse">ปลดล็อกแล้ว</span>}
                </div>
                <p className="text-gray-400 flex-grow text-sm">{skill.description}</p>
                
                {!isUnlocked && (
                  <PixelButton 
                    variant="primary"
                    disabled={!canAfford}
                    onClick={() => handleUnlock(skill.id, skill.cost)}
                    className={`w-full ${!canAfford ? 'opacity-50 grayscale' : ''}`}
                  >
                    {canAfford ? `ปลดล็อก (${skill.cost} XP)` : `ต้องมี ${skill.cost} XP`}
                  </PixelButton>
                )}
              </PixelPanel>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
