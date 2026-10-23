"use client";

import { motion } from "framer-motion";
import { useERStore } from "@/lib/erStore";
import { NPCS, CAT, ROSTER, heartsFor } from "@/lib/npcs";
import { GIFTS } from "@/lib/gifts";
import { GIFT_ICON } from "@/lib/pixel/icons";
import type { Phase } from "@/lib/world/maps";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { drawCat } from "@/lib/pixel/characters";

function Hearts({ points }: { points: number }) {
  const h = heartsFor(points);
  return (
    <div className="flex gap-[2px]" aria-label={`${h} hearts`}>
      {Array.from({ length: 10 }, (_, i) => <PixelIcon key={i} name={i < h ? "heart" : "heartEmpty"} size={11} />)}
    </div>
  );
}

function CatFace() {
  const g = drawCat("#e8a25a", 2);
  const rects: JSX.Element[] = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const c = g.get(x, y); if (c) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={c.slice(0, 7)} />); }
  return <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges" style={{ background: "#3a3428" }}>{rects}</svg>;
}

export function FriendsModal({ phase, onClose }: { phase: Phase; onClose: () => void }) {
  const { friendships, npcDaily, knownTastes, language, currentDay } = useERStore();
  const tr = (en: string, th: string) => (language === "th" ? th : en);
  const people = ROSTER[phase].map((r) => NPCS[r.id]);
  const tasteLabel: Record<string, [string, string]> = { love: ["loves", "ชอบมาก"], like: ["likes", "ชอบ"], neutral: ["okay with", "เฉยๆ"], hate: ["dislikes", "ไม่ชอบ"] };

  const Row = ({ id, name, portrait, points }: { id: string; name: string; portrait: React.ReactNode; points: number }) => {
    const daily = npcDaily[id] || {};
    const known = Object.entries(knownTastes[id] || {});
    return (
      <div className="flex gap-2.5 items-start py-2 border-b-2 border-[#e7d3a8] last:border-0" data-testid={`friend-${id}`}>
        <div className="w-12 h-12 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]">{portrait}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[19px] leading-none">{name}</span>
            <span className="flex gap-1 text-[13px] leading-none text-[#86522e]">
              <span className={daily.talkDay === currentDay ? "text-[#3f8a48]" : ""}>{daily.talkDay === currentDay ? tr("chatted", "คุยแล้ว") : tr("not yet", "ยังไม่คุย")}</span>
              {daily.giftDay === currentDay && <span className="text-[#a93c4b]">{tr("+ gift", "+ ของขวัญ")}</span>}
            </span>
          </div>
          <div className="mt-1"><Hearts points={points} /></div>
          {known.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[13px] leading-none text-[#86522e]">
              {known.map(([gift, taste]) => (
                <span key={gift} className="flex items-center gap-1">
                  <PixelIcon name={GIFT_ICON[GIFTS[gift]?.icon] ?? "heart"} size={12} />
                  {tasteLabel[taste]?.[language === "th" ? 1 : 0]} {GIFTS[gift]?.name[language] ?? gift}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[150] bg-[#1c1522]/70 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20 }}
        className="cozy-panel w-full max-w-sm max-h-[82%] flex flex-col p-3"
        onClick={(e) => e.stopPropagation()}
        data-testid="friends-modal"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[26px] leading-none flex items-center gap-2"><PixelIcon name="friends" size={20} />{tr("Friends", "เพื่อนร่วมงาน")}</h2>
          <button className="cozy-btn px-2 py-0.5 text-lg leading-none" onClick={onClose} aria-label="close">✕</button>
        </div>
        <p className="text-[14px] leading-tight text-[#86522e] mb-1">
          {tr("Chat once a day. Gifts they love go a long way. Hearts unlock little scenes.", "คุยกันวันละครั้ง ของขวัญที่ถูกใจช่วยได้มาก หัวใจปลดล็อกฉากพิเศษ")}
        </p>
        <div className="overflow-y-auto pr-1">
          {people.map((p) => (
            <Row key={p.id} id={p.id} name={p.name[language]} points={friendships[p.id] || 0} portrait={<PixelPortrait speaker={p.name.en} className="w-full h-full" />} />
          ))}
          <Row id="cat" name={CAT.name[language]} points={friendships.cat || 0} portrait={<CatFace />} />
        </div>
      </motion.div>
    </motion.div>
  );
}
