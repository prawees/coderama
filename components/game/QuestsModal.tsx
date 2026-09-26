import { useERStore } from "@/lib/erStore";
import { QUEST_DATABASE } from "@/lib/quests";
import { PixelButton } from "../ui/PixelButton";
import { PixelPanel } from "../ui/PixelPanel";
import { useT } from "@/lib/i18n/useT";

interface QuestsModalProps { onClose: () => void; }

export function QuestsModal({ onClose }: QuestsModalProps) {
  const { t } = useT();
  const { activeQuests, completedQuests } = useERStore();
  const Row = ({ id, done }: { id: string; done?: boolean }) => {
    const q = QUEST_DATABASE[id];
    if (!q) return null;
    return (
      <div className={`border-4 p-2 ${done ? 'border-[#0b1626] bg-[#16263f] opacity-60' : 'border-[#3f7fc0] bg-[#16263f]'}`}>
        <div className={`text-xl ${done ? 'line-through text-[#a9bfd9]' : 'text-white'}`}>{t(`quest.${id}.title`)}</div>
        <div className="text-lg text-[#a9bfd9] leading-tight">{t(`quest.${id}.desc`)}</div>
        {!done && <div className="text-lg text-[#99e550]">{t('quest.reward')}: {q.rewardText}</div>}
      </div>
    );
  };
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0b1626]/80 p-4" onClick={onClose}>
      <div className="w-[520px] max-w-full" onClick={(e) => e.stopPropagation()}>
        <PixelPanel variant="wood" title={t('quest.log')}>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="text-lg text-[#b5e2ff]">{t('quest.active')}</div>
            {activeQuests.length === 0 ? <p className="text-lg text-[#a9bfd9]">{t('quest.none_active')}</p> : activeQuests.map((id) => <Row key={id} id={id} />)}
            <div className="text-lg text-[#b5e2ff] pt-2">{t('quest.done')}</div>
            {completedQuests.length === 0 ? <p className="text-lg text-[#a9bfd9]">{t('quest.none_done')}</p> : completedQuests.map((id) => <Row key={id} id={id} done />)}
          </div>
          <PixelButton variant="wood" className="w-full mt-3" onClick={onClose}>{t('set.close')}</PixelButton>
        </PixelPanel>
      </div>
    </div>
  );
}
