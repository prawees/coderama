"use client";

import { useEffect, useState, useRef } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { audio } from "@/lib/audio";
import { CutsceneChoice } from "@/lib/StoryManager";
import { portrait, GRUMP_SPEC, RecolorSpec, SheetName } from "@/lib/spriteRecolor";
import { SKIN_RAMPS, HAIR_RAMPS, SCRUB_RAMPS } from "@/lib/palettes";
import { useT } from "@/lib/i18n/useT";

interface DialogueBoxProps {
  speakerName?: string;
  portraitUrl?: string;
  text: string;
  choices?: CutsceneChoice[];
  onComplete: (choice?: CutsceneChoice) => void;
}

/** Pick a portrait from the real sprite sheets based on who is speaking. */
function portraitFor(speaker = "", url = ""): { sheet: SheetName; spec?: RecolorSpec } | null {
  const k = `${speaker} ${url}`.toLowerCase();
  if (!speaker || /^system$/i.test(speaker.trim())) return null;
  if (/nurse|ann|แอน|พยาบาล/.test(k)) return { sheet: 'nurse' };
  if (/grump|กรัมป์/.test(k)) return { sheet: 'doctor', spec: GRUMP_SPEC };
  if (/somchai|prof|director|ผอ|อาจารย์|attending/.test(k)) return { sheet: 'doctor', spec: { hair: HAIR_RAMPS[0], scrubs: SCRUB_RAMPS[2], skin: SKIN_RAMPS[2] } };
  let h = 0; for (const ch of speaker) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { sheet: 'doctor', spec: { skin: SKIN_RAMPS[h % 6], hair: HAIR_RAMPS[(h >> 4) % 4], scrubs: SCRUB_RAMPS[(h >> 8) % 6] } };
}

const PITCH: Record<string, number> = { nurse: 1200, grump: 380, system: 600 };

export function DialogueBox({ speakerName, portraitUrl, text, choices, onComplete }: DialogueBoxProps) {
  const { t } = useT();
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [face, setFace] = useState<string | null>(null);
  const idx = useRef(0);

  useEffect(() => {
    const p = portraitFor(speakerName, portraitUrl);
    let alive = true;
    if (p) portrait(p.sheet, p.spec, 3).then((u) => { if (alive) setFace(u); }).catch(() => setFace(null));
    else setFace(null);
    return () => { alive = false; };
  }, [speakerName, portraitUrl]);

  useEffect(() => {
    setDisplayed(""); setDone(false); idx.current = 0;
    const pitchKey = /nurse|ann|แอน/i.test(speakerName || '') ? 'nurse' : /grump|กรัมป์/i.test(speakerName || '') ? 'grump' : /system/i.test(speakerName || '') ? 'system' : '';
    const timer = setInterval(() => {
      if (idx.current < text.length) {
        const i = idx.current;
        setDisplayed((prev) => prev + text.charAt(i));
        idx.current++;
        if (idx.current % 3 === 0) audio.playDialogueBark(PITCH[pitchKey] ?? 800);
      } else { setDone(true); clearInterval(timer); }
    }, 28);
    return () => clearInterval(timer);
  }, [text, speakerName]);

  const next = () => {
    if (!done) { setDisplayed(text); setDone(true); idx.current = text.length; return; }
    if (!choices || choices.length === 0) { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); onComplete(); }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') && (!choices?.length || !done)) { e.preventDefault(); next(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isSystem = !speakerName || /^system$/i.test(speakerName.trim());

  return (
    <div className="absolute bottom-3 left-3 right-3 z-[100] cursor-pointer select-none" onClick={next}>
      <div className="pixel-frame !p-2">
        <div className="frame-inner flex gap-3 p-3 min-h-[118px]">
          {face && (
            <div className="shrink-0 w-[112px] h-[118px] bg-[#c7dafa] border-4 border-[#0b1626] overflow-hidden flex items-end justify-center">
              <img src={face} alt={speakerName} className="w-[192px] max-w-none -mb-1" style={{ imageRendering: 'pixelated' }} />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col">
            {!isSystem && (
              <div className="self-start -mt-1 mb-1 px-2 bg-[#f3f6ff] border-2 border-[#0b1626] text-[#254671] text-lg leading-tight">{speakerName}</div>
            )}
            <div className={`text-2xl leading-snug ${isSystem ? 'text-[#b5e2ff]' : 'text-[#f3f6ff]'}`}>
              {displayed}
              {done && (!choices || choices.length === 0) && <span className="blink ml-2 text-[#ffd866]">▼</span>}
            </div>
            {done && choices && choices.length > 0 && (
              <div className="mt-2 grid grid-cols-1 gap-1">
                {choices.map((c, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); onComplete(c); }}
                    className="pixel-btn text-left bg-[#1e3a66] hover:bg-[#3f7fc0] text-white px-3 py-1 text-xl">
                    ▸ {c.text}
                  </button>
                ))}
              </div>
            )}
            {!done && <div className="mt-auto text-right text-sm text-[#6d82a3]">{t('dlg.skip')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
