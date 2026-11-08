"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { haptic } from "@/lib/haptics";
import { audio } from "@/lib/audio";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { PixelLogo } from "@/components/game/PixelLogo";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { LiveVitals } from "@/components/exam3d/BedsideScene";

const Bedside3D = dynamic(() => import("@/components/exam3d/Bedside3D"), { ssr: false });

/**
 * The first thing a new player does: years from now, as the attending, run a VF arrest.
 * It is the whole game in 40 seconds, the ER, the teaching and the payoff, before any menu or form.
 * The order follows ACLS: CPR and an early shock, straight back on the chest, rhythm check at 2 minutes.
 * It cannot be failed, a wrong call just gets corrected the way a nurse would.
 */
type Beat = "arrive" | "order" | "cpr1" | "charge" | "shock" | "cpr2" | "later" | "rosc" | "back" | "title";
type Rhythm = "vf" | "cpr" | "flat" | "sinus";

const CPR_FIRST = 10, CPR_SECOND = 8;
/** The target is 100 to 120 a minute; only a rate clearly outside it is sent back */
const RATE_LOW = 90, RATE_HIGH = 135;

/** Compressions a minute from tap times, skipping the first taps while the hands find the rhythm */
function rateOf(taps: number[], warmup: number) {
  const t = taps.slice(warmup);
  if (t.length < 3) return 0;
  return Math.round(60000 / ((t[t.length - 1] - t[0]) / (t.length - 1)));
}

/** Text that types itself out, one Thai character cluster at a time. data-text holds the whole line. */
function Typed({ text, className, testid, speed = 18 }: { text: string; className?: string; testid?: string; speed?: number }) {
  const parts = useMemo(() => {
    const Seg = (Intl as any).Segmenter;
    return Seg ? Array.from(new Seg("th", { granularity: "grapheme" }).segment(text) as Iterable<{ segment: string }>).map((x) => x.segment) : Array.from(text);
  }, [text]);
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((k) => { if (k >= parts.length) { clearInterval(id); return k; } return k + 1; }), speed);
    return () => clearInterval(id);
  }, [parts, speed]);
  return (
    <p className={className} data-testid={testid} data-text={text}>
      {parts.slice(0, n).join("")}<span className="opacity-0">{parts.slice(n).join("")}</span>
    </p>
  );
}

const ORDERS: { text: string; right?: boolean; why?: string }[] = [
  { text: "ให้ atropine 1 mg IV", why: "VF ไม่ใช่ bradycardia ค่ะอาจารย์ atropine ไม่ช่วย" },
  { text: "เริ่ม CPR แล้ว defib 200 J", right: true },
  { text: "ส่ง electrolyte รอผลก่อน", why: "รอไม่ได้ค่ะ ทุกนาทีที่ไม่ได้ช็อก โอกาสรอดลดลงราว 10%" },
];

const ANN: Partial<Record<Beat, string>> = {
  arrive: "อาจารย์คะ! ลุงอายุ 58 ล้มหน้าห้องตรวจ คลำ pulse ไม่ได้ค่ะ",
  order: "monitor เป็น VF ค่ะ สั่งเลยค่ะอาจารย์",
  cpr1: "กดเลยค่ะ! ลึก 5 ถึง 6 cm เร็ว 100 ถึง 120 ครั้ง/นาที",
  charge: "ชาร์จ 200 J แล้วค่ะ ทุกคนถอยออกจากเตียง!",
  cpr2: "ช็อกแล้ว! กดต่อทันทีค่ะ อย่าเพิ่งเช็ค pulse",
  rosc: "sinus rhythm ค่ะ คลำ pulse ได้แล้ว กลับมาแล้วค่ะอาจารย์!",
};

function useRhythmStrip(rhythmRef: React.MutableRefObject<Rhythm>, pressRef: React.MutableRefObject<number>) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = 180, H = 36;
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext("2d")!;
    const trace = new Array(W).fill(H / 2);
    let raf = 0, last = performance.now(), x = 0, acc = 0, beat = 0;
    const qrs = [0, -1, 0, 1, -13, 5, 0, 0, -2, -3, -2, 0];
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt * 60;
      while (acc >= 1) {
        acc -= 1;
        const t = now / 1000 + x * 0.013;
        const rhythm = rhythmRef.current;
        let v = 0;
        if (rhythm === "vf") v = Math.sin(t * 31) * 6 + Math.sin(t * 47) * 5 + Math.sin(t * 13) * 3;
        else if (rhythm === "cpr") {
          const since = (now - pressRef.current) / 1000;
          v = since < 0.32 ? -Math.sin((since / 0.32) * Math.PI) * 13 : Math.sin(t * 9) * 1;
        } else if (rhythm === "sinus") {
          beat += 1;
          const period = 44; // about HR 88 at this sweep speed
          const i = beat % period;
          v = qrs[i] ?? 0;
          if (i === 4) audio.playTone(880, "square", 0.05, 0.04);
        }
        trace[x] = H / 2 + v;
        x = (x + 1) % W;
      }
      c.fillStyle = "#1e1826";
      c.fillRect(0, 0, W, H);
      const color = rhythmRef.current === "sinus" ? "#7fe0a0" : rhythmRef.current === "flat" ? "#a99fb5" : "#ff8a8a";
      c.fillStyle = color;
      for (let i = 0; i < W; i++) {
        if (i >= x && i < x + 8) continue; // the sweep gap
        const prev = trace[(i + W - 1) % W], y = trace[i];
        const top = Math.round(Math.min(prev, y)), bot = Math.round(Math.max(prev, y));
        c.fillRect(i, top, 1, Math.max(1, bot - top));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [rhythmRef, pressRef]);
  return ref;
}

export function ColdOpen({ onDone, replay = false }: { onDone: () => void; replay?: boolean }) {
  const [beat, setBeat] = useState<Beat>("arrive");
  const [count, setCount] = useState(0);
  const counted = useRef(0);
  const taps = useRef<number[]>([]);
  const [rate, setRate] = useState(0);
  const [coach, setCoach] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [vitals, setVitals] = useState({ hr: 0, bp: "0/0", spo2: 0 });

  const rhythmRef = useRef<Rhythm>("vf");
  const pressRef = useRef(-1e6);
  const compressRef = useRef(-1e6);
  const vitalsRef = useRef<LiveVitals>({ hr: 0, sbp: 0, dbp: 0, rr: 0, spo2: 0, temp: 36.5 });
  const strip = useRhythmStrip(rhythmRef, pressRef);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    later(() => setBeat((b) => (b === "arrive" ? "order" : b)), 2400);
  }, [later]);

  // The alarm sounds until the first order is given
  const alarming = beat === "arrive" || beat === "order";
  useEffect(() => {
    if (!alarming) return;
    audio.playBuzzer();
    const alarm = setInterval(() => audio.playBuzzer(), 2200);
    return () => clearInterval(alarm);
  }, [alarming]);

  const resetCpr = () => { counted.current = 0; taps.current = []; setCount(0); setRate(0); };

  const compress = (goal: number, warmup: number, next: () => void) => {
    const now = performance.now();
    pressRef.current = now;
    compressRef.current = now;
    rhythmRef.current = "cpr";
    audio.playTone(150, "square", 0.05, 0.12);
    haptic.impact("medium");
    if (counted.current >= goal) return;
    counted.current += 1;
    taps.current.push(now);
    setCount(counted.current);
    const r = rateOf(taps.current, warmup);
    setRate(r);
    // Coach along the way only when it is clearly off, never for a few beats either side of the target
    setCoach(r && r < RATE_LOW ? "ช้าไปนิดค่ะ เร็วขึ้นอีก" : r > RATE_HIGH ? "เร็วไปค่ะ ใจเย็นๆ ให้หน้าอกคืนตัว" : null);
    if (counted.current === goal) {
      if (r >= RATE_LOW && r <= RATE_HIGH) { setCoach(null); later(next, 200); return; }
      audio.playBump();
      haptic.vibrate();
      setCoach(`เฉลี่ย ${r} ครั้ง/นาที ${r < RATE_LOW ? "ช้า" : "เร็ว"}ไปค่ะ เอาใหม่ ให้ได้ 100 ถึง 120 ตามจังหวะปุ่ม`);
      later(resetCpr, 250);
    }
  };

  const order = (o: (typeof ORDERS)[number]) => {
    if (o.right) {
      audio.playClick();
      setWrong(null);
      resetCpr();
      setCoach(null);
      setBeat("cpr1");
    } else {
      audio.playBump();
      haptic.vibrate();
      setWrong(o.why ?? null);
    }
  };

  const toCharge = () => {
    rhythmRef.current = "vf";
    setBeat("charge");
    [392, 523, 659, 784].forEach((f, i) => later(() => audio.playTone(f, "square", 0.1, 0.06), i * 140));
  };

  const fire = () => {
    setBeat("shock");
    setFlash(true);
    setShake(true);
    compressRef.current = performance.now();
    rhythmRef.current = "flat";
    audio.playTone(70, "sawtooth", 0.35, 0.35);
    haptic.impact("heavy");
    later(() => setFlash(false), 140);
    later(() => setShake(false), 500);
    later(() => { resetCpr(); setCoach(null); setBeat("cpr2"); }, 900);
  };

  const toLater = () => {
    setBeat("later");
    rhythmRef.current = "flat";
    later(() => {
      setBeat("rosc");
      rhythmRef.current = "sinus";
      vitalsRef.current = { hr: 88, sbp: 104, dbp: 66, rr: 14, spo2: 96, temp: 36.5 };
      setVitals({ hr: 88, bp: "104/66", spo2: 96 });
      audio.playSparkle();
      haptic.impact("heavy");
    }, 1700);
  };

  const line = ANN[beat];
  const closing = beat === "back" || beat === "title";

  return (
    <div className={`fixed inset-0 z-[60] bg-[#1c1522] font-pixel flex flex-col p-2 gap-2 select-none overflow-hidden ${shake ? "animate-shake" : ""}`} data-testid="cold-open">
      <button onClick={onDone} className="absolute top-3 right-3 z-20 cozy-tag px-2 py-0.5 text-[15px] leading-none" data-testid="cold-open-skip">ข้าม ▸▸</button>

      <p className="shrink-0 pt-2 pl-1 pr-16 text-[17px] leading-none text-[#c9b79c]">อีกหลายปีข้างหน้า ER 03:12 น.</p>

      <div className="shrink-0 cozy-screen rounded-[6px] border-[3px] border-[#3a2a2f] bg-[#1e1826] p-1.5" data-testid="cold-open-monitor">
        <div className="grid grid-cols-3 text-center leading-none">
          {[["HR", vitals.hr], ["BP", vitals.bp], ["SpO2", vitals.spo2 ? `${vitals.spo2}%` : "-"]].map(([k, v]) => (
            <div key={k as string}>
              <p className="text-[13px] text-[#a99fb5]">{k}</p>
              <p className={`text-[26px] tabular-nums ${vitals.hr ? "text-[#7fe0a0]" : "text-[#ff8a8a]"}`} data-testid={`cold-open-${k}`}>{v}</p>
            </div>
          ))}
        </div>
        <canvas ref={strip} className="w-full h-[62px] mt-1" style={{ imageRendering: "pixelated" }} />
      </div>

      <div className="relative flex-1 basis-0 min-h-0 rounded-[6px] border-[3px] border-[#3a2a2f] overflow-hidden bg-[#f3e3c3]">
        <div className="absolute inset-0">
          <Bedside3D vitalsRef={vitalsRef} compressRef={compressRef} examined={[]} onRegion={() => {}} appearance={{ skinTone: "#d19a6e" }} quietFallback />
        </div>
      </div>

      <div className="shrink-0 flex flex-col gap-2 justify-end min-h-[220px]">
        {line && (
          <div className="cozy-panel flex gap-2 items-center p-2">
            <div className="w-12 h-12 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]"><PixelPortrait speaker="Nurse Ann" className="w-full h-full" /></div>
            <div className="min-w-0">
              <p className="text-[14px] leading-none text-[#86522e]">พี่แอน</p>
              <Typed text={coach ?? wrong ?? line} className="text-[18px] leading-tight mt-1" testid="cold-open-line" />
            </div>
          </div>
        )}

        {beat === "order" && ORDERS.map((o, i) => (
          <motion.button key={o.text} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.09 }}
            onClick={() => order(o)} className="cozy-btn w-full py-2 text-[19px] leading-tight" data-testid={o.right ? "cold-open-right" : "cold-open-wrong"}>{o.text}</motion.button>
        ))}

        {(beat === "cpr1" || beat === "cpr2") && (
          <button
            onClick={() => (beat === "cpr1" ? compress(CPR_FIRST, 2, toCharge) : compress(CPR_SECOND, 1, toLater))}
            className="cozy-btn cozy-btn-berry w-full py-5 leading-none animate-[cozyBeat_0.545s_ease-in-out_infinite]"
            data-testid="cold-open-press"
          >
            <span className="block text-[30px]">กดหน้าอก {count}/{beat === "cpr1" ? CPR_FIRST : CPR_SECOND}</span>
            <span className="block text-[16px] mt-1.5 opacity-90" data-testid="cold-open-rate">{rate ? `${rate} ครั้ง/นาที` : "กดตามจังหวะปุ่มที่เต้นอยู่"}</span>
          </button>
        )}

        {beat === "charge" && (
          <button onClick={fire} className="cozy-btn cozy-btn-sun w-full py-6 text-[34px] leading-none animate-[cozyBeat_0.4s_ease-in-out_infinite]" data-testid="cold-open-shock">ช็อก 200 J</button>
        )}

        {beat === "later" && <p className="text-center text-[28px] leading-none text-[#ffd66b] py-8" data-testid="cold-open-later">2 นาทีต่อมา หยุดเช็ค rhythm...</p>}

        {beat === "rosc" && (
          <>
            <p className="text-center cozy-tag !bg-[#86c35f] self-center px-3 py-1 text-[24px] leading-none animate-slide-up" data-testid="cold-open-rosc">ROSC</p>
            <button onClick={() => { audio.playClick(); setBeat("back"); later(() => setBeat("title"), 2400); }} className="cozy-btn cozy-btn-leaf w-full py-3 text-[22px] leading-none" data-testid="cold-open-next">ต่อไป</button>
          </>
        )}
      </div>

      {flash && <div className="absolute inset-0 z-30 bg-white" />}

      <AnimatePresence>
        {closing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="absolute inset-0 z-40 bg-[#1c1522] flex flex-col items-center justify-center gap-5 px-8 text-center" data-testid="cold-open-end">
            <Typed text="แต่ก่อนจะถึงคืนนี้ คุณเป็นแค่ นศพ. ปี 5 รองเท้าขาวเอี่ยม" speed={38} className="text-[24px] leading-snug text-[#fbf3e2]" />
            {beat === "title" && (
              <>
                <motion.div initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
                  <PixelLogo scale={4} animated />
                </motion.div>
                {/* The first goal, as a row of hearts to fill rather than a sentence */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex flex-col items-center gap-2" data-testid="cold-open-goal">
                  <span className="cozy-tag !bg-[#ffd66b] px-2.5 py-1 text-[17px] leading-none">บท 1 เวรแรก</span>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 500, damping: 12 }}>
                        <PixelIcon name="heartEmpty" size={30} />
                      </motion.span>
                    ))}
                    <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }} className="text-[22px] text-[#ffd66b] leading-none">▸</motion.span>
                    <motion.span initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.2, type: "spring", stiffness: 420, damping: 11 }}
                      className="cozy-tag !bg-[#86c35f] px-2 py-1 text-[17px] leading-none">extern</motion.span>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, type: "spring", stiffness: 260, damping: 16 }} className="w-full max-w-xs">
                  <button onClick={onDone} className="cozy-btn cozy-btn-leaf w-full py-3 text-[26px] leading-none animate-[cozyBeat_1.4s_ease-in-out_infinite]" data-testid="cold-open-start">{replay ? "กลับเมนู" : "เริ่มเวรแรก"}</button>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
