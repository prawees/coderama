"use client";

import { useState } from "react";
import type { PlayerAppearance, Rank } from "@/lib/erStore";
import { UNIFORMS, allowedUniforms, lockNote, uniformFor } from "@/lib/uniform";
import { audio } from "@/lib/audio";
import { PixelIcon } from "@/components/ui/PixelIcon";

export const SKIN = ["#ffdcc2", "#f4c7a1", "#e8b089", "#d19a6e", "#b97f55", "#9a6544"];
export const HAIR = ["#2c2328", "#5a3a2a", "#7a4a2c", "#8a3f2c", "#b8b2ad", "#d9739a", "#5b7fbf"];
/** Scrub colours wards actually use */
export const SCRUBS = ["#5b7fbf", "#3f4a6b", "#2f5f4f", "#6aa9a0", "#c98ad1", "#e07a8a", "#2c2328"];
/** Uniform trousers: dark and plain */
export const BOTTOM = ["#2c2328", "#3f4a6b", "#5a5466", "#4b4f63"];

/** Every hairstyle the sprite engine draws, by the names people use. Old saves hold hair_1 and hair_2. */
export const HAIRSTYLES: [string, string][] = [
  ["short", "ผมสั้น"], ["sidepart", "แสกข้าง"], ["spiky", "ผมตั้ง"], ["curly", "ผมหยิก"],
  ["long", "ผมยาว"], ["bob", "บ็อบ"], ["bun", "ดังโงะ"], ["ponytail", "มัดผม"],
];
export const hairKey = (v?: string) => (v === "hair_2" ? "long" : !v || v === "hair_1" ? "short" : v);

/** The locker: skin, hair, glasses, and the uniform your year wears. Locked uniforms say when they open. */
export function Wardrobe({ value, onChange, rank }: { value: PlayerAppearance; onChange: (patch: Partial<PlayerAppearance>) => void; rank: Rank }) {
  const [note, setNote] = useState<string | null>(null);
  const pick = (patch: Partial<PlayerAppearance>) => { audio.playClick(); setNote(null); onChange(patch); };
  const swatches = (label: string, key: keyof PlayerAppearance, options: string[]) => (
    <div className="flex flex-col gap-1">
      <span className="text-[15px] leading-none text-[#86522e]">{label}</span>
      <div className="flex gap-1 flex-wrap">
        {options.map((c) => (
          <button key={c} aria-label={`${label} ${c}`} onClick={() => pick({ [key]: c } as Partial<PlayerAppearance>)}
            className={`w-7 h-7 rounded-[3px] border-[3px] ${String(value[key] ?? "").toLowerCase() === c ? "border-[#3a2a2f] scale-110" : "border-[#c9a77a]"}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
  const hair = hairKey(value.hairStyle);
  const allowed = allowedUniforms(rank);
  const wearing = uniformFor(rank, value.topStyle);
  return (
    <div className="flex flex-col gap-2.5" data-testid="wardrobe">
      {swatches("สีผิว", "skinColor", SKIN)}
      {swatches("สีผม", "hairColor", HAIR)}
      <div className="flex flex-col gap-1">
        <span className="text-[15px] leading-none text-[#86522e]">ทรงผม</span>
        <div className="grid grid-cols-4 gap-1">
          {HAIRSTYLES.map(([v, label]) => (
            <button key={v} onClick={() => pick({ hairStyle: v })} data-testid={`hair-${v}`}
              className={`cozy-btn py-1 text-[15px] leading-none ${hair === v ? "cozy-btn-sky" : ""}`}>{label}</button>
          ))}
        </div>
      </div>
      <button onClick={() => pick({ glasses: !value.glasses })} aria-pressed={!!value.glasses} data-testid="glasses"
        className={`cozy-btn py-1 text-[15px] leading-none ${value.glasses ? "cozy-btn-sky" : ""}`}>{value.glasses ? "ใส่แว่น ✓" : "ใส่แว่น"}</button>
      <div className="flex flex-col gap-1">
        <span className="text-[15px] leading-none text-[#86522e]">ชุดขึ้นวอร์ด</span>
        <div className="grid grid-cols-2 gap-1">
          {UNIFORMS.map((u) => {
            const open = allowed.includes(u.id);
            return (
              <button key={u.id} data-testid={`uniform-${u.id}`} aria-disabled={!open}
                onClick={() => (open ? pick({ topStyle: u.id }) : (audio.playBump(), setNote(lockNote(u.id, rank))))}
                className={`cozy-btn py-1 text-[15px] leading-none ${wearing === u.id ? "cozy-btn-sky" : ""} ${open ? "" : "opacity-55"}`}>
                {open ? u.label : <span className="inline-flex items-center gap-1"><PixelIcon name="lock" size={12} />{u.label}</span>}
              </button>
            );
          })}
        </div>
        {note && <p className="text-[14px] leading-snug text-[#a93c4b]" data-testid="uniform-note">{note}</p>}
      </div>
      {wearing === "scrubs" ? (
        <>
          {swatches("สีสครับ", "topColor", SCRUBS)}
          <p className="text-[13px] leading-snug text-[#86522e]" data-testid="scrubs-set">สครับเป็นชุดเดียวกัน กางเกงสีเดียวกับเสื้อ</p>
        </>
      ) : swatches("สีกางเกง", "bottomColor", BOTTOM)}
    </div>
  );
}
