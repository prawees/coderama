import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { useT } from "@/lib/i18n/useT";
import { PixelButton } from "@/components/ui/PixelButton";
import { getRankFromXp } from "@/lib/erStore";

interface LeaderboardModalProps {
  onClose: () => void;
}

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const { t } = useT();
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
    <div className="absolute inset-0 bg-[#0b1626]/80 z-50 flex items-center justify-center p-4">
      <PixelPanel className="w-full max-w-lg max-h-[80vh] flex flex-col" variant="metal">
        <h2 className="font-heading text-sm text-[#ffd866] text-center mb-3">{t('lb.title')}</h2>
        
        <div className="flex gap-2 mb-2">
          <PixelButton onClick={() => setTab('individual')} variant={tab === 'individual' ? 'primary' : 'secondary'} className="flex-1 text-xs py-1">
            {t('lb.doctors')}
          </PixelButton>
          <PixelButton onClick={() => setTab('university')} variant={tab === 'university' ? 'primary' : 'secondary'} className="flex-1 text-xs py-1">
            {t('lb.schools')}
          </PixelButton>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {loading ? (
            <div className="text-center text-[#a9bfd9] text-xl py-8 blink">{t('nav.loading')}</div>
          ) : tab === 'individual' ? (
            leaders.slice(0, 10).map((leader, index) => (
              <div key={leader.id} className="bg-[#16263f] border-4 border-[#0b1626] p-2 flex items-center gap-2 text-lg">
                <div className={`text-xl font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate text-xl">{leader.displayName || "Unknown Doctor"}</div>
                  <div className="text-base text-[#a9bfd9] truncate">
                    {leader.university !== 'Unknown' ? `${leader.university} • ` : ''} 
                    {getRankFromXp(leader.xp || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#99e550] text-xl">{leader.xp || 0} XP</div>
                  <div className="text-base text-[#6d82a3]">{t('hub.day')} {leader.day || 1}</div>
                </div>
              </div>
            ))
          ) : (
            sortedUniversities.map((uni, index) => (
              <div key={uni.name} className="bg-[#16263f] border-4 border-[#0b1626] p-2 flex items-center gap-2 text-lg">
                <div className={`text-xl font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate text-xl">{uni.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#99e550] text-xl">{uni.xp.toLocaleString()} XP</div>
                </div>
              </div>
            ))
          )}
          {!loading && leaders.length === 0 && (
            <div className="text-center text-[#a9bfd9] text-xl py-8">{t('lb.empty')}</div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-800">
          <PixelButton onClick={onClose} variant="secondary" className="w-full">
            {t('set.close')}
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
