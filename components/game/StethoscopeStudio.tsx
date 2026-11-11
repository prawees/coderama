"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "@/lib/audio";
import { haptic } from "@/lib/haptics";
import { useERStore } from "@/lib/erStore";
import { PixelIcon } from "@/components/ui/PixelIcon";

/** Tubing colours on offer, named the way people say them on a ward */
export const TUBING = [
  { hex: "#2c2328", th: "ดำคลาสสิก" },
  { hex: "#7a2f3a", th: "แดงเบอร์กันดี" },
  { hex: "#2f3a63", th: "กรมท่า" },
  { hex: "#5fa7cf", th: "ฟ้า" },
  { hex: "#e98aa5", th: "ชมพู" },
  { hex: "#a58ad6", th: "ม่วงลาเวนเดอร์" },
  { hex: "#5fb894", th: "เขียวมิ้นท์" },
  { hex: "#e8954a", th: "ส้ม" },
] as const;

const NAME_MAX = 14;
const STETH_ID = "littmann_classic";

/** Split into what a reader sees as letters, so Thai vowels and tone marks arrive with their consonant */
function graphemes(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment: (t: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (!Seg) return Array.from(s);
  return Array.from(new Seg("th", { granularity: "grapheme" }).segment(s), (x) => x.segment);
}

const OUTLINE = "#3a2a2f";
const METAL = "#c3c9d4", METAL_DARK = "#8d95a5", METAL_LIGHT = "#eef1f6";
// The chestpiece sits here in the drawing; the engraving runs round its upper rim
const CX = 146, CY = 186, R = 31;

function Stethoscope({ color, engraving, shown, laser, zoom, shine }: { color: string; engraving: string; shown: number; laser: boolean; zoom: boolean; shine: boolean }) {
  const letters = graphemes(engraving);
  const visible = letters.slice(0, shown).join("");
  return (
    // Zooming moves the camera (the viewBox) onto the chestpiece, so it lands centred whatever the box size
    <motion.svg className="w-full h-full" data-testid="steth-svg" initial={false}
      animate={{ viewBox: zoom ? `${CX - 44} ${CY - 46} 88 100` : "0 0 200 240" }}
      transition={{ type: "spring", stiffness: 110, damping: 20 }}>
      <defs>
        <path id="rim" d={`M ${CX - R + 7},${CY} a ${R - 7},${R - 7} 0 1,1 ${(R - 7) * 2},0`} />
        <clipPath id="bell"><circle cx={CX} cy={CY} r={R} /></clipPath>
      </defs>
      <g>
        {/* ear tips and the metal binaurals */}
        {[62, 138].map((x) => <circle key={x} cx={x} cy={18} r={7} fill={OUTLINE} />)}
        {[62, 138].map((x) => <circle key={`t${x}`} cx={x} cy={18} r={5} fill="#4a3d48" />)}
        <path d="M62,24 C60,60 84,78 96,96" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" />
        <path d="M138,24 C140,60 116,78 104,96" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" />
        <path d="M62,24 C60,60 84,78 96,96" fill="none" stroke={METAL} strokeWidth={5} strokeLinecap="round" />
        <path d="M138,24 C140,60 116,78 104,96" fill="none" stroke={METAL} strokeWidth={5} strokeLinecap="round" />
        {/* the tubing: outline first, then the colour, then a soft highlight */}
        <path d="M100,96 C100,150 34,140 40,190 C46,232 112,236 122,206" fill="none" stroke={OUTLINE} strokeWidth={17} strokeLinecap="round" />
        <path d="M100,96 C100,150 34,140 40,190 C46,232 112,236 122,206" fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" style={{ transition: "stroke 0.35s ease" }} />
        <path d="M98,104 C96,146 40,140 45,186" fill="none" stroke="#ffffff" strokeOpacity={0.28} strokeWidth={3} strokeLinecap="round" />
        <circle cx={100} cy={96} r={8} fill={METAL} stroke={OUTLINE} strokeWidth={3} />
        {/* stem and chestpiece */}
        <path d="M122,206 L128,200" stroke={OUTLINE} strokeWidth={10} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={R + 3} fill={OUTLINE} />
        <circle cx={CX} cy={CY} r={R} fill={METAL} />
        <circle cx={CX} cy={CY} r={R - 3} fill={METAL_DARK} />
        <circle cx={CX} cy={CY} r={R - 5} fill={METAL} />
        <circle cx={CX} cy={CY + 3} r={R - 14} fill={METAL_LIGHT} stroke={METAL_DARK} strokeWidth={1.5} />
        <circle cx={CX - 8} cy={CY - 2} r={3} fill="#ffffff" fillOpacity={0.8} />
        {/* the engraving, cut into the rim */}
        <text fontSize={7.2} fill="#4b4f5c" letterSpacing={0.4} fontFamily="Itim, Tahoma, sans-serif" data-testid="steth-engraving">
          <textPath href="#rim" startOffset="50%" textAnchor="middle">{visible}</textPath>
        </text>
        {laser && <circle cx={CX} cy={CY - R + 7} r={2.2} fill="#ff6b6b"><animate attributeName="r" values="1.5;3;1.5" dur="0.25s" repeatCount="indefinite" /></circle>}
        {shine && (
          <g clipPath="url(#bell)">
            <motion.rect initial={{ x: CX - R - 30 }} animate={{ x: CX + R + 10 }} transition={{ duration: 0.7, ease: "easeInOut" }} y={CY - R} width={14} height={R * 2} fill="#ffffff" fillOpacity={0.7} transform={`skewX(-20)`} />
          </g>
        )}
      </g>
    </motion.svg>
  );
}

export function StethoscopeStudio({ onClose }: { onClose: () => void }) {
  const st = useERStore();
  const owned = st.inventory.includes(STETH_ID);
  const price = owned ? 0 : 500;
  const [color, setColor] = useState<string>(st.myStethoscope?.color ?? TUBING[2].hex);
  const [engraving, setEngraving] = useState<string>(st.myStethoscope?.engraving ?? (st.playerName && st.playerName !== "Doctor" ? st.playerName : ""));
  const [phase, setPhase] = useState<"pick" | "engrave" | "done">("pick");
  const [shown, setShown] = useState(0);
  const [sparks, setSparks] = useState<number[]>([]);
  const [shine, setShine] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const letters = useMemo(() => graphemes(engraving.trim()), [engraving]);
  const name = TUBING.find((t) => t.hex === color)?.th ?? "";
  const canAfford = st.currency >= price;

  const engrave = () => {
    if (!canAfford || phase !== "pick") return;
    if (price > 0 && !st.buyGear(STETH_ID, price)) return;
    st.equipGear(STETH_ID, "stethoscope");
    st.setMyStethoscope({ color, engraving: engraving.trim() });
    audio.playClick();
    setPhase("engrave");
    setShown(0);
    const n = letters.length;
    // Zoom in, then a letter every 140 ms with a beep and a spray of sparks, then a shine and zoom out
    for (let i = 1; i <= n; i++) {
      later(() => {
        setShown(i);
        setSparks((s) => [...s.slice(-6), Date.now() + i]);
        audio.playTone(1400 + (i % 3) * 180, "square", 0.03, 0.04);
        haptic.impact("light");
      }, 650 + i * 140);
    }
    const end = 650 + n * 140 + 250;
    later(() => { setShine(true); audio.playSparkle(); }, end);
    later(() => { setPhase("done"); haptic.impact("medium"); }, end + 900);
  };

  return (
    <div className="fixed inset-0 z-[160] bg-[#1c1522]/80 flex items-center justify-center p-3 font-pixel" data-testid="steth-studio">
      <div className="cozy-panel w-full max-w-sm max-h-[94vh] overflow-y-auto p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] leading-none">stethoscope ของคุณ</h2>
          {phase !== "engrave" && <button className="cozy-btn px-2 py-0.5 text-lg leading-none" onClick={onClose} aria-label="close">✕</button>}
        </div>

        <div className="relative mx-auto w-[220px] h-[250px] rounded-[8px] border-[3px] border-[#3a2a2f] bg-[#f8ecd0] overflow-hidden">
          <Stethoscope color={color} engraving={engraving.trim()} shown={phase === "pick" ? letters.length : shown} laser={phase === "engrave" && shown < letters.length} zoom={phase === "engrave"} shine={shine} />
          <AnimatePresence>
            {phase === "engrave" && sparks.map((k, i) => (
              <motion.span key={k} initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{ opacity: 0, x: (i % 2 ? 1 : -1) * (14 + (k % 17)), y: -18 - (k % 13), scale: 0.4 }} transition={{ duration: 0.5 }}
                className="absolute left-1/2 top-[24%] w-[6px] h-[6px] rounded-full bg-[#ffd66b]" />
            ))}
          </AnimatePresence>
          {phase === "done" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span key={i} initial={{ y: 230, opacity: 0 }} animate={{ y: -30, opacity: [0, 1, 0] }} transition={{ duration: 1.6, delay: i * 0.12 }}
                  className="absolute" style={{ left: `${10 + i * 15}%` }}><PixelIcon name="heart" size={16} /></motion.span>
              ))}
            </motion.div>
          )}
        </div>

        {phase === "pick" && (
          <>
            <p className="text-[17px] leading-none text-[#86522e]">สีสาย: <span className="text-[#3a2a2f]">{name}</span></p>
            <div className="grid grid-cols-8 gap-1.5" data-testid="steth-colors">
              {TUBING.map((t) => (
                <button key={t.hex} aria-label={t.th} onClick={() => { audio.playClick(); setColor(t.hex); }}
                  className={`aspect-square rounded-full border-[3px] ${color === t.hex ? "border-[#3a2a2f] scale-110" : "border-[#e7d3a8]"} transition-transform`}
                  style={{ background: t.hex }} data-testid={`steth-color-${t.hex.slice(1)}`} />
              ))}
            </div>
            <label className="text-[17px] leading-none text-[#86522e]" htmlFor="engrave">สลักชื่อบน chestpiece</label>
            <input id="engrave" value={engraving} maxLength={NAME_MAX} onChange={(e) => setEngraving(e.target.value.slice(0, NAME_MAX))}
              placeholder="ชื่อเล่น หรือคำที่อยากพกติดตัว"
              className="w-full rounded-[5px] border-2 border-[#3a2a2f] bg-white px-2 py-1.5 text-[18px] leading-none text-[#3a2a2f]" data-testid="steth-engrave-input" />
            <button onClick={engrave} disabled={!canAfford || !letters.length} aria-disabled={!canAfford || !letters.length}
              className={`cozy-btn cozy-btn-sun w-full py-2 text-[21px] leading-none flex items-center justify-center gap-1.5 ${!canAfford || !letters.length ? "opacity-50" : ""}`} data-testid="steth-engrave">
              {!letters.length ? "ใส่ชื่อก่อนนะ" : price ? <><PixelIcon name="coin" size={15} />สลักชื่อแล้วรับเลย {price}</> : "สลักชื่อใหม่"}
            </button>
            {!canAfford && <p className="text-[15px] leading-none text-[#c4374a]">เหรียญยังไม่พอ ดูคนไข้อีกสักเคสก่อนนะ</p>}
          </>
        )}
        {phase === "engrave" && <p className="text-center text-[18px] leading-none text-[#86522e]" data-testid="steth-engraving-now">กำลังสลักชื่อ...</p>}
        {phase === "done" && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-2 text-center" data-testid="steth-done">
            <p className="text-[20px] leading-snug">stethoscope สี{name} สลักว่า "{engraving.trim()}"<br />พร้อมใช้งานแล้ว</p>
            <button onClick={() => { audio.playClick(); onClose(); }} className="cozy-btn cozy-btn-leaf w-full py-2 text-[21px] leading-none" data-testid="steth-wear">คล้องคอแล้วไปเข้าเวร</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
