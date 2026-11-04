"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

interface MinigameOverlayProps {
  interventionName: string;
  /** rate is the average compressions per minute the player kept */
  onComplete: (success: boolean, rate: number) => void;
}

/** Compressions to deliver, and how many at the start are warm-up and not scored */
const TOTAL = 15;
const WARMUP = 2;
const LOW = 100;
const HIGH = 120;

/** Where a rate sits on the gauge, 60 to 160 per minute */
const gaugePct = (rate: number) => Math.max(0, Math.min(100, ((rate - 60) / 100) * 100));

/**
 * CPR at the right rate. The player compresses with taps (or Space), and the game measures
 * the rate from the gaps between them. Pass is an average of 100 to 120 per minute with most
 * compressions inside that window, the number every ACLS course drills.
 */
export function MinigameOverlay({ interventionName, onComplete }: MinigameOverlayProps) {
  const [taps, setTaps] = useState<number[]>([]);
  const [press, setPress] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; rate: number } | null>(null);
  const done = useRef(false);

  const intervals = taps.slice(1).map((t, i) => t - taps[i]);
  const recent = intervals.slice(-4);
  const liveRate = recent.length ? Math.round(60000 / (recent.reduce((a, b) => a + b, 0) / recent.length)) : 0;

  const compress = () => {
    if (done.current) return;
    setPress(true);
    setTimeout(() => setPress(false), 90);
    audio.playClick();
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    setTaps((prev) => {
      const next = [...prev, performance.now()];
      if (next.length >= TOTAL && !done.current) {
        done.current = true;
        const scored = next.slice(WARMUP).slice(1).map((t, i) => t - next.slice(WARMUP)[i]);
        const avg = scored.reduce((a, b) => a + b, 0) / scored.length;
        const rate = Math.round(60000 / avg);
        const inWindow = scored.filter((ms) => { const r = 60000 / ms; return r >= LOW - 5 && r <= HIGH + 5; }).length;
        const ok = rate >= LOW && rate <= HIGH && inWindow >= Math.ceil(scored.length * 0.7);
        setResult({ ok, rate });
        if (ok) Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        else Haptics.notification({ type: NotificationType.Error }).catch(() => {});
        setTimeout(() => onComplete(ok, rate), 1100);
      }
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (!e.repeat) compress(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shownRate = result ? result.rate : liveRate;
  const inZone = shownRate >= LOW && shownRate <= HIGH;
  const count = Math.min(taps.length, TOTAL);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1c1522]/75 font-pixel" data-testid="cpr-minigame">
      <div className="w-[90%] max-w-sm">
        <div className="cozy-panel flex flex-col items-center p-4 gap-3">
          <div className="w-full flex justify-between items-center text-[15px] leading-none text-[#86522e]">
            <span>CPR เป้า 100 ถึง 120 ครั้ง/นาที</span>
            <span className="cozy-tag px-1.5 py-0.5 tabular-nums">{count}/{TOTAL}</span>
          </div>

          <h3 className="text-[22px] leading-tight text-center">{interventionName}</h3>
          <p className="text-[15px] leading-snug text-center text-[#5b4148]">
            กดตามจังหวะที่คิดว่าใช่ นับในใจ "หนึ่งและสองและ" หรือจังหวะเพลง Stayin&apos; Alive ลึก 5 ถึง 6 cm แล้วปล่อยให้หน้าอกคืนตัวเต็มที่
          </p>

          {/* Rate gauge: 60 to 160 per minute, the green band is the target */}
          <div className="w-full">
            <div className="relative w-full h-6 rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#f6c3c6] overflow-hidden">
              <div className="absolute top-0 bottom-0 bg-[#86c35f]" style={{ left: `${gaugePct(LOW)}%`, width: `${gaugePct(HIGH) - gaugePct(LOW)}%` }} />
              {shownRate > 0 && (
                <div className="absolute top-0 bottom-0 w-[4px] bg-[#3a2a2f] transition-[left] duration-150" style={{ left: `calc(${gaugePct(shownRate)}% - 2px)` }} />
              )}
            </div>
            <div className="flex justify-between text-[12px] leading-none mt-1 text-[#86522e] tabular-nums">
              <span>60</span><span>100</span><span>120</span><span>160</span>
            </div>
          </div>

          <p className={`text-[26px] leading-none tabular-nums ${shownRate ? (inZone ? "text-[#3f8a48]" : "text-[#a93c4b]") : "text-[#86522e]"}`} data-testid="cpr-rate">
            {shownRate ? `${shownRate} /นาที` : "เริ่มกดได้เลย"}
          </p>

          {result ? (
            <p className={`text-[18px] leading-none px-3 py-1 rounded-[3px] border-2 border-[#3a2a2f] ${result.ok ? "bg-[#c8ecb4]" : "bg-[#f6c3c6]"}`}>
              {result.ok ? "จังหวะได้ เลือดไปเลี้ยงหัวใจและสมอง" : result.rate > HIGH ? "เร็วเกินไป" : "ช้าเกินไป"}
            </p>
          ) : (
            <button
              onPointerDown={(e) => { e.preventDefault(); compress(); }}
              className={`w-full h-24 rounded-[6px] border-[3px] border-[#3a2a2f] bg-[#ef7b68] text-[#fff6e3] text-[30px] leading-none select-none touch-none transition-transform ${press ? "scale-95 bg-[#d9504a]" : ""}`}
              data-testid="cpr-press"
            >
              กดหน้าอก
            </button>
          )}
          <p className="text-[13px] leading-none text-[#86522e]">แตะปุ่ม หรือกด Space</p>
        </div>
      </div>
    </div>
  );
}
