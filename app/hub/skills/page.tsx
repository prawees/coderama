"use client";

import { useRouter } from "next/navigation";
import { useERStore } from "@/lib/erStore";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PageTransition } from "@/components/ui/PageTransition";
import { useT } from "@/lib/i18n/useT";

const SKILLS_DB = [
  {
    id: "IRON_BLADDER",
    name: "Iron Bladder",
    description: "Max Energy +50. Work longer hours without collapsing.",
    cost: 500,
  },
  {
    id: "CAFFEINE_ADDICT",
    name: "Caffeine Addict",
    description: "Coffee restores 75 NRG instead of 50. Jitters included.",
    cost: 750,
  },
  {
    id: "SPEED_READER",
    name: "Speed Reader",
    description: "+10% Cash payout on all treated cases. You scan charts at lightspeed.",
    cost: 1000,
  }
];

export default function SkillsPage() {
  const router = useRouter();
  const { xp, unlockedSkills, unlockSkill } = useERStore();
  const { t } = useT();

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
            <h1 className="text-2xl text-pixel-gold">{t('skill.title')}</h1>
            <p className="text-lg text-[#a9bfd9]">{t('skill.xp', { n: xp })}</p>
          </div>
          <PixelButton onClick={() => router.push('/hub')} variant="alert">
            {t('nav.back_to_hub')}
          </PixelButton>
        </PixelPanel>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
          {SKILLS_DB.map((skill) => {
            const isUnlocked = unlockedSkills.includes(skill.id);
            const canAfford = xp >= skill.cost;
            
            return (
              <PixelPanel 
                key={skill.id} 
                className={`flex flex-col gap-4 ${isUnlocked ? 'border-pixel-gold opacity-80 bg-black' : 'border-gray-600 bg-[#161b22]'}`}
                variant="dark"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl text-[#b5e2ff]">{t(`skill.${skill.id}`)}</h2>
                  {isUnlocked && <span className="text-pixel-gold text-lg">{t('skill.unlocked')}</span>}
                </div>
                <p className="text-[#a9bfd9] flex-grow text-lg">{t(`skill.${skill.id}_desc`)}</p>
                
                {!isUnlocked && (
                  <PixelButton 
                    variant="primary"
                    disabled={!canAfford}
                    onClick={() => handleUnlock(skill.id, skill.cost)}
                    className={`w-full ${!canAfford ? 'opacity-50 grayscale' : ''}`}
                  >
                    {canAfford ? t('skill.unlock', { n: skill.cost }) : t('skill.need', { n: skill.cost })}
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
