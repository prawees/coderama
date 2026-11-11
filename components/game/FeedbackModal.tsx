"use client";

import { useState } from "react";
import { audio } from "@/lib/audio";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { FIXES, LIKES, sendFeedback, type FeedbackWhere } from "@/lib/feedback";

/** A row of five hearts to tap. Used on its own on the summary and at the top of the form. */
export function HeartRating({ value, onPick, size = 26 }: { value: number; onPick: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" data-testid="feedback-hearts">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => { audio.playClick(); onPick(n); }} className="p-0.5 active:scale-90 transition-transform" aria-label={`${n} หัวใจ`} data-testid={`feedback-heart-${n}`}>
          <PixelIcon name={n <= value ? "heart" : "heartEmpty"} size={size} />
        </button>
      ))}
    </div>
  );
}

function Chips({ items, picked, onToggle, testid }: { items: readonly string[]; picked: string[]; onToggle: (x: string) => void; testid: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" data-testid={testid}>
      {items.map((x) => {
        const on = picked.includes(x);
        return (
          <button key={x} onClick={() => { audio.playClick(); onToggle(x); }}
            className={`rounded-[5px] border-2 border-[#3a2a2f] px-2 py-1 text-[16px] leading-none ${on ? "bg-[#86c35f] text-[#1f3318]" : "bg-white text-[#3a2a2f]"}`}>
            {x}
          </button>
        );
      })}
    </div>
  );
}

export function FeedbackModal({ onClose, where, initialRating = 0 }: { onClose: () => void; where: FeedbackWhere; initialRating?: number }) {
  const [rating, setRating] = useState(initialRating);
  const [likes, setLikes] = useState<string[]>([]);
  const [fixes, setFixes] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (x: string) => set((l) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x]));

  const send = async () => {
    if (!rating || state === "sending") return;
    setState("sending");
    try {
      await sendFeedback({ rating, likes, fixes, text, where });
      audio.playSparkle();
      setState("sent");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-[#1c1522]/75 flex items-center justify-center p-3 font-pixel" onClick={onClose} data-testid="feedback">
      <div className="cozy-panel w-full max-w-sm max-h-[90vh] overflow-y-auto p-3 flex flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] leading-none">บอกทีมหน่อย</h2>
          <button className="cozy-btn px-2 py-0.5 text-lg leading-none" onClick={onClose} aria-label="close">✕</button>
        </div>
        {state === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center" data-testid="feedback-sent">
            <PixelIcon name="heart" size={40} />
            <p className="text-[20px] leading-snug">ขอบคุณมากนะ<br />ทีมอ่านทุกข้อความเลย</p>
            <button onClick={onClose} className="cozy-btn cozy-btn-leaf w-full py-2 text-[20px] leading-none">กลับไปเล่นต่อ</button>
          </div>
        ) : (
          <>
            <p className="text-[17px] leading-snug text-[#86522e]">ให้เกมนี้กี่หัวใจ</p>
            <HeartRating value={rating} onPick={setRating} size={30} />
            <p className="text-[17px] leading-none text-[#86522e] mt-1">ชอบอะไรบ้าง</p>
            <Chips items={LIKES} picked={likes} onToggle={toggle(setLikes)} testid="feedback-likes" />
            <p className="text-[17px] leading-none text-[#86522e] mt-1">อยากให้แก้อะไร</p>
            <Chips items={FIXES} picked={fixes} onToggle={toggle(setFixes)} testid="feedback-fixes" />
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 600))} rows={3}
              placeholder="อยากบอกอะไรเพิ่ม พิมพ์ได้เลย (ไม่ต้องใส่ชื่อหรือเบอร์)"
              className="w-full rounded-[5px] border-2 border-[#3a2a2f] bg-white px-2 py-1.5 text-[17px] leading-snug text-[#3a2a2f] resize-none" data-testid="feedback-text" />
            {state === "failed" && <p className="text-[15px] leading-none text-[#c4374a]" data-testid="feedback-failed">ส่งไม่สำเร็จ เช็คเน็ตแล้วลองอีกครั้งนะ</p>}
            <button onClick={send} disabled={!rating || state === "sending"} aria-disabled={!rating}
              className={`cozy-btn cozy-btn-leaf w-full py-2 text-[21px] leading-none ${!rating ? "opacity-50" : ""}`} data-testid="feedback-send">
              {state === "sending" ? "กำลังส่ง..." : rating ? "ส่งให้ทีม" : "เลือกหัวใจก่อนนะ"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
