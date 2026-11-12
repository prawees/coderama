"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { audio } from "@/lib/audio";
import { useERStore } from "@/lib/erStore";
import { dailyNumber } from "@/lib/daily";
import { outcomeNote, shareLink } from "@/lib/invite";
import { dxChoices, dxDone, dxPuzzle, dxShareText, dxUrl, markGuess, readExtra, readFriend, saveDx, type Mark } from "@/lib/dailyExtra";

const COLOR: Record<Mark, string> = { right: "bg-[#5fae5a]", close: "bg-[#ffd66b]", far: "bg-[#e06b72]" };
const MAX = 6;

/** ทายโรค: six tries, one more clue after each miss. Yellow means the guess is a look-alike worth thinking of. */
export default function DxGuessPage() {
  const router = useRouter();
  const playerName = useERStore((s) => s.playerName);
  const [n, setN] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [friend, setFriend] = useState<ReturnType<typeof readFriend>>(null);
  const [note, setNote] = useState<string | null>(null);
  const puzzle = useMemo(() => (n ? dxPuzzle(n) : null), [n]);
  const all = useMemo(() => dxChoices(), []);

  useEffect(() => {
    const today = dailyNumber();
    setN(today);
    setFriend(readFriend(window.location.search));
    try { setGuesses(JSON.parse(localStorage.getItem(`coderama.dxGuesses.${today}`) || "[]")); } catch { /* private mode */ }
  }, []);

  if (!puzzle) return <div className="h-[100dvh] cozy-night" />;
  const max = Math.min(MAX, puzzle.clues.length);
  const marks = guesses.map((g) => markGuess(puzzle, g));
  const done = dxDone(marks, max);
  const won = marks.includes("right");
  const shown = puzzle.clues.slice(0, Math.min(max, guesses.length + 1));
  const matches = query.trim().length < 2 ? [] : all.filter((d) => d.toLowerCase().includes(query.trim().toLowerCase()) && !guesses.includes(d)).slice(0, 8);

  const guess = (d: string) => {
    if (done) return;
    const next = [...guesses, d];
    setGuesses(next);
    setQuery("");
    const m = markGuess(puzzle, d);
    if (m === "right") audio.playSparkle(); else audio.playBump();
    try { localStorage.setItem(`coderama.dxGuesses.${n}`, JSON.stringify(next)); } catch { /* private mode */ }
    const nextMarks = [...marks, m];
    if (dxDone(nextMarks, max) && !readExtra().dx[String(n)]) saveDx(nextMarks, n);
  };
  const share = async () => {
    audio.playClick();
    const me = playerName && playerName !== "Doctor" ? playerName : null;
    setNote(outcomeNote[await shareLink(dxShareText(n, marks, max), dxUrl(n, marks, me))]);
  };

  return (
    <div className="h-[100dvh] cozy-night text-pixel-text font-pixel flex flex-col items-center p-3 gap-2 overflow-y-auto" data-testid="dxdle">
      <div className="w-full max-w-sm flex items-center justify-between">
        <button onClick={() => router.push("/daily")} className="cozy-btn px-2.5 py-1 text-[16px] leading-none">กลับ</button>
        <span className="cozy-tag !bg-[#ffd66b] px-2 py-0.5 text-[18px] leading-none">Dx Guess #{n}</span>
      </div>
      <div className="cozy-panel w-full max-w-sm p-3 flex flex-col gap-2">
        <p className="flex items-center gap-2 text-[14px] leading-none text-[#86522e]">
          <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-[2px] border-2 border-[#3a2a2f] ${COLOR.right}`} />ใช่</span>
          <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-[2px] border-2 border-[#3a2a2f] ${COLOR.close}`} />ใกล้</span>
          <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-[2px] border-2 border-[#3a2a2f] ${COLOR.far}`} />ไม่ใช่</span>
        </p>
        {friend && (
          <p className="rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#ffd66b] px-2 py-1.5 text-[16px] leading-snug" data-testid="dx-friend">
            {friend.day === n ? `${friend.name ?? "เพื่อน"} ${friend.value === "x" ? "X" : friend.value}/6` : `คำท้าของ${friend.name ?? "เพื่อน"}เป็นของวันก่อน`}
          </p>
        )}
        <div className="flex flex-col gap-1.5" data-testid="dx-clues">
          {shown.map((c, i) => (
            <div key={i} className="rounded-[4px] border-2 border-[#e7d3a8] bg-[#fff6e3] px-2 py-1.5" data-testid="dx-clue">
              <p className="text-[13px] leading-none text-[#3f6f80]">{i + 1}. {c.label}</p>
              <p className="text-[16px] leading-snug mt-1">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-1" data-testid="dx-marks">
          {Array.from({ length: max }, (_, i) => <span key={i} className={`flex-1 h-4 rounded-[3px] border-2 border-[#3a2a2f] ${marks[i] ? COLOR[marks[i]] : "bg-[#e7d3a8]"}`} />)}
        </div>
        {guesses.map((g, i) => (
          <p key={g} className="flex items-center gap-1.5 text-[15px] leading-tight" data-testid="dx-guess">
            <span className={`shrink-0 w-3.5 h-3.5 rounded-[2px] border-2 border-[#3a2a2f] ${COLOR[marks[i]]}`} />{g}
          </p>
        ))}
        {!done ? (
          <>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Dx เช่น sepsis" autoComplete="off"
              className="w-full rounded-[5px] border-2 border-[#3a2a2f] bg-white px-2 py-1.5 text-[17px] leading-none text-[#3a2a2f]" data-testid="dx-input" />
            <div className="flex flex-col gap-1">
              {matches.map((d) => <button key={d} onClick={() => guess(d)} className="cozy-btn w-full py-1.5 px-2 text-left text-[15px] leading-tight" data-testid="dx-pick">{d}</button>)}
              {query.trim().length >= 2 && !matches.length && <p className="text-[14px] leading-none text-[#86522e]">ไม่พบ</p>}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2" data-testid="dx-end">
            <div className={`rounded-[4px] border-2 px-2.5 py-2 ${won ? "border-[#5fae5a] bg-[#dff3d2]" : "border-[#d95763] bg-[#fbe1dc]"}`}>
              <p className="text-[15px] leading-none text-[#86522e]">{won ? `${marks.length}/${max}` : `X/${max}`}</p>
              <p className="text-[21px] leading-tight mt-1" data-testid="dx-answer">{puzzle.answer}</p>
              <p className="text-[14px] leading-snug mt-1 text-[#5b4148]">DDx: {puzzle.close.join(", ")}</p>
            </div>
            <button onClick={share} className="cozy-btn cozy-btn-sun w-full py-2 text-[20px] leading-none" data-testid="dx-share">ท้าเพื่อน</button>
            {note && <p className="text-center text-[14px] leading-none text-[#86522e]" data-testid="dx-note">{note}</p>}
            <button onClick={() => router.push(`/simulator/play/${puzzle.caseId}?practice=1`)} className="cozy-btn w-full py-1.5 text-[16px] leading-none">รักษาเคสนี้</button>
          </div>
        )}
      </div>
    </div>
  );
}
