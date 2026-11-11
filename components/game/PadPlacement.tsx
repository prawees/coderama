"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { haptic } from "@/lib/haptics";

/**
 * Putting the defib pads on, anterolateral: one under the patient's right collarbone, one on the left side of the
 * chest below the armpit (mid-axillary, about V6), so the current crosses the heart. The chest is seen from the
 * foot of the bed, so the patient's right is on the player's left. Drag a pad, or tap a pad then tap the chest.
 * A wrong spot sends the pad back with a reason; after a miss (or a few seconds) the spots show as dashed outlines.
 */

// Drawing space of the chest, and the two places a pad belongs
const W = 200, H = 210;
const ZONES = [
  { x: 70, y: 62, name: "ใต้ไหปลาร้าขวา" },
  { x: 146, y: 128, name: "ข้างลำตัวซ้ายใต้รักแร้" },
] as const;
const HIT = 27;

export type PadMiss = "sternum" | "low" | "high" | "side";

function missReason(x: number, y: number): PadMiss {
  if (y > 168) return "low";
  if (y < 40) return "high";
  if (Math.abs(x - 102) < 18 && y < 150) return "sternum";
  return "side";
}

export const MISS_LINE: Record<PadMiss, string> = {
  sternum: "อย่าวางบนกระดูกหน้าอกค่ะ แผ่นหนึ่งใต้ไหปลาร้าขวา อีกแผ่นข้างลำตัวซ้ายใต้รักแร้",
  low: "ต่ำไปค่ะ ตรงนั้นท้องแล้ว ไฟต้องวิ่งผ่านหัวใจ",
  high: "สูงไปค่ะ ให้อยู่ใต้ไหปลาร้า",
  side: "ยังไม่ใช่ค่ะ ให้หัวใจอยู่ตรงกลางระหว่างสองแผ่น ขวาบนกับซ้ายล่าง",
};

function Pad({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-17} y={-12} width={34} height={24} rx={5} fill="#fbf7ee" stroke="#3a2a2f" strokeWidth={2.5} />
      <rect x={-12} y={-7} width={24} height={14} rx={3} fill="#e8eef5" />
      <path d="M0,4 l-5,-5 a3,3 0 0,1 5,-3 a3,3 0 0,1 5,3 z" fill="#e06b72" />
    </g>
  );
}

export function PadPlacement({ onPlaced, onMiss, onDone }: { onPlaced: (n: number) => void; onMiss: (why: PadMiss) => void; onDone: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  // which zone each pad sits in (null = still in the tray)
  const [placed, setPlaced] = useState<(number | null)[]>([null, null]);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ pad: number; dx: number; dy: number; moved: boolean; startX: number; startY: number } | null>(null);
  const [hint, setHint] = useState(false);
  const done = useRef(false);

  useEffect(() => { const t = setTimeout(() => setHint(true), 6000); return () => clearTimeout(t); }, []);

  /** Screen point to drawing coordinates */
  const toChest = (cx: number, cy: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return null;
    const s = Math.min(r.width / W, r.height / H);
    const ox = r.left + (r.width - W * s) / 2, oy = r.top + (r.height - H * s) / 2;
    return { x: (cx - ox) / s, y: (cy - oy) / s };
  };

  const drop = (pad: number, cx: number, cy: number) => {
    const pt = toChest(cx, cy);
    if (!pt || pt.x < -20 || pt.x > W + 20 || pt.y < -10 || pt.y > H + 10) return;
    const taken = placed.filter((z, i) => z !== null && i !== pad);
    const zone = ZONES.findIndex((z, i) => !taken.includes(i) && Math.hypot(pt.x - z.x, pt.y - z.y) < HIT);
    if (zone < 0) {
      audio.playBump();
      haptic.vibrate();
      setHint(true);
      onMiss(missReason(pt.x, pt.y));
      return;
    }
    const next = placed.map((z, i) => (i === pad ? zone : z));
    setPlaced(next);
    setSelected(null);
    audio.playTone(660, "square", 0.06, 0.05);
    haptic.impact("light");
    const n = next.filter((z) => z !== null).length;
    onPlaced(n);
    if (n === 2 && !done.current) { done.current = true; setTimeout(onDone, 500); }
  };

  const down = (pad: number) => (e: React.PointerEvent) => {
    if (placed[pad] !== null) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ pad, dx: 0, dy: 0, moved: false, startX: e.clientX, startY: e.clientY });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 8 });
  };
  const up = (e: React.PointerEvent) => {
    if (!drag) return;
    const { pad, moved } = drag;
    setDrag(null);
    if (moved) drop(pad, e.clientX, e.clientY);
    else { audio.playClick(); setSelected((s) => (s === pad ? null : pad)); }
  };
  // Tap a pad, then tap the chest
  const tapChest = (e: React.MouseEvent) => { if (selected !== null) drop(selected, e.clientX, e.clientY); };

  const skin = "#d19a6e", skinDark = "#b07d55", line = "#8a5b3c";
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#f3e3c3]/95 select-none" data-testid="cold-open-pads">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="flex-1 min-h-0 w-full" onClick={tapChest} style={{ touchAction: "none" }}>
        {/* the patient's chest, from the foot of the bed */}
        <rect x={84} y={0} width={32} height={22} fill={skin} />
        <path d="M30,30 Q100,8 170,30 L182,70 L172,200 L28,200 L18,70 Z" fill={skin} stroke={skinDark} strokeWidth={3} />
        <path d="M44,40 Q72,34 96,44 M104,44 Q128,34 156,40" stroke={line} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <path d="M102,46 L102,140" stroke={line} strokeWidth={2} strokeDasharray="3 4" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${48 - i * 2},${78 + i * 22} Q${75},${86 + i * 22} ${96},${80 + i * 22} M${108},${80 + i * 22} Q${130},${86 + i * 22} ${156 + i * 2},${78 + i * 22}`} stroke={skinDark} strokeWidth={1.5} fill="none" opacity={0.5} />
        ))}
        <circle cx={70} cy={100} r={4} fill={skinDark} /><circle cx={134} cy={100} r={4} fill={skinDark} />
        <text x={14} y={22} fontSize={10} fill="#86522e" fontFamily="Itim, Tahoma, sans-serif">ขวาของคนไข้</text>
        <text x={186} y={22} fontSize={10} fill="#86522e" textAnchor="end" fontFamily="Itim, Tahoma, sans-serif">ซ้าย</text>
        {/* where the pads go: shown after a miss or a few seconds */}
        {ZONES.map((z, i) => (
          <circle key={i} cx={z.x} cy={z.y} r={HIT - 6} fill="none" stroke="#5fa96a" strokeWidth={2.5} strokeDasharray="5 4"
            opacity={hint && !placed.includes(i) ? 0.9 : 0} data-testid={`pad-zone-${i}`} />
        ))}
        {placed.map((z, i) => (z === null ? null : <Pad key={i} x={ZONES[z].x} y={ZONES[z].y} rot={z === 1 ? 70 : -10} />))}
        {placed.every((z) => z !== null) && (
          <path d={`M${ZONES[0].x},${ZONES[0].y + 12} C60,190 100,215 100,215 M${ZONES[1].x},${ZONES[1].y + 12} C150,190 104,215 104,215`} stroke="#3a2a2f" strokeWidth={2} fill="none" />
        )}
      </svg>
      <div className="shrink-0 flex items-center justify-center gap-6 pb-2 pt-1">
        {[0, 1].map((i) => (
          <button
            key={i}
            onPointerDown={down(i)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)}
            disabled={placed[i] !== null}
            className={`game-key relative w-[58px] h-[42px] rounded-[7px] border-[3px] ${selected === i ? "border-[#e8954a] scale-110" : "border-[#3a2a2f]"} bg-[#fbf7ee] flex items-center justify-center ${placed[i] !== null ? "opacity-25" : ""}`}
            style={drag?.pad === i ? { transform: `translate(${drag.dx}px, ${drag.dy}px)`, zIndex: 20 } : undefined}
            data-testid={`pad-${i}`} aria-label={`แผ่น pad ${i + 1}`}
          >
            <svg viewBox="-17 -12 34 24" className="w-10 h-7 pointer-events-none"><rect x={-12} y={-7} width={24} height={14} rx={3} fill="#e8eef5" /><path d="M0,4 l-5,-5 a3,3 0 0,1 5,-3 a3,3 0 0,1 5,3 z" fill="#e06b72" /></svg>
          </button>
        ))}
      </div>
    </div>
  );
}
