"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { useERStore } from "@/lib/erStore";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { outcomeNote, shareLink } from "@/lib/invite";
import { dailyCoins, dailyDareUrl, dailyLine, dailyNumber, dailyVerdict, fmtClock, readDailyDare, recordDaily, type DailyResult as Result } from "@/lib/daily";

/** Where /daily leaves a friend's dare for the end of the case */
export const DARE_KEY = "coderama.dailyDare";

/**
 * The end of the case of the day: stars, the clock, the streak, how you did against the friend who dared you,
 * and the two ways to pass it on. The result is recorded once, when this first appears.
 */
export function DailyResult({ stars, dxFirst, openedAt, onShareCard }: { stars: number; dxFirst: boolean; openedAt: number; onShareCard: (r: Result, n: number, streak: number) => void }) {
  const n = dailyNumber();
  const [result, setResult] = useState<Result | null>(null);
  const [streak, setStreak] = useState(0);
  const [coins, setCoins] = useState(0);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const mine: Result = { stars, dxFirst, secs: Math.max(5, Math.round((Date.now() - openedAt) / 1000)) };
    const { state, first } = recordDaily(mine, n);
    const kept = state.results[String(n)] ?? mine;
    setResult(kept);
    setStreak(state.streak);
    // Coins go to the story save, once a day, when there is a story to spend them in
    const st = useERStore.getState();
    if (first && (st.tutorialCompleted || st.currentDay > 1 || st.xp > 0)) {
      const c = dailyCoins(kept, state.streak);
      useERStore.setState({ currency: st.currency + c });
      setCoins(c);
    }
    try {
      const dare = readDailyDare(sessionStorage.getItem(DARE_KEY) || "");
      if (dare && dare.day === n) setVerdict(dailyVerdict(kept, dare));
    } catch { /* private mode */ }
    if (first) audio.playSparkle();
  }, [stars, dxFirst, openedAt, n]);

  if (!result) return null;
  const name = useERStore.getState().playerName;
  const dare = async () => {
    audio.playClick();
    const who = name && name !== "Doctor" ? name : null;
    setNote(outcomeNote[await shareLink(`Code Rama Daily Case #${n} ${dailyLine(result)}`, dailyDareUrl(n, result, who))]);
  };

  return (
    <div className="rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#fff6e3] px-2.5 py-2 flex flex-col gap-1.5" data-testid="daily-result">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[17px] leading-none text-[#86522e]">Daily Case #{n}</p>
        <p className="cozy-tag !bg-[#ffd66b] px-1.5 py-0.5 text-[14px] leading-none" data-testid="daily-streak">Streak {streak}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex gap-0.5">{[0, 1, 2].map((i) => <PixelIcon key={i} name={i < result.stars ? "star" : "starEmpty"} size={22} />)}</span>
        <span className="text-[22px] leading-none tabular-nums">{fmtClock(result.secs)}</span>
        <span className="text-[15px] leading-none text-[#5b4148]">{result.dxFirst ? "Dx ถูกครั้งแรก" : "Dx รอบสอง"}</span>
      </div>
      {verdict && <p className="cozy-tag self-start !bg-[#c8ecb4] px-2 py-0.5 text-[15px] leading-none" data-testid="daily-verdict">{verdict}</p>}
      {coins > 0 && <p className="text-[14px] leading-none text-[#3f8a48]" data-testid="daily-coins">+{coins} เหรียญ</p>}
      <div className="flex gap-1.5">
        <button onClick={dare} className="cozy-btn cozy-btn-sky flex-1 py-1.5 text-[16px] leading-none" data-testid="daily-dare">ท้าเพื่อน</button>
        <button onClick={() => { audio.playClick(); onShareCard(result, n, streak); }} className="cozy-btn cozy-btn-sun flex-1 py-1.5 text-[16px] leading-none" data-testid="daily-share">Story IG</button>
      </div>
      {note && <p className="text-[14px] leading-none text-[#86522e]" data-testid="daily-note">{note}</p>}
    </div>
  );
}
