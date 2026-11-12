"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { audio } from "@/lib/audio";
import { haptic } from "@/lib/haptics";
import { useERStore } from "@/lib/erStore";
import { dailyNumber, fmtClock } from "@/lib/daily";
import { outcomeNote, shareLink } from "@/lib/invite";
import { ALGORITHMS, algoScore, algorithmFor } from "@/lib/algorithms";
import { algoUrl, readExtra, readFriend, saveAlgo } from "@/lib/dailyExtra";

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** ลำดับชีวิต: tap the steps of an emergency algorithm in order, against the clock */
export default function AlgoPage() {
  const router = useRouter();
  const playerName = useERStore((s) => s.playerName);
  const [n, setN] = useState(0);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [placed, setPlaced] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const [secs, setSecs] = useState(0);
  const [started, setStarted] = useState(false);
  const [kept, setKept] = useState<{ score: number; secs: number; wrong: number } | null>(null);
  const [friend, setFriend] = useState<ReturnType<typeof readFriend>>(null);
  const [note, setNote] = useState<string | null>(null);
  const t0 = useRef(0);

  useEffect(() => {
    const today = dailyNumber();
    setN(today);
    setKept(readExtra().algo[String(today)] ?? null);
    setFriend(readFriend(window.location.search));
  }, []);

  const algo = practiceId ? ALGORITHMS.find((a) => a.id === practiceId)! : n ? algorithmFor(n) : null;
  const order = useMemo(() => (algo ? algo.steps.map((_, i) => i).sort((a, b) => hash(`${algo.id}:${n}:${a}`) - hash(`${algo.id}:${n}:${b}`)) : []), [algo, n]);
  const done = !!algo && placed >= algo.steps.length;

  useEffect(() => {
    if (!started || done) return;
    const id = setInterval(() => setSecs((Date.now() - t0.current) / 1000), 200);
    return () => clearInterval(id);
  }, [started, done]);

  if (!algo) return <div className="h-[100dvh] cozy-night" />;
  const daily = !practiceId;
  const score = algoScore(algo.steps.length, wrong, secs);
  const begin = () => { audio.playClick(); t0.current = Date.now(); setSecs(0); setPlaced(0); setWrong(0); setMiss(null); setStarted(true); };
  const tap = (i: number) => {
    if (i === placed) {
      audio.playTone(520 + placed * 60, "square", 0.05, 0.05);
      haptic.impact("light");
      setMiss(null);
      const next = placed + 1;
      setPlaced(next);
      if (next >= algo.steps.length) {
        const s = (Date.now() - t0.current) / 1000;
        setSecs(s);
        audio.playSparkle();
        if (daily) setKept(saveAlgo({ score: algoScore(algo.steps.length, wrong, s), secs: Math.round(s), wrong }, n));
      }
    } else {
      audio.playBump();
      haptic.vibrate();
      setWrong((w) => w + 1);
      setMiss(i);
    }
  };
  const share = async () => {
    if (!kept) return;
    audio.playClick();
    const me = playerName && playerName !== "Doctor" ? playerName : null;
    setNote(outcomeNote[await shareLink(`Code Rama ลำดับชีวิต #${n} ${algo.title} เราได้ ${kept.score} คะแนน ใน ${fmtClock(kept.secs)} เรียงให้ถูกเร็วกว่านี้ได้ไหม`, algoUrl(n, kept.score, me))]);
  };
  const result = daily && kept ? kept : { score, secs: Math.round(secs), wrong };
  const showEnd = done || (daily && !!kept && !started);

  return (
    <div className="h-[100dvh] cozy-night text-pixel-text font-pixel flex flex-col items-center p-3 gap-2 overflow-y-auto" data-testid="algo">
      <div className="w-full max-w-sm flex items-center justify-between">
        <button onClick={() => router.push("/daily")} className="cozy-btn px-2.5 py-1 text-[16px] leading-none">กลับ</button>
        <span className="cozy-tag !bg-[#ffd66b] px-2 py-0.5 text-[18px] leading-none">{daily ? `ลำดับชีวิต #${n}` : "ฝึก"}</span>
      </div>
      <div className="cozy-panel w-full max-w-sm p-3 flex flex-col gap-2">
        <div className="flex items-end justify-between gap-2">
          <h1 className="text-[24px] leading-none" data-testid="algo-title">{algo.title}</h1>
          {started && <span className="text-[22px] leading-none tabular-nums" data-testid="algo-clock">{fmtClock(secs)}</span>}
        </div>
        <p className="text-[16px] leading-snug">{algo.scene}</p>
        {friend && daily && (
          <p className="rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#ffd66b] px-2 py-1.5 text-[16px] leading-snug" data-testid="algo-friend">
            {friend.day === n ? `${friend.name ?? "เพื่อน"}ได้ ${friend.value} คะแนน คุณล่ะ` : `คำท้าของ${friend.name ?? "เพื่อน"}เป็นของวันก่อน วันนี้มีลำดับใหม่แล้ว`}
          </p>
        )}

        {!started && !showEnd && (
          <>
            <p className="text-[15px] leading-snug text-[#86522e]">แตะขั้นตอนให้ถูกลำดับ ยิ่งเร็วยิ่งได้คะแนน แตะผิดเสีย 40 คะแนน</p>
            <button onClick={begin} className="cozy-btn cozy-btn-leaf w-full py-3 text-[24px] leading-none" data-testid="algo-start">เริ่มจับเวลา</button>
          </>
        )}

        {started && (
          <>
            <ol className="flex flex-col gap-1" data-testid="algo-placed">
              {algo.steps.slice(0, placed).map((s, i) => (
                <li key={i} className="rounded-[4px] border-2 border-[#5fae5a] bg-[#dff3d2] px-2 py-1 text-[15px] leading-snug">
                  <span className="text-[#3f8a48]">{i + 1}. </span>{s.text}
                  {done && <span className="block text-[13px] text-[#5b4148] mt-0.5">{s.why}</span>}
                </li>
              ))}
            </ol>
            {!done && <p className="text-[14px] leading-none text-[#86522e]">ขั้นที่ {placed + 1} คืออะไร {wrong > 0 && <span className="text-[#a93c4b]">แตะผิด {wrong}</span>}</p>}
            <div className="flex flex-col gap-1.5" data-testid="algo-chips">
              {order.filter((i) => i >= placed).map((i) => (
                <button key={i} onClick={() => tap(i)} data-step={i}
                  className={`cozy-btn w-full py-2 px-2.5 text-left text-[16px] leading-tight ${miss === i ? "!bg-[#f6c3c6]" : ""}`} data-testid="algo-chip">{algo.steps[i].text}</button>
              ))}
            </div>
          </>
        )}

        {showEnd && (
          <div className="flex flex-col gap-2" data-testid="algo-end">
            <div className="rounded-[4px] border-2 border-[#5fae5a] bg-[#dff3d2] px-2.5 py-2">
              <p className="text-[34px] leading-none tabular-nums" data-testid="algo-score">{result.score}</p>
              <p className="text-[15px] leading-none mt-1 text-[#5b4148]">คะแนน ใช้เวลา {fmtClock(result.secs)} แตะผิด {result.wrong} ครั้ง</p>
            </div>
            <p className="text-[13px] leading-snug text-[#86522e]">อ้างอิง {algo.source}</p>
            {daily && <button onClick={share} className="cozy-btn cozy-btn-sun w-full py-2 text-[20px] leading-none" data-testid="algo-share">ท้าเพื่อนเรียงให้เร็วกว่า</button>}
            {note && <p className="text-center text-[14px] leading-none text-[#86522e]">{note}</p>}
            <button onClick={begin} className="cozy-btn w-full py-1.5 text-[16px] leading-none" data-testid="algo-again">{daily ? "ลองอีกรอบ (ไม่นับคะแนน)" : "ลองอีกรอบ"}</button>
          </div>
        )}
      </div>

      <div className="cozy-panel w-full max-w-sm p-3 flex flex-col gap-1.5">
        <p className="text-[15px] leading-none text-[#86522e]">ฝึกลำดับอื่น ไม่นับคะแนน</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ALGORITHMS.map((a) => (
            <button key={a.id} onClick={() => { audio.playClick(); setPracticeId(a.id === algorithmFor(n).id ? null : a.id); setStarted(false); setPlaced(0); setWrong(0); setSecs(0); setMiss(null); }}
              className={`cozy-btn py-1.5 px-1 text-[14px] leading-tight ${algo.id === a.id ? "cozy-btn-sun" : ""}`} data-testid={`algo-pick-${a.id}`}>{a.title}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
