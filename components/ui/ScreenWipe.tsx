"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "@/lib/transition";

export function ScreenWipe() {
  const router = useRouter();
  const { phase, label, setNavigator } = useTransition();

  useEffect(() => { setNavigator((p) => router.push(p)); }, [router, setNavigator]);

  if (phase === 'idle') return null;
  const cls = phase === 'covering' ? 'wipe-in' : phase === 'revealing' ? 'wipe-out' : '';

  return (
    <div className={`absolute inset-0 z-[5000] pointer-events-auto ${cls}`} style={{ clipPath: phase === 'covered' ? 'none' : undefined }}>
      <div className="absolute inset-0 bg-pixel-ink dither" />
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-pixel-gold text-lg tracking-widest">{label}</span>
        </div>
      )}
    </div>
  );
}
