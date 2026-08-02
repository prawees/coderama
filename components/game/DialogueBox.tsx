"use client";

import { useEffect, useState, useRef } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { audio } from "@/lib/audio";

interface DialogueBoxProps {
  speakerName?: string;
  portraitUrl?: string;
  text: string;
  onComplete: () => void;
}

export function DialogueBox({ speakerName, portraitUrl, text, onComplete }: DialogueBoxProps) {
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
        setDisplayedText((prev) => prev + text.charAt(textIndex.current));
        textIndex.current++;
        // Play blip sound occasionally
        if (textIndex.current % 3 === 0) {
           audio.playClick();
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
    } else {
      Haptics.impact({ style: ImpactStyle.Light });
      onComplete();
    }
  };

  return (
    <div 
      className="absolute bottom-4 left-4 right-4 bg-black border-4 border-white rounded-lg p-4 flex gap-4 z-[100] shadow-[0_0_20px_rgba(0,0,0,0.8)] cursor-pointer"
      onClick={handleNext}
    >
      {portraitUrl && (
        <div className="w-16 h-16 bg-gray-800 border-2 border-gray-600 rounded flex-shrink-0">
          <img src={portraitUrl} alt={speakerName || 'Speaker'} className="w-full h-full object-cover pixelated" />
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center font-pixel text-white">
        {speakerName && (
          <div className="text-pixel-primary text-sm mb-2">{speakerName}</div>
        )}
        <div className="text-base leading-relaxed tracking-wide min-h-[3rem]">
          {displayedText}
          {isFinished && <span className="animate-pulse inline-block ml-2">▼</span>}
        </div>
      </div>
    </div>
  );
}
