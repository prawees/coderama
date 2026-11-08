"use client";

import type { PlayerAppearance } from "@/lib/erStore";
import { audio } from "@/lib/audio";

export const SKIN = ["#ffdcc2", "#f4c7a1", "#e8b089", "#d19a6e", "#b97f55", "#9a6544"];
export const HAIR = ["#2c2328", "#5a3a2a", "#7a4a2c", "#8a3f2c", "#b8b2ad", "#d9739a", "#5b7fbf"];
export const TOP = ["#ffffff", "#9fd3e6", "#86c35f", "#f4c7d8", "#ffd66b", "#c98ad1", "#e07a3a"];
export const BOTTOM = ["#333333", "#3f4a6b", "#5a5466", "#6e4428", "#2f5f4f"];

/** Every hairstyle the sprite engine draws. Old saves hold hair_1 and hair_2, read as short and long. */
export const HAIRSTYLES: [string, string][] = [
  ["short", "สั้น"], ["sidepart", "แสกข้าง"], ["spiky", "ตั้ง"], ["curly", "หยิก"],
  ["long", "ยาว"], ["bob", "บ๊อบ"], ["bun", "มวย"], ["ponytail", "หางม้า"],
];
export const hairKey = (v?: string) => (v === "hair_2" ? "long" : !v || v === "hair_1" ? "short" : v);

/** The locker: colours, hair, glasses and what you wear on the ward. Used at setup and on the ID card. */
export function Wardrobe({ value, onChange }: { value: PlayerAppearance; onChange: (patch: Partial<PlayerAppearance>) => void }) {
  const pick = (patch: Partial<PlayerAppearance>) => { audio.playClick(); onChange(patch); };
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
  return (
    <div className="flex flex-col gap-2.5" data-testid="wardrobe">
      {swatches("สีผิว", "skinColor", SKIN)}
      {swatches("สีผม", "hairColor", HAIR)}
      <div className="flex flex-col gap-1">
        <span className="text-[15px] leading-none text-[#86522e]">ทรงผม</span>
        <div className="grid grid-cols-4 gap-1">
          {HAIRSTYLES.map(([v, label]) => (
            <button key={v} onClick={() => pick({ hairStyle: v })} data-testid={`hair-${v}`}
              className={`cozy-btn py-1 text-[16px] leading-none ${hair === v ? "cozy-btn-sky" : ""}`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[["top_1", "เสื้อเชิ้ต"], ["top_2", "สครับ"]].map(([v, label]) => (
          <button key={v} onClick={() => pick({ topStyle: v })} className={`cozy-btn py-1 text-[16px] leading-none ${(value.topStyle || "top_1") === v ? "cozy-btn-sky" : ""}`}>{label}</button>
        ))}
        <button onClick={() => pick({ glasses: !value.glasses })} aria-pressed={!!value.glasses} data-testid="glasses"
          className={`cozy-btn py-1 text-[16px] leading-none ${value.glasses ? "cozy-btn-sky" : ""}`}>แว่น</button>
      </div>
      {swatches(value.topStyle === "top_2" ? "สีชุดสครับ" : "สีเสื้อ", "topColor", TOP)}
      {value.topStyle === "top_2" ? (
        <p className="text-[14px] leading-snug text-[#86522e]" data-testid="scrubs-set">สครับเป็นชุดเดียวกัน กางเกงสีเดียวกับเสื้อ</p>
      ) : swatches("สีกางเกง", "bottomColor", BOTTOM)}
    </div>
  );
}
