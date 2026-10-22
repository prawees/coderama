import { useERStore } from "@/lib/erStore";
import { QUEST_DATABASE } from "@/lib/quests";
import { motion } from "framer-motion";
import { audio } from "@/lib/audio";
import { PixelIcon } from "@/components/ui/PixelIcon";

interface QuestsModalProps {
  onClose: () => void;
}

/** Quest log on a parchment scroll */
export function QuestsModal({ onClose }: QuestsModalProps) {
  const { activeQuests, completedQuests, language } = useERStore();
  const tr = (en: string, th: string) => (language === "th" ? th : en);
  const title = (id: string) => (language === "th" ? QUEST_DATABASE[id]?.title_th : QUEST_DATABASE[id]?.title);
  const desc = (id: string) => (language === "th" ? QUEST_DATABASE[id]?.description_th : QUEST_DATABASE[id]?.description);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] flex items-center justify-center bg-[#1c1522]/70 p-3" onClick={onClose}>
      <motion.div
        initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20 }}
        className="cozy-panel w-full max-w-sm max-h-[82%] flex flex-col p-3 font-pixel"
        onClick={(e) => e.stopPropagation()}
        data-testid="quests-modal"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-[26px] leading-none flex items-center gap-2"><PixelIcon name="quest" size={18} />{tr("Quest log", "สมุดภารกิจ")}</h2>
          <button onClick={() => { audio.playClick(); onClose(); }} className="cozy-btn px-2 py-0.5 text-lg leading-none" aria-label="close">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {activeQuests.length === 0 && <p className="text-[16px] text-[#6b5258] italic">{tr("No quests right now. Enjoy the quiet.", "ตอนนี้ไม่มีภารกิจ เพลินกับความเงียบไปก่อน")}</p>}
          {activeQuests.map((id) => QUEST_DATABASE[id] && (
            <div key={id} className="bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] p-2">
              <p className="text-[19px] leading-none">{title(id)}</p>
              <p className="text-[16px] leading-snug mt-1 text-[#5b4148]">{desc(id)}</p>
              <p className="text-[14px] leading-none mt-1.5 text-[#3f8a48] flex items-center gap-1"><PixelIcon name="coin" size={11} />{QUEST_DATABASE[id].rewardText}</p>
            </div>
          ))}
          {completedQuests.length > 0 && (
            <>
              <p className="text-[15px] leading-none text-[#86522e] mt-2">{tr("Done", "สำเร็จแล้ว")}</p>
              {completedQuests.map((id) => QUEST_DATABASE[id] && (
                <div key={id} className="flex items-center gap-2 text-[16px] text-[#6b5258]">
                  <span className="text-[#3f8a48]">✓</span><span className="line-through">{title(id)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
