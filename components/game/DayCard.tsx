"use client";

import { useEffect, useRef } from "react";
import { LOCATION_NAMES, Phase } from "@/lib/world/maps";
import { PixelIcon } from "@/components/ui/PixelIcon";

const WEEKDAYS = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  th: ["วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"],
};

const MOODS = {
  en: ["Rainy season. Bring an umbrella.", "Hot. The fans are trying their best.", "A breeze, finally.", "Mango season. Morale is up.", "Thunder in the afternoon, probably.", "Clear skies. Suspiciously quiet.", "The street vendors are out early."],
  th: ["หน้าฝน พกร่มด้วยนะ", "ร้อนมาก พัดลมพยายามเต็มที่แล้ว", "มีลมเย็นๆ ในที่สุด", "หน้ามะม่วง ขวัญกำลังใจดี", "บ่ายนี้ฟ้าน่าจะร้อง", "ฟ้าใส เงียบจนน่าสงสัย", "แม่ค้ามาตั้งร้านแต่เช้า"],
};

/** Title card when a shift begins: day, weekday, place, and a line about the weather */
export function DayCard({ day, phase, language, onDone }: { day: number; phase: Phase; language: "en" | "th"; onDone: () => void }) {
  // The hub re-renders every game minute, so keep the latest callback in a ref
  // instead of restarting the timer each time a new closure arrives.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => done.current(), 2600);
    return () => clearTimeout(t);
  }, [day]);
  const lang = language;
  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center pointer-events-none" data-testid="day-card">
      <div className="cozy-panel px-6 py-4 text-center animate-[cozyDayCard_2.6s_ease-in-out_forwards]">
        <div className="flex items-center justify-center gap-2 text-[15px] leading-none text-[#6b5258]">
          <PixelIcon name="sun" size={14} />
          {WEEKDAYS[lang][(day - 1) % 7]}
        </div>
        <div className="text-[44px] leading-none mt-1">{lang === "th" ? `วันที่ ${day}` : `Day ${day}`}</div>
        <div className="text-[17px] leading-none mt-1.5">{LOCATION_NAMES[phase][lang]}</div>
        <div className="text-[14px] leading-none mt-2 text-[#6b5258]">{MOODS[lang][(day * 3) % MOODS[lang].length]}</div>
      </div>
    </div>
  );
}
