import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { getRankFromXp, useERStore } from "@/lib/erStore";

interface LeaderboardModalProps {
  onClose: () => void;
}

const MEDAL = ["#e8b84f", "#c9c3bd", "#d08a5a"];

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const language = useERStore((s) => s.language);
  const tr = (en: string, th: string) => (language === "th" ? th : en);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"individual" | "university">("individual");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const q = query(collection(db, "leaderboards"), orderBy("xp", "desc"), limit(50));
        const snap = await getDocs(q);
        if (alive) setLeaders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn("Leaderboard unavailable", e);
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const universityScores = leaders.reduce((acc, curr) => {
    const uni = curr.university || "Unknown";
    acc[uni] = (acc[uni] || 0) + (curr.xp || 0);
    return acc;
  }, {} as Record<string, number>);
  const sortedUniversities = Object.entries(universityScores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([name, xp]) => ({ name, xp: xp as number }));

  const Row = ({ i, name, sub, right, right2 }: { i: number; name: string; sub?: string; right: string; right2?: string }) => (
    <div className="flex items-center gap-2 bg-[#fff6e3] border-2 border-[#e7d3a8] rounded-[4px] px-2 py-1.5">
      <span
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full border-2 border-[#3a2a2f] text-[16px] leading-none"
        style={{ background: MEDAL[i] ?? "#f1d9a7" }}
      >
        {i + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[18px] leading-none truncate">{name}</p>
        {sub && <p className="text-[14px] leading-none mt-1 text-[#86522e] truncate">{sub}</p>}
      </div>
      <div className="text-right">
        <p className="text-[17px] leading-none tabular-nums">{right}</p>
        {right2 && <p className="text-[13px] leading-none mt-1 text-[#86522e]">{right2}</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#1c1522]/70 z-[150] flex items-center justify-center p-4 font-pixel" onClick={onClose}>
      <div className="cozy-panel w-full max-w-sm max-h-[80vh] flex flex-col p-3" onClick={(e) => e.stopPropagation()} data-testid="leaderboard">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[26px] leading-none flex items-center gap-2"><PixelIcon name="badge" size={20} />{tr("Hall of fame", "ทำเนียบหมอ")}</h2>
          <button className="cozy-btn px-2 py-0.5 text-lg leading-none" onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-1.5 mb-2">
          <PixelButton onClick={() => setTab("individual")} variant={tab === "individual" ? "gold" : "secondary"} className="flex-1 text-[17px] py-1">
            {tr("Doctors", "หมอ")}
          </PixelButton>
          <PixelButton onClick={() => setTab("university")} variant={tab === "university" ? "gold" : "secondary"} className="flex-1 text-[17px] py-1">
            {tr("Schools", "มหาวิทยาลัย")}
          </PixelButton>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
          {loading ? (
            <p className="text-center text-[18px] text-[#86522e] py-8 animate-pulse">{tr("Dusting off the plaques...", "กำลังเช็ดป้ายรายชื่อ...")}</p>
          ) : failed || leaders.length === 0 ? (
            <p className="text-center text-[18px] text-[#86522e] py-8">
              {failed ? tr("The board is offline. Sign in from Settings to post your name.", "บอร์ดออฟไลน์อยู่ ลงชื่อเข้าใช้ในหน้าตั้งค่าเพื่อขึ้นป้าย") : tr("No names yet. Yours could be first.", "ยังไม่มีใครเลย ชื่อหนูอาจเป็นชื่อแรก")}
            </p>
          ) : tab === "individual" ? (
            leaders.slice(0, 10).map((l, i) => (
              <Row
                key={l.id}
                i={i}
                name={l.displayName || tr("Mystery doctor", "หมอนิรนาม")}
                sub={`${l.university && l.university !== "Unknown" ? `${l.university} · ` : ""}${getRankFromXp(l.xp || 0)}`}
                right={`${l.xp || 0} XP`}
                right2={tr(`Day ${l.day || 1}`, `วันที่ ${l.day || 1}`)}
              />
            ))
          ) : (
            sortedUniversities.map((u, i) => <Row key={u.name} i={i} name={u.name} right={`${u.xp.toLocaleString()} XP`} />)
          )}
        </div>
      </div>
    </div>
  );
}
