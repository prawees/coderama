import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { getRankFromXp } from "@/lib/erStore";

interface LeaderboardModalProps {
  onClose: () => void;
}

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'individual' | 'university'>('individual');

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        // Fetch more for aggregation
        const q = query(collection(db, "leaderboards"), orderBy("xp", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaders(fetched);
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <PixelPanel className="w-full max-w-lg max-h-[80vh] flex flex-col" variant="dark">
        <h2 className="text-3xl text-pixel-gold font-bold text-center mb-4 uppercase">Global Leaderboard</h2>
        
        <div className="flex gap-2 mb-2">
          <PixelButton onClick={() => setTab('individual')} variant={tab === 'individual' ? 'primary' : 'secondary'} className="flex-1 text-xs py-1">
            Doctors
          </PixelButton>
          <PixelButton onClick={() => setTab('university')} variant={tab === 'university' ? 'primary' : 'secondary'} className="flex-1 text-xs py-1">
            Universities
          </PixelButton>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {loading ? (
            <div className="text-center text-gray-400 py-8 animate-pulse">Loading top doctors...</div>
          ) : tab === 'individual' ? (
            leaders.slice(0, 10).map((leader, index) => (
              <div key={leader.id} className="bg-gray-900 border-2 border-gray-700 p-2 rounded flex items-center gap-2">
                <div className={`text-xl font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate text-sm">{leader.displayName || "Unknown Doctor"}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {leader.university !== 'Unknown' ? `${leader.university} • ` : ''} 
                    {getRankFromXp(leader.xp || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-pixel-success font-bold text-sm">{leader.xp || 0} XP</div>
                  <div className="text-[10px] text-gray-500">Day {leader.day || 1}</div>
                </div>
              </div>
            ))
          ) : (
            sortedUniversities.map((uni, index) => (
              <div key={uni.name} className="bg-gray-900 border-2 border-gray-700 p-2 rounded flex items-center gap-2">
                <div className={`text-xl font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate text-sm">{uni.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-pixel-success font-bold text-sm">{uni.xp.toLocaleString()} XP</div>
                </div>
              </div>
            ))
          )}
          {!loading && leaders.length === 0 && (
            <div className="text-center text-gray-400 py-8">No doctors found. The ER is empty!</div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-800">
          <PixelButton onClick={onClose} variant="secondary" className="w-full">
            Close
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
