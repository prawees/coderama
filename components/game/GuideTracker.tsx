"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useERStore } from "@/lib/erStore";
import { guideSteps } from "@/lib/guide";
import type { MarkTarget } from "@/components/game/ClinicWorld";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { audio } from "@/lib/audio";

/**
 * The quest log for the first days, in the corner like a Zelda objective: the one thing to do next,
 * with the rest of today's list a tap away. It ticks steps off as they happen and points the
 * world's arrow at the current one.
 */
export function GuideTracker({ onShift, hidden, mark }: { onShift: boolean; hidden: boolean; mark: (t: MarkTarget) => void }) {
  const st = useERStore();
  const steps = useMemo(() => guideSteps(st, onShift), [st, onShift]);
  const [open, setOpen] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());

  // Tick off whatever the save shows has happened
  useEffect(() => {
    for (const s of steps) {
      if (!(st.guide ?? []).includes(s.id) && s.done(st, st.currentDay)) {
        st.markGuide(s.id);
        if (!seen.current.has(s.id)) { seen.current.add(s.id); setCheer(s.text); audio.playSparkle(); setTimeout(() => setCheer(null), 1600); }
      }
    }
  }, [st, steps]);

  const left = steps.filter((s) => !(st.guide ?? []).includes(s.id));
  const current = left[0];

  useEffect(() => { mark(!hidden && current?.target ? current.target(st.currentDay) : null); }, [current, hidden, mark, st.currentDay]);
  useEffect(() => () => mark(null), [mark]);

  if (!steps.length || hidden) return null;
  return (
    <div className="absolute top-[3.6rem] left-2 z-40 max-w-[15.5rem]" data-testid="guide">
      <button onClick={() => { audio.playClick(); setOpen((o) => !o); }} className="cozy-panel w-full text-left px-2 py-1.5 flex items-start gap-1.5" aria-expanded={open}>
        <span className="mt-0.5 shrink-0"><PixelIcon name="quest" size={14} /></span>
        <span className="min-w-0">
          <span className="block text-[12px] leading-none text-[#86522e]">ภารกิจวันนี้ {steps.length - left.length}/{steps.length}</span>
          <AnimatePresence mode="wait">
            <motion.span key={current?.id ?? "done"} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
              className="block text-[15px] leading-snug mt-0.5" data-testid="guide-step">
              {current ? current.text : "ครบแล้ว เดินเล่นตามสบาย"}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="cozy-panel mt-1 px-2 py-1.5 flex flex-col gap-1" data-testid="guide-list">
            {steps.map((s) => {
              const done = (st.guide ?? []).includes(s.id);
              return (
                <li key={s.id} className={`text-[14px] leading-snug flex gap-1.5 ${done ? "text-[#5fa96a]" : ""}`}>
                  <span className="shrink-0">{done ? "✓" : "◇"}</span><span className={done ? "line-through decoration-1" : ""}>{s.text}</span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cheer && (
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mt-1 cozy-tag !bg-[#86c35f] px-2 py-0.5 text-[14px] leading-none inline-block" data-testid="guide-cheer">✓ สำเร็จ</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
