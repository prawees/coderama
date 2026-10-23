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
  th: ["หน้าฝน พกร่มมาด้วยนะ", "ร้อนตับแลบ พัดลมสู้เต็มที่แล้ว", "ลมเย็นมาสักที", "หน้ามะม่วง ทุกคนอารมณ์ดี", "บ่ายนี้ฝนน่าจะตก", "ฟ้าใส เงียบจนน่าสงสัย", "แม่ค้าหน้าโรงพยาบาลมาตั้งร้านแต่เช้า"],
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
  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center pointer-events-none" data-testid="day-card">
      <div className="cozy-panel px-6 py-4 text-center animate-[cozyDayCard_2.6s_ease-in-out_forwards]">
        <div className="text-[44px] leading-none">วันที่ {day}</div>
        <div className="text-[18px] leading-tight mt-2">{WEEKDAYS.th[(day - 1) % 7]} ที่{LOCATION_NAMES[phase].th}</div>
        <div className="flex items-center justify-center gap-1.5 text-[16px] leading-tight mt-1.5 text-[#86522e]">
          <PixelIcon name="sun" size={14} />
          {MOODS.th[(day * 3) % MOODS.th.length]}
        </div>
      </div>
    </div>
  );
}
