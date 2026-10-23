"use client";

import { useEffect, useState, useRef } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { audio } from "@/lib/audio";
import { CutsceneChoice } from "@/lib/StoryManager";
import { PixelPortrait, hasPortrait } from "@/components/game/PixelPortrait";
import { NPCS, npcIdForSpeaker, speakerLabel } from "@/lib/npcs";
import { useERStore } from "@/lib/erStore";
import { inVoice } from "@/lib/voice";

interface DialogueBoxProps {
  speakerName?: string;
  portraitUrl?: string;
  text: string;
  choices?: CutsceneChoice[];
  voice?: number;
  onComplete: (choice?: CutsceneChoice) => void;
}

/** Parchment dialogue card with a wooden portrait frame and a name ribbon. Text types out with a per-character voice. */
export function DialogueBox({ speakerName, text: rawText, choices, voice, onComplete }: DialogueBoxProps) {
  const { playerName, playerGender, currentDay } = useERStore();
  const text = inVoice(rawText, playerGender, currentDay);
  const label = speakerLabel(speakerName, playerName);
  const [shown, setShown] = useState(0);
  const finished = shown >= text.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pitch = voice ?? (() => {
    const id = npcIdForSpeaker(speakerName);
    if (id && NPCS[id]) return NPCS[id].voice;
    if (speakerName === "System" || speakerName === "Narrator") return 620;
    return 800;
  })();

  useEffect(() => {
    setShown(0);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) { if (timer.current) clearInterval(timer.current); return n; }
        if (n % 3 === 0 && text.charAt(n).trim()) audio.playDialogueBark(pitch + ((n * 37) % 120) - 60);
        return n + 1;
      });
    }, 28);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [text, pitch]);

  const handleNext = () => {
    if (!finished) { setShown(text.length); return; }
    if (!choices || choices.length === 0) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      onComplete();
    }
  };

  const isNarration = !label;

  return (
    <div
      className="absolute bottom-2 left-2 right-2 z-[100] cursor-pointer animate-[cozyPop_0.18s_ease-out]"
      onClick={handleNext}
      data-testid="dialogue"
    >
      {!isNarration && (
        <div className="absolute -top-4 left-[5.5rem] z-10 cozy-tag px-2 py-0.5 text-base leading-none !bg-[#ffd66b]" data-testid="dialogue-speaker">
          {label}
        </div>
      )}
      <div className="cozy-panel flex gap-3 p-3">
        {hasPortrait(speakerName) && (
          <div className="w-[4.5rem] h-[4.5rem] shrink-0 rounded-[4px] overflow-hidden border-[3px] border-[#3a2a2f] shadow-[inset_0_0_0_2px_#b47640]">
            <PixelPortrait speaker={speakerName} className="w-full h-full" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className={`text-[19px] leading-[1.15] min-h-[3.2rem] ${isNarration ? "text-[#5b4148]" : "text-[#3a2a2f]"}`} data-testid="dialogue-text">
            {text.slice(0, shown)}
            {finished && (!choices || choices.length === 0) && (
              <span className="inline-block ml-1 text-[#d95763] animate-[cozyBob_0.8s_ease-in-out_infinite]">▼</span>
            )}
          </p>
          {finished && choices && choices.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5" data-testid="dialogue-choices">
              {choices.map((c, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); audio.playClick(); onComplete(c); }}
                  className="cozy-btn cozy-btn-sun text-left px-3 py-1.5 text-[17px] leading-tight"
                >
                  <span className="text-[#d95763] mr-1">▸</span>{inVoice(c.text, playerGender, currentDay)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
