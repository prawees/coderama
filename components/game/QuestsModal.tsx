import { useERStore } from "@/lib/erStore";
import { QUEST_DATABASE } from "@/lib/quests";
import { PixelButton } from "../ui/PixelButton";
import { motion, AnimatePresence } from "framer-motion";
import { audio } from "@/lib/audio";

interface QuestsModalProps {
  onClose: () => void;
}

export function QuestsModal({ onClose }: QuestsModalProps) {
  const { activeQuests, completedQuests } = useERStore();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#2a1708] border-4 border-[#54341b] rounded-xl shadow-2xl overflow-hidden flex flex-col font-pixel"
        style={{ maxHeight: '80vh' }}
      >
        <div className="bg-[#1a0f05] border-b-4 border-[#54341b] p-4 flex justify-between items-center">
          <h2 className="text-xl text-pixel-gold font-bold">QUEST LOG</h2>
          <button 
            onClick={() => { audio.playClick(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center bg-red-600 border-2 border-red-800 rounded active:bg-red-400 text-white font-bold"
          >
            X
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="text-lg text-white border-b-2 border-gray-700 pb-1">Active Quests ({activeQuests.length})</h3>
          
          {activeQuests.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No active quests right now.</p>
          ) : (
            activeQuests.map(id => {
              const quest = QUEST_DATABASE[id];
              if (!quest) return null;
              return (
                <div key={id} className="bg-[#161b22] border-2 border-blue-500 rounded p-3 relative">
                  <div className="absolute -top-3 -right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full border border-white">
                    IN PROGRESS
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{quest.title}</h4>
                  <p className="text-xs text-gray-300 mb-2">{quest.description}</p>
                  <p className="text-xs font-bold text-pixel-success">Rewards: {quest.rewardText}</p>
                </div>
              );
            })
          )}

          <h3 className="text-lg text-white border-b-2 border-gray-700 pb-1 mt-6">Completed ({completedQuests.length})</h3>
          
          {completedQuests.length === 0 ? (
            <p className="text-sm text-gray-400 italic">You haven't completed any quests yet.</p>
          ) : (
            completedQuests.map(id => {
              const quest = QUEST_DATABASE[id];
              if (!quest) return null;
              return (
                <div key={id} className="bg-[#161b22] opacity-60 border-2 border-gray-600 rounded p-3 relative">
                  <div className="absolute -top-3 -right-2 bg-gray-600 text-white text-[10px] px-2 py-1 rounded-full border border-gray-400">
                    DONE
                  </div>
                  <h4 className="text-sm font-bold text-gray-300 mb-1 line-through">{quest.title}</h4>
                  <p className="text-xs text-gray-400">{quest.description}</p>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
