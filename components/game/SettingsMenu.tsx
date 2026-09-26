"use client";

import { useState, useRef } from "react";
import { audio } from "@/lib/audio";
import { useERStore } from "@/lib/erStore";
import { useT } from "@/lib/i18n/useT";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";

interface SettingsMenuProps { isOpen: boolean; onClose: () => void; }

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { t, lang } = useT();
  const { sfxVolume, setSfxVolume, musicVolume, setMusicVolume } = useERStore();
  const [isMuted, setIsMuted] = useState(audio.isMuted);
  const [confirmReset, setConfirmReset] = useState(false);
  const [note, setNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  const exportSave = () => {
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(useERStore.getState()));
    a.download = "coderama_save.json";
    a.click();
  };
  const importSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    f.text().then((txt) => {
      try { useERStore.setState(JSON.parse(txt)); setNote(t('set.imported')); setTimeout(() => window.location.reload(), 800); }
      catch { setNote(t('set.import_bad')); }
    });
  };
  const slider = (label: string, value: number, set: (v: number) => void) => (
    <label className="block">
      <div className="flex justify-between text-xl"><span className="text-[#b5e2ff]">{label}</span><span>{Math.round(value * 100)}%</span></div>
      <input type="range" min="0" max="1" step="0.05" value={value} onChange={(e) => set(parseFloat(e.target.value))} className="w-full accent-[#71abdb]" />
    </label>
  );

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-[#0b1626]/80" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-[460px] max-w-[92%]">
        <PixelPanel variant="wood" title={t('nav.settings')}>
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['en', 'th'] as const).map((l) => (
                <button key={l} onClick={() => { audio.playClick(); useERStore.setState({ language: l }); }}
                  className={`flex-1 py-1 text-xl border-4 ${lang === l ? 'border-[#ffd866] bg-[#3f7fc0]' : 'border-[#0b1626] bg-[#16263f] text-[#a9bfd9]'}`}>{l === 'en' ? 'English' : 'ไทย'}</button>
              ))}
            </div>
            <button onClick={() => { const m = !isMuted; setIsMuted(m); audio.setMute(m); }}
              className="w-full flex justify-between px-3 py-1 text-xl border-4 border-[#0b1626] bg-[#16263f]">
              <span>{t('set.mute')}</span><span className={isMuted ? 'text-[#ef5b5f]' : 'text-[#99e550]'}>{isMuted ? t('set.muted') : t('set.on')}</span>
            </button>
            {slider(t('set.sfx'), sfxVolume, setSfxVolume)}
            {slider(t('set.music'), musicVolume, setMusicVolume)}
            <div className="flex gap-2">
              <PixelButton size="sm" variant="primary" className="flex-1" onClick={exportSave}>{t('set.export')}</PixelButton>
              <PixelButton size="sm" variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>{t('set.import')}</PixelButton>
              <input ref={fileRef} type="file" accept=".json" onChange={importSave} className="hidden" />
            </div>
            {!confirmReset
              ? <PixelButton size="sm" variant="alert" className="w-full" onClick={() => setConfirmReset(true)}>{t('set.reset')}</PixelButton>
              : <div className="border-4 border-[#dd363d] p-2">
                  <p className="text-lg mb-2">{t('set.reset_confirm')}</p>
                  <div className="flex gap-2">
                    <PixelButton size="sm" variant="alert" className="flex-1" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>{t('set.reset_yes')}</PixelButton>
                    <PixelButton size="sm" variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>{t('cx.cancel')}</PixelButton>
                  </div>
                </div>}
            {note && <p className="text-lg text-[#ffd866]">{note}</p>}
            <PixelButton variant="wood" className="w-full" onClick={onClose}>{t('set.close')}</PixelButton>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
