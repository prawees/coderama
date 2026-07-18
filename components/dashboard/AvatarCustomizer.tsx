"use client"

import { useState } from "react";
import { AvatarCustomization, COSMETICS, getRankForXp, RANKS, RankTier } from "@/lib/gamification";

interface AvatarCustomizerProps {
  initialConfig: AvatarCustomization;
  xp: number;
  onSave: (config: AvatarCustomization) => void;
}

export function AvatarCustomizer({ initialConfig, xp, onSave }: AvatarCustomizerProps) {
  const [config, setConfig] = useState<AvatarCustomization>(initialConfig);
  const currentRank = getRankForXp(xp);
  const currentRankObj = RANKS.find(r => r.name === currentRank);
  const currentRankXp = currentRankObj ? currentRankObj.minXp : 0;

  const isUnlocked = (requiredRank: RankTier) => {
    const reqObj = RANKS.find(r => r.name === requiredRank);
    return reqObj ? xp >= reqObj.minXp : false;
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start bg-ink-950 p-6 rounded-2xl border border-ink-800 text-white">
      {/* 2D Vector Avatar Preview */}
      <div className="flex-shrink-0 w-48 h-48 bg-ink-900 rounded-2xl flex items-center justify-center border-2 border-ink-800 overflow-hidden relative shadow-inner">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          {/* Body/Scrubs */}
          <path d="M 20 100 L 20 60 C 20 40 80 40 80 60 L 80 100 Z" fill={config.scrubColor} />
          {/* V-neck */}
          <path d="M 40 50 L 50 65 L 60 50 Z" fill="#f5cba7" />
          
          {/* Head */}
          <circle cx="50" cy="35" r="18" fill="#f5cba7" />
          
          {/* Hair (simple) */}
          <path d="M 32 35 C 30 15 70 15 68 35 C 70 20 30 20 32 35 Z" fill="#333" />
          
          {/* Glasses */}
          {config.glasses === "square" && (
            <g stroke="#222" strokeWidth="2" fill="none">
              <rect x="36" y="28" width="10" height="8" rx="1" />
              <rect x="54" y="28" width="10" height="8" rx="1" />
              <line x1="46" y1="32" x2="54" y2="32" />
            </g>
          )}
          {config.glasses === "round" && (
            <g stroke="#222" strokeWidth="2" fill="none">
              <circle cx="41" cy="32" r="5" />
              <circle cx="59" cy="32" r="5" />
              <line x1="46" y1="32" x2="54" y2="32" />
            </g>
          )}

          {/* Mask */}
          {config.maskType === "surgical" && (
            <path d="M 35 42 Q 50 35 65 42 L 60 52 Q 50 55 40 52 Z" fill="#3b82f6" opacity="0.9" />
          )}
          {config.maskType === "n95" && (
            <path d="M 38 42 C 50 30 62 42 60 50 C 50 55 40 50 38 42 Z" fill="#f1f5f9" />
          )}

          {/* Stethoscope */}
          <path d="M 35 60 C 35 80 65 80 65 60" fill="none" stroke={config.stethoscopeColor} strokeWidth="3" />
          <path d="M 35 60 L 35 55" fill="none" stroke={config.stethoscopeColor} strokeWidth="2" />
          <path d="M 65 60 L 65 55" fill="none" stroke={config.stethoscopeColor} strokeWidth="2" />
          <circle cx="65" cy="73" r="4" fill="#ddd" stroke={config.stethoscopeColor} strokeWidth="2" />
        </svg>
      </div>

      {/* Controls */}
      <div className="flex-1 w-full space-y-6">
        
        {/* Scrub Colors */}
        <div>
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-3">Scrub Uniform</h3>
          <div className="flex flex-wrap gap-3">
            {COSMETICS.scrubs.map(item => {
              const unlocked = isUnlocked(item.requiredRank);
              const selected = config.scrubColor === item.color;
              return (
                <button
                  key={item.id}
                  disabled={!unlocked}
                  onClick={() => setConfig({ ...config, scrubColor: item.color })}
                  className={`relative w-12 h-12 rounded-full border-2 transition-transform ${selected ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-ink-800'} ${!unlocked ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                  style={{ backgroundColor: item.color }}
                  title={`${item.name} (${item.requiredRank})`}
                >
                  {!unlocked && <span className="absolute inset-0 flex items-center justify-center text-xs">🔒</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stethoscope Colors */}
        <div>
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-3">Stethoscope</h3>
          <div className="flex flex-wrap gap-3">
            {COSMETICS.stethoscopes.map(item => {
              const unlocked = isUnlocked(item.requiredRank);
              const selected = config.stethoscopeColor === item.color;
              return (
                <button
                  key={item.id}
                  disabled={!unlocked}
                  onClick={() => setConfig({ ...config, stethoscopeColor: item.color })}
                  className={`relative w-10 h-10 rounded-full border-2 transition-transform ${selected ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-ink-800'} ${!unlocked ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                  style={{ backgroundColor: item.color }}
                  title={`${item.name} (${item.requiredRank})`}
                >
                  {!unlocked && <span className="absolute inset-0 flex items-center justify-center text-xs">🔒</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Accessories */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-3">Mask</h3>
            <select 
              value={config.maskType}
              onChange={(e) => setConfig({ ...config, maskType: e.target.value as any })}
              className="w-full bg-ink-900 border border-ink-800 rounded-lg px-3 py-2 text-sm focus:border-iris-500 outline-none"
            >
              <option value="none">None</option>
              <option value="surgical">Surgical Mask</option>
              <option value="n95">N95 Respirator</option>
            </select>
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-3">Glasses</h3>
            <select 
              value={config.glasses}
              onChange={(e) => setConfig({ ...config, glasses: e.target.value as any })}
              className="w-full bg-ink-900 border border-ink-800 rounded-lg px-3 py-2 text-sm focus:border-iris-500 outline-none"
            >
              <option value="none">None</option>
              <option value="square">Square Frame</option>
              <option value="round">Round Frame</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="mt-4 w-full bg-iris-600 hover:bg-iris-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
        >
          Equip Gear
        </button>

      </div>
    </div>
  );
}
