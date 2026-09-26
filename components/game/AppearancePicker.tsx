"use client";
import { SKIN_RAMPS, HAIR_RAMPS, SCRUB_RAMPS, Ramp } from "@/lib/palettes";
import { PixiPreview } from "@/components/game/PixiPreview";
import type { PlayerAppearance } from "@/lib/erStore";
import { useT } from "@/lib/i18n/useT";

type Look = Pick<PlayerAppearance, 'skinRamp' | 'hairRamp' | 'topRamp'>;

function Row({ label, ramps, value, onPick }: { label: string; ramps: Ramp[]; value?: string; onPick: (id: string) => void }) {
  const { lang } = useT();
  return (
    <div>
      <div className="text-lg text-[#b5e2ff] mb-1">{label}</div>
      <div className="flex flex-wrap gap-2">
        {ramps.map((r) => (
          <button key={r.id} title={r.name[lang]} onClick={() => onPick(r.id)}
            className={`w-11 h-11 border-4 flex flex-col overflow-hidden ${value === r.id ? 'border-[#ffd866] scale-110' : 'border-[#0b1626] hover:border-[#71abdb]'}`}>
            <span className="flex-1" style={{ background: r.highlight }} />
            <span className="flex-[2]" style={{ background: r.mid }} />
            <span className="flex-1" style={{ background: r.shadow }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Palette-swap customizer over the real doctor sprite. */
export function AppearancePicker({ value, onChange }: { value: Look; onChange: (v: Look) => void }) {
  const { t } = useT();
  return (
    <div className="flex gap-5 items-start">
      <div className="shrink-0 bg-[#c7dafa] border-4 border-[#0b1626] p-2 flex items-end justify-center" style={{ width: 144, height: 240 }}>
        <PixiPreview {...value} scale={2} />
      </div>
      <div className="flex-1 space-y-3">
        <Row label={t('look.skin')} ramps={SKIN_RAMPS} value={value.skinRamp} onPick={(id) => onChange({ ...value, skinRamp: id })} />
        <Row label={t('look.hair')} ramps={HAIR_RAMPS} value={value.hairRamp} onPick={(id) => onChange({ ...value, hairRamp: id })} />
        <Row label={t('look.scrubs')} ramps={SCRUB_RAMPS.filter((r) => r.id !== 'scrub_white')} value={value.topRamp} onPick={(id) => onChange({ ...value, topRamp: id })} />
      </div>
    </div>
  );
}
