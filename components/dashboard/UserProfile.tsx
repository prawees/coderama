"use client"

import { useState, useEffect } from "react";
import { AvatarCustomization, getLocalProfile, getRankForXp, saveAvatarLocally, UserProfile as UserProfileType, RANKS } from "@/lib/gamification";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { Trophy, Star, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function UserProfile() {
  const [profile, setProfile] = useState<UserProfileType | null>(null);

  useEffect(() => {
    setProfile(getLocalProfile());
  }, []);

  if (!profile) return null; // loading

  const handleSaveAvatar = (config: AvatarCustomization) => {
    saveAvatarLocally(config);
    setProfile({ ...profile, avatar: config });
  };

  const currentRank = getRankForXp(profile.xp);
  
  // Calculate progress to next rank
  let nextRank = null;
  let progressPercent = 100;
  
  for (let i = 0; i < RANKS.length; i++) {
    if (RANKS[i].name === currentRank) {
      if (i < RANKS.length - 1) {
        nextRank = RANKS[i + 1];
        const currentRankMin = RANKS[i].minXp;
        const nextRankMin = nextRank.minXp;
        const xpIntoRank = profile.xp - currentRankMin;
        const rankTotalXp = nextRankMin - currentRankMin;
        progressPercent = Math.min(100, Math.max(0, (xpIntoRank / rankTotalXp) * 100));
      }
      break;
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background flair */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-iris-900/40 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="flex items-center gap-2 text-ink-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-semibold tracking-wide text-sm uppercase">Back to Hub</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Toxico ID</h1>
        </header>

        <div className="grid md:grid-cols-[1fr_2fr] gap-8">
          
          {/* Left Column: ID Card / Rank */}
          <div className="space-y-6">
            <div className="bg-ink-900/80 backdrop-blur-md rounded-2xl border border-ink-800 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-iris-500/10 rounded-full blur-3xl" />
              
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-iris-400" size={24} />
                <h2 className="text-sm font-bold text-ink-400 uppercase tracking-widest">Current Rank</h2>
              </div>
              
              <div className="text-4xl font-bold text-white mb-6 drop-shadow-sm">
                {currentRank}
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs font-semibold text-ink-300">
                  <span>{profile.xp.toLocaleString()} XP</span>
                  <span>{nextRank ? `${nextRank.minXp.toLocaleString()} XP` : 'MAX'}</span>
                </div>
                <div className="h-3 bg-ink-950 rounded-full overflow-hidden border border-ink-800">
                  <div 
                    className="h-full bg-gradient-to-r from-iris-600 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {nextRank && (
                  <p className="text-xs text-ink-400 text-center mt-2">
                    {nextRank.minXp - profile.xp} XP until <span className="text-iris-400 font-bold">{nextRank.name}</span>
                  </p>
                )}
              </div>

              <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-ink-400 uppercase font-bold tracking-wider mb-1">Total Cases</div>
                  <div className="text-xl font-bold text-white">—</div> {/* Placeholder for future stats */}
                </div>
                <Trophy className="text-amber-500/50" size={32} />
              </div>
            </div>
          </div>

          {/* Right Column: Avatar Customizer */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Star className="text-amber-400" size={20} />
              Customize Loadout
            </h2>
            <AvatarCustomizer 
              initialConfig={profile.avatar}
              xp={profile.xp}
              onSave={handleSaveAvatar}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
