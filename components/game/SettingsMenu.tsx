"use client";

import { withBase } from "@/lib/basePath";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audio } from "@/lib/audio";
import { useERStore } from "@/lib/erStore";

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { sfxVolume, setSfxVolume, musicVolume, setMusicVolume } = useERStore();
  const [isMuted, setIsMuted] = useState(audio.isMuted);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.setMute(newMuted);
  };

  const hardReset = () => {
    if (confirm("Are you sure you want to completely erase your save data? This cannot be undone.")) {
       localStorage.clear();
       window.location.href = withBase('/');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportSave = () => {
    const state = useERStore.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "coderama_save.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          useERStore.setState(parsed);
          alert("Save imported successfully! Reloading...");
          window.location.reload();
        } catch (err) {
          alert("Invalid save file!");
        }
      };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#3a2c3d] border-4 border-[#6b4a3a] rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] min-w-[300px] text-white font-pixel"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl text-center text-[#7fc8d8] mb-6 drop-shadow-md">SETTINGS</h2>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={toggleMute}
                className="pixel-border px-4 py-3 bg-[#4a3848] border-[#2b2133] hover:bg-[#6b4a3a] rounded-lg transition-colors flex justify-between items-center"
              >
                <span>MUTE ALL</span>
                <span className={isMuted ? 'text-red-400' : 'text-green-400'}>
                  {isMuted ? 'MUTED' : 'ON'}
                </span>
              </button>

              <div className="bg-[#4a3848] rounded-lg p-4 border border-[#6b4a3a]">
                <label className="text-gray-400 text-sm mb-2 block">SFX VOLUME</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#7fc8d8]"
                />
              </div>

              <div className="bg-[#4a3848] rounded-lg p-4 border border-[#6b4a3a]">
                <label className="text-gray-400 text-sm mb-2 block">MUSIC VOLUME</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#7fc8d8]"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={exportSave}
                  className="flex-1 pixel-border px-2 py-2 bg-[#4f8fb0] hover:bg-[#6aa8c4] rounded text-white text-xs text-center transition-colors"
                >
                  EXPORT SAVE
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 pixel-border px-2 py-2 bg-[#5fae5a] hover:bg-[#86c35f] rounded text-white text-xs text-center transition-colors"
                >
                  IMPORT SAVE
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={importSave} 
                  className="hidden" 
                />
              </div>
              
              <button 
                onClick={hardReset}
                className="pixel-border px-4 py-3 bg-[#d95763] border-[#8e1519] hover:bg-[#e06b72] rounded-lg transition-colors text-white"
              >
                HARD RESET SAVE
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="mt-8 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-center text-sm"
            >
              CLOSE
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
