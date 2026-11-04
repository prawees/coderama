"use client";

import { withBase } from "@/lib/basePath";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audio } from "@/lib/audio";
import { music } from "@/lib/music";
import { useERStore } from "@/lib/erStore";

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { sfxVolume, setSfxVolume, musicVolume, setMusicVolume } = useERStore();
  const [isMuted, setIsMuted] = useState(audio.isMuted);
  const [armedReset, setArmedReset] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMute(next);
    music.setMute(next);
    if (!next) audio.playClick();
  };

  // Two taps instead of a browser confirm box, which blocks the game on phones
  const hardReset = () => {
    if (!armedReset) { setArmedReset(true); setTimeout(() => setArmedReset(false), 4000); return; }
    localStorage.clear();
    window.location.href = withBase("/");
  };

  const exportSave = () => {
    const state = useERStore.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "coderama_save.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
    setNote("เซฟไฟล์ลงเครื่องแล้ว");
  };

  const importSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (ev) => {
      try {
        useERStore.setState(JSON.parse(ev.target?.result as string));
        setNote("โหลดเซฟแล้ว กำลังเปิดใหม่...");
        setTimeout(() => window.location.reload(), 700);
      } catch {
        setNote("ไฟล์นี้ไม่ใช่เซฟของ Code Rama");
      }
    };
  };

  const slider = (label: string, value: number, set: (v: number) => void) => (
    <label className="flex flex-col gap-1">
      <span className="text-[18px] leading-none">{label}</span>
      <input
        type="range" min="0" max="1" step="0.05" value={value}
        onChange={(e) => set(parseFloat(e.target.value))}
        className="w-full accent-[#5fae5a]"
      />
    </label>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1c1522]/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20 }}
            className="cozy-panel w-full max-w-xs p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
            data-testid="settings"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[26px] leading-none">ตั้งค่า</h2>
              <button className="cozy-btn px-2 py-0.5 text-lg leading-none" onClick={onClose} aria-label="close">✕</button>
            </div>

            <button onClick={toggleMute} className={`cozy-btn py-1.5 px-3 flex justify-between items-center text-[19px] ${isMuted ? "" : "cozy-btn-leaf"}`}>
              <span>เสียงในเกม</span>
              <span>{isMuted ? "ปิดอยู่" : "เปิดอยู่"}</span>
            </button>

            {slider("เสียงเอฟเฟกต์", sfxVolume, setSfxVolume)}
            {slider("เพลง", musicVolume, setMusicVolume)}

            <div className="flex gap-2">
              <button onClick={exportSave} className="cozy-btn cozy-btn-sky flex-1 py-1.5 text-[17px]">สำรองเซฟ</button>
              <button onClick={() => fileInputRef.current?.click()} className="cozy-btn flex-1 py-1.5 text-[17px]">โหลดเซฟ</button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={importSave} className="hidden" />
            </div>

            <button onClick={hardReset} className="cozy-btn cozy-btn-berry py-1.5 text-[17px]">
              {armedReset ? "แตะอีกครั้งเพื่อลบจริง" : "ลบเซฟ เริ่มใหม่หมด"}
            </button>

            {note && <p className="text-[16px] leading-snug text-center text-[#4f7a3a]">{note}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
