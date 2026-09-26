"use client";
import { useT } from "@/lib/i18n/useT";

/** Shown only on portrait phones/tablets. The game is authored for 16:9 landscape. */
export function RotateOverlay() {
  const { t } = useT();
  return (
    <div className="hidden portrait:flex fixed inset-0 z-[9999] bg-pixel-ink items-center justify-center flex-col gap-6 text-center p-8">
      <div className="w-24 h-40 border-4 border-pixel-text-muted relative animate-[spin_3s_steps(4)_infinite]">
        <div className="absolute inset-x-0 bottom-2 mx-auto w-6 h-1 bg-pixel-text-muted" />
      </div>
      <p className="font-heading text-sm text-pixel-gold leading-loose max-w-xs">{t('nav.rotate')}</p>
    </div>
  );
}
