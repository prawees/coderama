"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CASE_DATA } from "@/lib/caseIndex";
import { patientFor } from "@/lib/patients";
import { audio } from "@/lib/audio";
import { useERStore, useHydrated } from "@/lib/erStore";
import { PatientPortrait } from "@/components/game/PixelPortrait";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelLogo } from "@/components/game/PixelLogo";
import { DARE_KEY } from "@/components/game/DailyResult";
import { outcomeNote, shareLink } from "@/lib/invite";
import { readExtra } from "@/lib/dailyExtra";
import {
  dailyCaseId, dailyDareUrl, dailyLine, dailyNumber, fmtClock, liveStreak, msToNextDaily, readDaily, readDailyDare,
  type DailyDare, type DailyResult,
} from "@/lib/daily";

const two = (n: number) => String(n).padStart(2, "0");
const countdown = (ms: number) => { const s = Math.floor(ms / 1000); return `${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`; };

/**
 * เคสประจำวัน. Everyone gets the same patient today. This page is also where a friend's dare lands, so it has to
 * work for someone who has never opened the game: no save needed, one button to start.
 */
export default function DailyPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { playerName, tutorialCompleted, currentDay, xp } = useERStore();
  const hasSave = tutorialCompleted || currentDay > 1 || xp > 0;
  const [n, setN] = useState(0);
  const [mine, setMine] = useState<DailyResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState<(DailyResult | null)[]>([]);
  const [dare, setDare] = useState<DailyDare | null>(null);
  const [left, setLeft] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [extra, setExtra] = useState<{ dx: boolean; algo: number | null }>({ dx: false, algo: null });

  // Everything here depends on the clock and this device, so it is read after the page mounts
  useEffect(() => {
    const today = dailyNumber();
    const st = readDaily();
    setN(today);
    setMine(st.results[String(today)] ?? null);
    setStreak(liveStreak(st, today));
    setWeek(Array.from({ length: 7 }, (_, i) => st.results[String(today - 6 + i)] ?? null));
    const ex = readExtra();
    setExtra({ dx: !!ex.dx[String(today)], algo: ex.algo[String(today)]?.score ?? null });
    const d = readDailyDare(window.location.search);
    setDare(d);
    try { if (d) sessionStorage.setItem(DARE_KEY, window.location.search); } catch { /* private mode */ }
    const tick = () => setLeft(msToNextDaily());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!n || !hydrated) return <div className="h-[100dvh] cozy-night" />;
  const caseId = dailyCaseId(n);
  const data = (CASE_DATA as Record<string, any>)[caseId];
  const who = patientFor(caseId);
  const dareToday = dare && dare.day === n ? dare : null;
  const friend = dare?.name ?? "เพื่อน";

  const play = () => { audio.playClick(); router.push(`/simulator/play/${caseId}?daily=1`); };
  const sendDare = async () => {
    if (!mine) return;
    audio.playClick();
    const me = hasSave && playerName && playerName !== "Doctor" ? playerName : null;
    setNote(outcomeNote[await shareLink(`Code Rama Daily Case #${n} ${dailyLine(mine)}`, dailyDareUrl(n, mine, me))]);
  };

  return (
    <div className="h-[100dvh] cozy-night text-pixel-text font-pixel flex flex-col items-center p-3 gap-2.5 overflow-y-auto" data-testid="daily">
      <div className="w-full max-w-sm flex items-center justify-between">
        <button onClick={() => router.push("/")} className="cozy-btn px-2.5 py-1 text-[16px] leading-none" data-testid="daily-home">กลับ</button>
        <PixelLogo scale={2} />
      </div>

      <div className="cozy-panel w-full max-w-sm p-3 flex flex-col gap-2.5">
        <div className="flex items-end justify-between">
          <h1 className="text-[30px] leading-none">Daily Case</h1>
          <span className="cozy-tag !bg-[#ffd66b] px-2 py-0.5 text-[18px] leading-none" data-testid="daily-number">#{n}</span>
        </div>

        {dare && (
          <div className="rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#ffd66b] px-2.5 py-2" data-testid="daily-dare-banner">
            {dareToday
              ? <><p className="text-[20px] leading-none text-[#7a3f24]">{friend}ท้าคุณ!</p><p className="text-[16px] leading-snug mt-1">{dailyLine(dareToday.result)}</p></>
              : <p className="text-[16px] leading-snug">คำท้าของ{friend}เป็นเคสวันก่อน</p>}
          </div>
        )}

        <div className="flex gap-2.5 items-start rounded-[4px] border-2 border-[#e7d3a8] bg-[#fff6e3] p-2" data-testid="daily-patient">
          <div className="w-16 h-16 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">
            <PatientPortrait seed={caseId} sex={data?.sex} ageGroup={data?.patientAppearance?.ageGroup} skinTone={data?.patientAppearance?.skinTone} age={parseFloat(data?.age)} className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <p className="text-[20px] leading-none">{who ? `${who.name.th} ${who.age.th}` : "คนไข้วันนี้"}</p>
            <p className="text-[15px] leading-snug mt-1 text-[#86522e]">{data?.chiefComplaint}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[17px] leading-none" data-testid="daily-page-streak">Streak {streak}</p>
          <div className="flex gap-1" aria-label="เจ็ดวันล่าสุด" data-testid="daily-week">
            {week.map((r, i) => (
              <span key={i} title={r ? `${r.stars} ดาว` : "ไม่ได้เล่น"}
                className={`w-5 h-5 rounded-[3px] border-2 border-[#3a2a2f] ${!r ? "bg-[#e7d3a8]" : r.stars === 3 ? "bg-[#5fae5a]" : r.stars === 2 ? "bg-[#ffd66b]" : r.stars === 1 ? "bg-[#f0a35e]" : "bg-[#e06b72]"} ${i === 6 ? "outline outline-2 outline-offset-1 outline-[#3a2a2f]" : ""}`} />
            ))}
          </div>
        </div>

        {!mine ? (
          <button onClick={play} className="cozy-btn cozy-btn-leaf w-full py-3 text-[26px] leading-none" data-testid="daily-play">Play</button>
        ) : (
          <div className="flex flex-col gap-2" data-testid="daily-done">
            <div className="rounded-[4px] border-2 border-[#5fae5a] bg-[#dff3d2] px-2.5 py-2 flex items-center gap-2">
              <span className="flex gap-0.5">{[0, 1, 2].map((i) => <PixelIcon key={i} name={i < mine.stars ? "star" : "starEmpty"} size={22} />)}</span>
              <span className="text-[22px] leading-none tabular-nums">{fmtClock(mine.secs)}</span>
              <span className="text-[15px] leading-none">{mine.dxFirst ? "Dx ถูกครั้งแรก" : "Dx รอบสอง"}</span>
            </div>
            <p className="text-center text-[16px] leading-none text-[#86522e]">Next <span className="tabular-nums text-[#3a2a2f]" data-testid="daily-countdown">{countdown(left)}</span></p>
            <button onClick={sendDare} className="cozy-btn cozy-btn-sky w-full py-2 text-[20px] leading-none" data-testid="daily-page-dare">ท้าเพื่อน</button>
            {note && <p className="text-center text-[15px] leading-none text-[#86522e]">{note}</p>}
            <button onClick={play} className="cozy-btn w-full py-1.5 text-[16px] leading-none" data-testid="daily-replay">เล่นซ้ำ</button>
          </div>
        )}
      </div>

      {/* Two quicker ones for the same day */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-2">
        <button onClick={() => { audio.playClick(); router.push("/daily/dx"); }} className="cozy-panel p-2.5 text-left" data-testid="daily-dx-link">
          <span className="block text-[20px] leading-none">Dx Guess</span>
          {extra.dx && <span className="block text-[15px] leading-none mt-1 text-[#3f8a48]">Done</span>}
        </button>
        <button onClick={() => { audio.playClick(); router.push("/daily/algo"); }} className="cozy-panel p-2.5 text-left" data-testid="daily-algo-link">
          <span className="block text-[20px] leading-none">Algorithm</span>
          {extra.algo !== null && <span className="block text-[15px] leading-none mt-1 text-[#3f8a48]">{extra.algo} pts</span>}
        </button>
        <button onClick={() => { audio.playClick(); router.push("/quiz"); }} className="cozy-panel p-2.5 text-left col-span-2" data-testid="daily-quiz-link">
          <span className="block text-[20px] leading-none">หมอ ER สายไหน</span>
        </button>
      </div>

    </div>
  );
}
