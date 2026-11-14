"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { audio } from "@/lib/audio";
import { haptic } from "@/lib/haptics";
import { useERStore, storyRank } from "@/lib/erStore";
import { NPCS } from "@/lib/npcs";
import { playerLookFrom } from "@/lib/playerLook";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { ShareSheet } from "@/components/game/ShareSheet";
import { outcomeNote, shareLink, siteUrl } from "@/lib/invite";
import { QUESTIONS, TYPES, mixOf, resultOf, type TypeId } from "@/lib/quiz";
import type { CardSpec } from "@/lib/shareCard";

const BAR: Record<TypeId, string> = { hands: "#e06b72", sleuth: "#5fa7cf", heart: "#e98aa5", calm: "#5fae5a" };
const ORDER: TypeId[] = ["hands", "sleuth", "heart", "calm"];

/** หมอ ER สายไหน: six taps, one result, one Story card. Works without a save. */
export default function QuizPage() {
  const router = useRouter();
  const { appearance, currentDay, lifetimeXp, tutorialCompleted, xp } = useERStore();
  const [answers, setAnswers] = useState<TypeId[]>([]);
  const [friend, setFriend] = useState<TypeId | null>(null);
  const [card, setCard] = useState<CardSpec | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") as TypeId | null;
    if (t && TYPES[t]) setFriend(t);
  }, []);

  const done = answers.length >= QUESTIONS.length;
  const result = done ? TYPES[resultOf(answers)] : null;
  const mix = useMemo(() => mixOf(answers), [answers]);
  const hasSave = tutorialCompleted || currentDay > 1 || xp > 0;

  const pick = (t: TypeId) => {
    audio.playClick();
    haptic.impact("light");
    const next = [...answers, t];
    setAnswers(next);
    if (next.length === QUESTIONS.length) setTimeout(() => audio.playSparkle(), 150);
  };
  const story = () => {
    if (!result) return;
    audio.playClick();
    const look = hasSave ? playerLookFrom(appearance, storyRank(currentDay, lifetimeXp || 0)) : NPCS[result.mascot].look;
    setCard({
      kind: "quiz", look, title: `สาย${result.title.replace(/^สาย/, "")}`, line: result.line, strength: result.strength, watch: result.watch,
      pearl: result.pearl, partner: TYPES[result.partner].title.replace(/^สาย/, ""),
      mix: ORDER.map((t) => ({ label: TYPES[t].title, n: mix[t], color: BAR[t] })),
    });
  };
  const send = async () => {
    if (!result) return;
    audio.playClick();
    setNote(outcomeNote[await shareLink(`เราเป็นหมอ ER ${result.title} แล้วคุณล่ะ`, `${siteUrl()}/quiz?t=${result.id}`)]);
  };

  const q = QUESTIONS[answers.length];
  return (
    <div className="h-[100dvh] cozy-night text-pixel-text font-pixel flex flex-col items-center p-3 gap-2.5 overflow-y-auto" data-testid="quiz">
      {card && <ShareSheet spec={card} onClose={() => setCard(null)} filename="code-rama-quiz.png" />}
      <div className="w-full max-w-sm flex items-center justify-between">
        <button onClick={() => router.push("/")} className="cozy-btn px-2.5 py-1 text-[16px] leading-none">กลับ</button>
        {!done && <span className="cozy-tag px-2 py-0.5 text-[16px] leading-none" data-testid="quiz-progress">{answers.length + 1}/{QUESTIONS.length}</span>}
      </div>

      {!done && q && (
        <div className="cozy-panel w-full max-w-sm p-3 flex flex-col gap-2.5">
          {answers.length === 0 && (
            <div>
              <h1 className="text-[28px] leading-none">หมอ ER สายไหน</h1>
              {friend && <p className="mt-2 cozy-tag self-start !bg-[#ffd66b] px-2 py-1 text-[16px] leading-none inline-block" data-testid="quiz-friend">เพื่อนเป็น{TYPES[friend].title}</p>}
            </div>
          )}
          <div className="flex gap-1">{QUESTIONS.map((_, i) => <span key={i} className={`flex-1 h-2 rounded-[2px] ${i < answers.length ? "bg-[#5fae5a]" : i === answers.length ? "bg-[#ffd66b]" : "bg-[#e7d3a8]"}`} />)}</div>
          <p className="text-[22px] leading-snug" data-testid="quiz-question">{q.q}</p>
          <div className="flex flex-col gap-2">
            {q.a.map((a) => <button key={a.text} onClick={() => pick(a.t)} className="cozy-btn w-full py-3 px-3 text-left text-[18px] leading-tight" data-testid="quiz-answer">{a.text}</button>)}
          </div>
        </div>
      )}

      {result && (
        <div className="cozy-panel w-full max-w-sm p-3 flex flex-col gap-2.5" data-testid="quiz-result">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 shrink-0 rounded-[4px] overflow-hidden border-[3px] border-[#3a2a2f]"><PixelPortrait speaker={NPCS[result.mascot].name.en} className="w-full h-full" /></div>
            <div>
              <h1 className="text-[30px] leading-none text-[#c4374a]" data-testid="quiz-type">{result.title}</h1>
              <p className="text-[16px] leading-snug mt-1 text-[#86522e]">{result.line}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {ORDER.map((t) => (
              <div key={t} className="flex items-center gap-2 text-[15px] leading-none">
                <span className="w-28 shrink-0">{TYPES[t].title}</span>
                <span className="flex-1 h-3 rounded-[2px] bg-[#e7d3a8] overflow-hidden"><span className="block h-full" style={{ width: `${(mix[t] / QUESTIONS.length) * 100}%`, background: BAR[t] }} /></span>
              </div>
            ))}
          </div>
          <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1.5 text-[16px] leading-snug">
            <dt className="text-[#3f6f80]">จุดแข็ง</dt><dd>{result.strength}</dd>
            <dt className="text-[#3f6f80]">ระวัง</dt><dd>{result.watch}</dd>
            <dt className="text-[#3f6f80]">Pearl</dt><dd>{result.pearl}</dd>
            <dt className="text-[#c4374a]">คู่หู</dt><dd>{TYPES[result.partner].title}</dd>
          </dl>
          {friend && <p className="cozy-tag self-start !bg-[#c8ecb4] px-2 py-1 text-[15px] leading-none" data-testid="quiz-match">{friend === result.partner ? `เพื่อนคือคู่หูที่ใช่ของคุณ` : friend === result.id ? `สายเดียวกับเพื่อนเลย` : `เพื่อนเป็น${TYPES[friend].title}`}</p>}
          <button onClick={story} className="cozy-btn cozy-btn-sun w-full py-2.5 text-[21px] leading-none" data-testid="quiz-story">Story IG</button>
          <button onClick={send} className="cozy-btn cozy-btn-sky w-full py-2 text-[18px] leading-none" data-testid="quiz-send">ส่งให้เพื่อนทำ</button>
          {note && <p className="text-center text-[15px] leading-none text-[#86522e]">{note}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { audio.playClick(); setAnswers([]); }} className="cozy-btn py-1.5 text-[16px] leading-none" data-testid="quiz-again">ทำใหม่</button>
            <button onClick={() => router.push("/daily")} className="cozy-btn py-1.5 text-[16px] leading-none" data-testid="quiz-daily">Daily Case</button>
          </div>
        </div>
      )}
    </div>
  );
}
