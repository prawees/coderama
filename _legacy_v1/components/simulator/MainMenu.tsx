import { Heart, Play, User as UserIcon } from "lucide-react";
import type { CaseData } from "./types";

interface MainMenuProps {
  caseData: CaseData;
  onStart: () => void;
}

export function MainMenu({ caseData, onStart }: MainMenuProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink-950 font-sans text-white overflow-hidden">
      {/* Cinematic background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-ink-900/80 to-transparent" />
      
      {/* Background imagery - placeholder for dramatic medical scene */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #4f46e5 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        <Heart size={64} className="text-iris-500 mb-8 animate-pulse shadow-iris-500/50 drop-shadow-2xl" />
        
        <h3 className="text-iris-400 font-mono tracking-widest text-sm mb-2 uppercase">Emergency Protocol</h3>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-lg">
          {caseData.title || "Unknown Patient"}
        </h1>
        
        <div className="flex items-center gap-3 text-ink-300 mb-8 font-medium">
          <span className="bg-ink-800 px-3 py-1 rounded-full text-sm border border-ink-700">
            {caseData.age || "—"} y/o {caseData.sex}
          </span>
          <span className="text-iris-500">•</span>
          <span className="uppercase tracking-wide text-sm text-ink-200">
            {caseData.chiefComplaint || "No chief complaint"}
          </span>
        </div>

        <p className="max-w-xl text-ink-400 text-sm md:text-base leading-relaxed mb-12 bg-black/40 p-6 rounded-xl border border-white/5 backdrop-blur-sm shadow-xl">
          {caseData.background 
            ? caseData.background 
            : "No background information available. Prepare for immediate intervention."}
        </p>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-center w-full max-w-2xl mt-12">
          <div className="relative group w-full md:w-auto">
            <div className="absolute inset-0 bg-iris-600 -skew-x-12 group-hover:bg-iris-500 transition-colors shadow-[0_0_20px_rgba(79,70,229,0.5)] group-hover:shadow-[0_0_30px_rgba(79,70,229,0.8)]" />
            <button
              onClick={onStart}
              className="relative flex items-center justify-center gap-3 text-white px-10 py-5 font-bold text-lg cursor-pointer w-full"
            >
              <Play size={20} className="fill-white drop-shadow-[0_0_5px_rgba(255,255,255,1)]" />
              <span className="tracking-widest uppercase text-sm drop-shadow-md">BEGIN SIMULATION</span>
            </button>
          </div>

          <div className="relative group w-full md:w-auto">
            <div className="absolute inset-0 bg-ink-900 border border-ink-700 -skew-x-12 group-hover:bg-ink-800 group-hover:border-iris-500 transition-colors" />
            <a
              href="/profile"
              className="relative flex items-center justify-center gap-2 text-white px-10 py-5 font-bold cursor-pointer w-full"
            >
              <UserIcon size={20} className="text-ink-300 group-hover:text-iris-400" />
              <span className="tracking-widest uppercase text-sm text-ink-300 group-hover:text-white">ID Card</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
