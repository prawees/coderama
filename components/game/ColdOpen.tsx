"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { haptic } from "@/lib/haptics";
import { audio } from "@/lib/audio";
import { PixelPortrait } from "@/components/game/PixelPortrait";
import { PixelLogo } from "@/components/game/PixelLogo";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { RichText } from "@/components/game/RichText";
import type { LiveVitals } from "@/components/exam3d/BedsideScene";
import { type Challenge, type ColdOpenResult, challengeUrl, fmtSecs, outcomeNote, resultLine, shareLink, verdict } from "@/lib/invite";

const Bedside3D = dynamic(() => import("@/components/exam3d/Bedside3D"), { ssr: false });

/**
 * The first thing a new player does: years from now, as the attending, run a VF arrest.
 * It is the whole game in 40 seconds, the ER, the teaching and the payoff, before any menu or form.
 * The order follows ACLS: CPR and an early shock, straight back on the chest, rhythm check at 2 minutes.
 * It cannot be failed, a wrong call just gets corrected the way a nurse would.
 */
type Beat = "arrive" | "order" | "cpr1" | "charge" | "shock" | "cpr2" | "later" | "rosc" | "back" | "title";
type Rhythm = "vf" | "cpr" | "flat" | "sinus";

/**
 * CPR here teaches the rhythm without punishing it. There is no count to restart: each compression fills a
 * meter of blood reaching the brain, a good one (100 to 120 a minute, measured over the last few) fills it
 * fastest, an off one still helps a little. So a bad rhythm only takes a few more presses, never a do-over.
 */
const RATE_LOW = 95, RATE_HIGH = 130;
const FILL = { cpr1: { good: 0.17, off: 0.08 }, cpr2: { good: 0.26, off: 0.12 } };

/** Compressions a minute over the last few taps */
function rateOf(taps: number[]) {
  const t = taps.slice(-5);
  if (t.length < 3) return 0;
  return Math.round(60000 / ((t[t.length - 1] - t[0]) / (t.length - 1)));
}

/** A line that types itself out, laid out sentence by sentence. data-text holds the whole line. */
function Typed({ text, className, testid, speed = 16, tone = "light" }: { text: string; className?: string; testid?: string; speed?: number; tone?: "light" | "dark" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(id); return k; } return k + 1; }), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <RichText text={text} shown={n} tone={tone} className={className} testid={testid} />;
}

const ORDERS: { text: string; right?: boolean; why?: string }[] = [
  { text: "ให้ atropine 1 mg IV", why: "VF ไม่ใช่ bradycardia ค่ะอาจารย์ atropine ไม่ช่วย" },
  { text: "เริ่ม CPR แล้ว defib 200 J", right: true },
  { text: "ส่ง electrolyte รอผลก่อน", why: "รอไม่ได้ค่ะ ทุกนาทีที่ไม่ได้ช็อก โอกาสรอดลดลงราว 10%" },
];

const ANN: Partial<Record<Beat, string>> = {
  arrive: "อาจารย์คะ! ลุงอายุ 58 ล้มหน้าห้องตรวจ คลำ pulse ไม่ได้ค่ะ",
  order: "monitor เป็น VF ค่ะ สั่งเลยค่ะอาจารย์",
  cpr1: "กดเลยค่ะ! ลึก 5 ถึง 6 cm เร็ว 100 ถึง 120 ครั้ง/นาที กดตาม PUSH ได้เลยค่ะ",
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

export function ColdOpen({ onDone, replay = false, challenge = null, playerName = null }: { onDone: () => void; replay?: boolean; challenge?: Challenge | null; playerName?: string | null }) {
  const [beat, setBeat] = useState<Beat>("arrive");
  // The score a friend can be challenged with: time from the first order to ROSC, and CPR on rate
  const orderAt = useRef(0);
  const cprTaps = useRef({ rated: 0, good: 0 });
  const wrongs = useRef(0);
  const [result, setResult] = useState<ColdOpenResult | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const counted = useRef(0);
  const taps = useRef<number[]>([]);
  const [rate, setRate] = useState(0);
  const [coach, setCoach] = useState<string | null>(null);
  const [perfusion, setPerfusion] = useState(0);
  const fill = useRef(0);
  const [pulses, setPulses] = useState<number[]>([]);
  const [cue, setCue] = useState(0);
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
    later(() => { orderAt.current = performance.now(); setBeat((b) => (b === "arrive" ? "order" : b)); }, 2400);
  }, [later]);

  // The alarm sounds until the first order is given
  const alarming = beat === "arrive" || beat === "order";
  useEffect(() => {
    if (!alarming) return;
    audio.playBuzzer();
    const alarm = setInterval(() => audio.playBuzzer(), 2200);
    return () => clearInterval(alarm);
  }, [alarming]);

  const resetCpr = () => { counted.current = 0; taps.current = []; fill.current = 0; setCount(0); setRate(0); setPerfusion(0); };

  // On-beat cues at 110 a minute while compressing: PUSH! PUSH!
  const compressing = beat === "cpr1" || beat === "cpr2";
  useEffect(() => {
    if (!compressing) return;
    const id = setInterval(() => setCue((c) => c + 1), 545);
    return () => clearInterval(id);
  }, [compressing]);

  const compress = (phase: "cpr1" | "cpr2", next: () => void) => {
    const now = performance.now();
    pressRef.current = now;
    compressRef.current = now;
    rhythmRef.current = "cpr";
    audio.playTone(150, "square", 0.05, 0.12);
    haptic.impact("medium");
    if (fill.current >= 1) return;
    counted.current += 1;
    taps.current.push(now);
    setCount(counted.current);
    setPulses((p) => [...p.slice(-4), now]);
    const r = rateOf(taps.current);
    setRate(r);
    const good = r >= RATE_LOW && r <= RATE_HIGH;
    if (r) { cprTaps.current.rated += 1; if (good) cprTaps.current.good += 1; }
    fill.current = Math.min(1, fill.current + (r === 0 ? FILL[phase].off : good ? FILL[phase].good : FILL[phase].off));
    setPerfusion(fill.current);
    // Coach only when the rhythm is clearly off, and praise it once it settles
    setCoach(!r ? null : r < RATE_LOW ? "เร็วขึ้นอีกนิดค่ะ" : r > RATE_HIGH ? "ช้าลงหน่อย ให้หน้าอก fully recoil ก่อนค่ะ" : "ดีมากค่ะ จังหวะนี้แหละ");
    if (fill.current >= 1) later(next, 350);
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
      wrongs.current += 1;
      setWrong(o.why ?? null);
    }
  };

  const toCharge = () => {
    setCoach(null);
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
    setCoach(null);
    setBeat("later");
    rhythmRef.current = "flat";
    later(() => {
      setBeat("rosc");
      rhythmRef.current = "sinus";
      vitalsRef.current = { hr: 88, sbp: 104, dbp: 66, rr: 14, spo2: 96, temp: 36.5 };
      setVitals({ hr: 88, bp: "104/66", spo2: 96 });
      const { rated, good } = cprTaps.current;
      setResult({ secs: Math.max(1, (performance.now() - (orderAt.current || performance.now())) / 1000), cpr: rated ? (good / rated) * 100 : 0, wrong: wrongs.current });
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
      {challenge && (beat === "arrive" || beat === "order") && (
        <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="shrink-0 cozy-tag !bg-[#ffd66b] px-2.5 py-1.5 text-[17px] leading-snug text-center" data-testid="challenge-banner">
          {challenge.name ?? "เพื่อน"}ท้าคุณ! ช่วยลุงรอดใน {fmtSecs(challenge.secs)} วินาที คุณจะเร็วกว่าไหม
        </motion.div>
      )}

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
        {(compressing || beat === "charge" || beat === "shock") && (
          // A small indicator in the top corner, clear of the patient: heart to brain, filling as you press
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-[6px] border-2 border-[#3a2a2f] bg-[#fff8ea]/90 px-1 py-0.5" data-testid="perfusion">
            <span className="animate-[heartbeat_0.545s_ease-out_infinite] leading-none"><PixelIcon name="heart" size={13} /></span>
            <div className="relative w-[46px] h-[8px] rounded-[2px] bg-[#f2dfc0] overflow-hidden border border-[#5c4340]">
              <div className="absolute inset-y-0 left-0 bg-[#e8737f] transition-[width] duration-300" style={{ width: `${perfusion * 100}%` }} />
              {pulses.map((t) => (
                <motion.span key={t} initial={{ left: "-15%", opacity: 1 }} animate={{ left: "100%", opacity: 0.3 }} transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute top-0 bottom-0 w-[7px] rounded-full bg-[#c4374a]" />
              ))}
            </div>
            <span className={`leading-none transition-[filter] duration-300 ${perfusion > 0.5 ? "" : "grayscale"}`}><PixelIcon name="brain" size={15} /></span>
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col gap-2 justify-end min-h-[220px]">
        {compressing && (
          <div className="relative rounded-[6px] border-[3px] border-[#3a2a2f] bg-[#241c2b] px-2.5 pt-1.5 pb-2" data-testid="cpr-hud">
            <div className="flex items-end justify-between leading-none">
              <span className="text-[14px] text-[#cfc3dc]">อัตรากดหน้าอก</span>
              <span className="flex items-baseline gap-1">
                <span className={`text-[30px] tabular-nums ${!rate ? "text-[#cfc3dc]" : rate >= RATE_LOW && rate <= RATE_HIGH ? "text-[#a5ecc0]" : "text-[#ffb3b8]"}`} data-testid="cold-open-rate">{rate || "..."}</span>
                <span className="text-[13px] text-[#cfc3dc]">ครั้ง/นาที</span>
              </span>
            </div>
            {/* 60 to 160 a minute, the 100 to 120 target shaded green */}
            <div className="relative h-3 mt-1.5 rounded-[2px] bg-[#43355a] overflow-hidden">
              <div className="absolute inset-y-0 bg-[#5fa96a]" style={{ left: "40%", width: "20%" }} />
              {rate > 0 && <div className="absolute inset-y-[-2px] w-[4px] bg-[#ffe08a] transition-[left] duration-150" style={{ left: `calc(${Math.max(0, Math.min(100, rate - 60))}% - 2px)` }} />}
            </div>
            <div className="flex justify-between text-[11px] leading-none mt-1 text-[#9d90ae]"><span>60</span><span>100</span><span>120</span><span>160</span></div>
            <AnimatePresence>
              <motion.span key={cue} initial={{ scale: 1.5, opacity: 1, rotate: cue % 2 ? 6 : -6 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
                className={`pointer-events-none absolute -top-6 px-2 py-0.5 rounded-[4px] border-[3px] border-[#3a2a2f] bg-[#ffe08a] text-[24px] leading-none text-[#7a3f24] ${cue % 2 ? "right-5" : "left-5"}`} data-testid="push-cue">PUSH!</motion.span>
            </AnimatePresence>
          </div>
        )}
        {line && (
          <div className="cozy-panel flex gap-2 items-center p-2">
            <div className="w-12 h-12 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#3a2a2f]"><PixelPortrait speaker="Nurse Ann" className="w-full h-full" /></div>
            <div className="min-w-0">
              <p className="text-[14px] leading-none text-[#86522e]">พี่แอน</p>
              <Typed text={coach ?? wrong ?? line} className="text-[19px] leading-[1.3] mt-1 text-[#3a2a2f]" testid="cold-open-line" />
            </div>
          </div>
        )}

        {beat === "order" && ORDERS.map((o, i) => (
          <motion.button key={o.text} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.09 }}
            onClick={() => order(o)} className="cozy-btn w-full py-2 text-[19px] leading-tight" data-testid={o.right ? "cold-open-right" : "cold-open-wrong"}>{o.text}</motion.button>
        ))}

        {compressing && (
          <button
            onClick={() => (beat === "cpr1" ? compress("cpr1", toCharge) : compress("cpr2", toLater))}
            className="cozy-btn w-full py-6 text-[32px] leading-none text-white animate-[cprPump_0.545s_ease-in-out_infinite]"
            data-testid="cold-open-press"
          >
            กดหน้าอก
          </button>
        )}

        {beat === "charge" && (
          <button onClick={fire} className="cozy-btn cozy-btn-sun w-full py-6 text-[34px] leading-none animate-[cozyBeat_0.4s_ease-in-out_infinite]" data-testid="cold-open-shock">ช็อก 200 J</button>
        )}

        {beat === "later" && <p className="text-center text-[28px] leading-none text-[#ffd66b] py-8" data-testid="cold-open-later">2 นาทีต่อมา หยุดเช็ค rhythm...</p>}

        {beat === "rosc" && (
          <>
            <p className="text-center cozy-tag !bg-[#86c35f] self-center px-3 py-1 text-[24px] leading-none animate-slide-up" data-testid="cold-open-rosc">ROSC</p>
            {result && (
              <div className="self-center flex flex-col items-center gap-1 animate-slide-up" data-testid="cold-open-score">
                <p className="text-[18px] leading-none text-[#fbf3e2]">{resultLine(result)}</p>
                {challenge && (() => { const v = verdict(result, challenge); return (
                  <p className={`cozy-tag px-2 py-0.5 text-[18px] leading-none ${v.won ? "!bg-[#ffd66b]" : ""}`} data-testid="challenge-verdict">{v.text}</p>
                ); })()}
              </div>
            )}
            <button onClick={() => { audio.playClick(); setBeat("back"); later(() => setBeat("title"), 2400); }} className="cozy-btn cozy-btn-leaf w-full py-3 text-[22px] leading-none" data-testid="cold-open-next">ต่อไป</button>
          </>
        )}
      </div>

      {flash && <div className="absolute inset-0 z-30 bg-white" />}

      <AnimatePresence>
        {closing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="absolute inset-0 z-40 bg-[#1c1522] flex flex-col items-center justify-center gap-5 px-8 text-center" data-testid="cold-open-end">
            <Typed text="แต่ก่อนจะถึงคืนนี้... คุณเป็นแค่ นศพ. ปี 5 รองเท้าขาวเอี่ยม" speed={38} tone="dark" className="text-[24px] leading-snug text-[#fbf3e2]" />
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
                  {result && <p className="mt-3 text-[16px] leading-none text-[#c9b79c]" data-testid="cold-open-score-title">คุณทำได้ {resultLine(result)}</p>}
                  {result && (
                    <button
                      onClick={async () => {
                        audio.playClick();
                        const won = challenge ? verdict(result, challenge).won : false;
                        const text = challenge
                          ? `${won ? "ชนะแล้ว" : "เกือบชนะ"} ${resultLine(result)} ใน Code Rama ลองแก้มือดูสิ`
                          : `ช่วยลุง VF กลับมาได้ ${resultLine(result)} ใน Code Rama คุณจะเร็วกว่าไหม`;
                        setShareNote(outcomeNote[await shareLink(text, challengeUrl(result, playerName))]);
                      }}
                      className="cozy-btn cozy-btn-sun w-full mt-1.5 py-2 text-[20px] leading-none flex items-center justify-center gap-1.5"
                      data-testid="challenge-share"
                    >
                      <PixelIcon name="heart" size={15} />{challenge ? "ท้ากลับ" : "ท้าเพื่อนให้ลองบ้าง"}
                    </button>
                  )}
                  {shareNote && <p className="mt-1.5 text-[15px] leading-none text-[#ffd66b]" data-testid="challenge-note">{shareNote}</p>}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
