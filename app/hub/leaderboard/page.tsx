"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getRankFromXp } from "@/lib/erStore";

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  university?: string;
  xp: number;
  currency: number;
  day: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'individual' | 'university'>('individual');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch top 100 for better university aggregation
        const q = query(collection(db, "leaderboards"), orderBy("xp", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        const fetchedLeaders: LeaderboardEntry[] = [];
        querySnapshot.forEach((doc) => {
          fetchedLeaders.push(doc.data() as LeaderboardEntry);
        });
        setLeaders(fetchedLeaders);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const universityScores = leaders.reduce((acc, curr) => {
    const uni = curr.university || 'Unknown';
    acc[uni] = (acc[uni] || 0) + curr.xp;
    return acc;
  }, {} as Record<string, number>);

  const sortedUniversities = Object.entries(universityScores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([name, xp]) => ({ name, xp: xp as number }));

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-4">
      <h1 className="text-4xl text-emerald-400 mb-6 text-center drop-shadow-md">Global Rankings</h1>
      
      <div className="flex gap-4 mb-4">
        <PixelButton 
          onClick={() => setTab('individual')} 
          variant={tab === 'individual' ? 'primary' : 'secondary'} 
          className="flex-1 text-xl"
        >
          Doctors
        </PixelButton>
        <PixelButton 
          onClick={() => setTab('university')} 
          variant={tab === 'university' ? 'primary' : 'secondary'} 
          className="flex-1 text-xl"
        >
          Universities
        </PixelButton>
      </div>
      
      <PixelPanel className="flex-1 flex flex-col gap-4 overflow-y-auto bg-slate-800/80 p-4">
        {loading ? (
          <div className="text-center text-slate-400 text-2xl">Loading network data...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center text-slate-400 text-2xl">No data found.</div>
        ) : tab === 'individual' ? (
          leaders.slice(0, 20).map((leader, index) => (
            <div key={leader.uid} className="flex justify-between items-center p-3 border-b-4 border-slate-700 bg-slate-800 rounded">
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold w-8 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-emerald-500'}`}>#{index + 1}</div>
                <div>
                  <div className="text-2xl text-white">{leader.displayName}</div>
                  <div className="text-lg text-emerald-300">
                    {leader.university !== 'Unknown' ? `${leader.university} • ` : ''} 
                    {getRankFromXp(leader.xp)} - Day {leader.day}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl text-yellow-400">{leader.xp.toLocaleString()} XP</div>
              </div>
            </div>
          ))
        ) : (
          sortedUniversities.map((uni, index) => (
            <div key={uni.name} className="flex justify-between items-center p-3 border-b-4 border-slate-700 bg-slate-800 rounded">
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold w-8 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-emerald-500'}`}>#{index + 1}</div>
                <div className="text-2xl text-white">{uni.name}</div>
              </div>
              <div className="text-right">
                <div className="text-xl text-yellow-400">{uni.xp.toLocaleString()} XP</div>
              </div>
            </div>
          ))
        )}
      </PixelPanel>

      <div className="mt-4 pb-8">
        <PixelButton 
          onClick={() => router.push('/hub')}
          variant="secondary"
          className="w-full text-2xl py-4"
        >
          BACK TO HUB
        </PixelButton>
      </div>
    </div>
  );
}
