"use client";

import { useEffect, useRef } from "react";
import { LOCATION_NAMES, Phase } from "@/lib/world/maps";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { weatherLine } from "@/lib/weather";
import { NPCS, birthdayOn } from "@/lib/npcs";

const WEEKDAYS = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  th: ["วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"],
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
  const weather = weatherLine(day);
  const bday = birthdayOn(day, phase);
  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center pointer-events-none" data-testid="day-card">
      <div className="cozy-panel px-6 py-4 text-center animate-[cozyDayCard_2.6s_ease-in-out_forwards]">
        <div className="text-[44px] leading-none">วันที่ {day}</div>
        <div className="text-[18px] leading-tight mt-2">{WEEKDAYS.th[(day - 1) % 7]} ที่{LOCATION_NAMES[phase].th}</div>
        <div className="flex items-center justify-center gap-1.5 text-[16px] leading-tight mt-1.5 text-[#86522e]">
          <PixelIcon name={weather.icon} size={14} />
          {weather.th}
        </div>
        {bday && <div className="text-[16px] leading-tight mt-1 text-[#a93c4b]">วันนี้วันเกิด{NPCS[bday].name.th}</div>}
      </div>
    </div>
  );
}
