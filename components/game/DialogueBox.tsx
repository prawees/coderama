"use client";

import { useEffect, useState, useRef } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { audio } from "@/lib/audio";

import { CutsceneChoice } from "@/lib/StoryManager";

interface DialogueBoxProps {
  speakerName?: string;
  portraitUrl?: string;
  text: string;
  choices?: CutsceneChoice[];
  onComplete: (choice?: CutsceneChoice) => void;
}

export function DialogueBox({ speakerName, portraitUrl, text, choices, onComplete }: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const textIndex = useRef(0);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText("");
    setIsFinished(false);
    textIndex.current = 0;

    const timer = setInterval(() => {
      if (textIndex.current < text.length) {
        const currentIndex = textIndex.current;
        setDisplayedText((prev) => prev + text.charAt(currentIndex));
        textIndex.current++;
        // Play blip sound occasionally
        if (textIndex.current % 3 === 0) {
           let pitch = 800; // default medium pitch
           if (speakerName === 'Nurse Ann') pitch = 1200; // higher pitch
           else if (speakerName === 'Attending') pitch = 400; // low pitch
           else if (speakerName === 'System') pitch = 600; // robot-ish
           audio.playDialogueBark(pitch);
        }
      } else {
        setIsFinished(true);
        clearInterval(timer);
      }
    }, 40); // typing speed

    return () => clearInterval(timer);
  }, [text]);

  const handleNext = () => {
    if (!isFinished) {
      // Skip typing animation
      setDisplayedText(text);
      setIsFinished(true);
      textIndex.current = text.length;
    } else if (!choices || choices.length === 0) {
      Haptics.impact({ style: ImpactStyle.Light });
      onComplete();
    }
  };

  const handleChoice = (c: CutsceneChoice, e: React.MouseEvent) => {
    e.stopPropagation();
    Haptics.impact({ style: ImpactStyle.Heavy });
    onComplete(c);
  };

  return (
    <div 
      className="absolute bottom-4 left-4 right-4 bg-[#0d1117]/95 border-4 border-[#30363d] rounded-2xl p-4 flex gap-4 z-[100] shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-pointer backdrop-blur-md transition-all"
      onClick={handleNext}
    >
      {portraitUrl && (
        <div className="w-20 h-20 bg-gray-900 border-4 border-[#1f6feb] rounded-xl flex-shrink-0 shadow-[inset_0_0_10px_rgba(0,0,0,1)] overflow-hidden relative">
          <img 
            src={portraitUrl} 
            alt={speakerName || 'Speaker'} 
            className="absolute max-w-none pixelated" 
            style={{ 
              width: "300%", // 3 columns
              height: "400%", // 4 rows
              left: "-100%", // second column (index 1)
              top: "0%" // first row (index 0)
            }} 
          />
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center font-pixel text-white pt-1">
        {speakerName && (
          <div className="text-[#58a6ff] text-lg mb-1 drop-shadow-md font-bold uppercase tracking-widest">{speakerName}</div>
        )}
        <div className="text-xl leading-relaxed tracking-wide min-h-[3rem] text-gray-200">
          {displayedText}
          {isFinished && (!choices || choices.length === 0) && <span className="animate-bounce inline-block ml-2 text-[#58a6ff]">▼</span>}
        </div>
        
        {isFinished && choices && choices.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {choices.map((c, idx) => (
              <button 
                key={idx}
                onClick={(e) => handleChoice(c, e)}
                className="bg-[#21262d] hover:bg-[#30363d] border-2 border-[#58a6ff] text-white px-4 py-3 rounded-lg text-left transition-colors font-bold shadow-md active:bg-[#1f6feb]"
              >
                {c.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
