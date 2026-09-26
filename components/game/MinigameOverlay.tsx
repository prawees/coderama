"use client";

import { useEffect, useRef, useState } from "react";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { audio } from "@/lib/audio";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useT } from "@/lib/i18n/useT";

interface MinigameOverlayProps {
  interventionName: string;
  onComplete: (success: boolean) => void;
  /** Fires on every successful compression - the 3D patient jolts on this. */
  onBeat?: () => void;
}

/**
 * Timing-bar minigame.
 *  - Standard intervention: one hit in the green zone.
 *  - CPR: metronome locked to 110 bpm, 5 compressions required, ≤2 misses.
 *    Each landed compression calls onBeat() so the 3D model physically jolts.
 */
export function MinigameOverlay({ interventionName, onComplete, onBeat }: MinigameOverlayProps) {
  const { t } = useT();
  const isCPR = /cpr|compression|กดหน้าอก/i.test(interventionName);
  const TOTAL = isCPR ? 5 : 1;
  const MAX_MISS = isCPR ? 2 : 0;

  const [cursorPos, setCursorPos] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<"none" | "hit" | "miss">("none");
  const [feedback, setFeedback] = useState<"idle" | "success" | "fail">("idle");
  const [shake, setShake] = useState(false);
  const dir = useRef(1);
  const last = useRef<number | null>(null);
  const resolved = useRef(false);
  const posRef = useRef(0);

  // 110 bpm ⇒ one full sweep (0→100→0) per two beats; one-way traversal = 60/110 s
  const speed = isCPR ? 100 / (60 / 110) : 120;
  const targetStart = isCPR ? 44 : 40;
  const targetEnd = isCPR ? 56 : 60;

  useEffect(() => {
    let raf: number;
    const loop = (ts: number) => {
      if (resolved.current) return;
      if (last.current === null) last.current = ts;
      const dt = Math.min((ts - last.current) / 1000, 0.1);
      last.current = ts;
      let next = posRef.current + dir.current * speed * dt;
      if (next >= 100) { next = 100; dir.current = -1; } else if (next <= 0) { next = 0; dir.current = 1; }
      posRef.current = next;
      setCursorPos(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  const finish = (ok: boolean) => {
    resolved.current = true;
    setFeedback(ok ? "success" : "fail");
    if (ok) { Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); audio.playClick(); }
    else { Haptics.notification({ type: NotificationType.Error }).catch(() => {}); setShake(true); }
    setTimeout(() => onComplete(ok), ok ? 400 : 600);
  };

  const handleAction = () => {
    if (resolved.current) return;
    const p = posRef.current;
    if (p >= targetStart && p <= targetEnd) {
      audio.playClick();
      onBeat?.();
      setFlash("hit"); setTimeout(() => setFlash("none"), 120);
      const h = hits + 1; setHits(h);
      if (h >= TOTAL) finish(true);
    } else {
      setFlash("miss"); setTimeout(() => setFlash("none"), 160);
      Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
      const m = misses + 1; setMisses(m);
      if (m > MAX_MISS) finish(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); handleAction(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hits, misses]);

  const border = feedback === 'success' ? 'border-[#99e550]' : feedback === 'fail' ? 'border-[#d95763]' : flash === 'hit' ? 'border-[#99e550]' : flash === 'miss' ? 'border-[#d95763]' : 'border-[#333c57]';

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-pixel-ink/85 dither">
      <div className={`w-[560px] max-w-[90%] ${shake ? 'animate-shake' : ''}`}>
        <PixelPanel variant="metal" className="p-0">
          <div className={`flex flex-col items-center p-6 gap-4 border-4 ${border} bg-pixel-ink`}>
            <div className="w-full flex justify-between items-center border-b-4 border-[#333c57] pb-2">
              <span className="text-[#d95763] font-heading text-[10px] tracking-widest blink">{t('mini.header')}</span>
              <span className="text-[#99e550] text-lg">{isCPR ? t('mini.cpr_rate') : 'STABLE'}</span>
            </div>

            <h3 className="text-3xl text-white text-center">{interventionName}</h3>

            {isCPR && (
              <div className="flex gap-2">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <div key={i} className={`w-8 h-8 border-4 border-pixel-ink ${i < hits ? 'bg-[#99e550]' : 'bg-[#333c57]'}`} />
                ))}
                <span className="ml-3 text-xl text-pixel-text-muted self-center">{t('mini.compressions', { n: hits, total: TOTAL })}</span>
              </div>
            )}

            <p className={`text-xl px-4 py-1 ${feedback === 'success' ? 'text-[#99e550]' : feedback === 'fail' ? 'text-[#d95763]' : 'text-pixel-text-muted'}`}>
              {feedback === 'success' ? t('mini.perfect') : feedback === 'fail' ? t('mini.missed') : t('mini.target')}
            </p>

            <div className="w-full h-14 bg-black border-4 border-[#333c57] relative cursor-pointer overflow-hidden scanlines" onClick={handleAction}>
              <div className="absolute top-0 bottom-0 bg-[#38b764]" style={{ left: `${targetStart}%`, width: `${targetEnd - targetStart}%` }} />
              <div className="absolute top-0 bottom-0 w-1 bg-[#99e550]" style={{ left: `${targetStart}%` }} />
              <div className="absolute top-0 bottom-0 w-1 bg-[#99e550]" style={{ left: `${targetEnd}%` }} />
              <div className={`absolute top-0 bottom-0 w-2 ${flash === 'miss' ? 'bg-[#d95763]' : 'bg-white'}`} style={{ left: `calc(${cursorPos}% - 4px)` }} />
            </div>

            <p className="text-lg text-pixel-text-muted">{feedback === 'idle' ? t('mini.hint') : t('mini.processing')}</p>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
