"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OutlineHull } from "./CelShaderMaterial";

export interface LiveVitals { hr: number; sbp: number; dbp: number; rr: number; spo2: number; temp: number; }

interface MonitorProps {
  vitalsRef: React.MutableRefObject<LiveVitals>;
  pendingRef: React.MutableRefObject<boolean>;
  elapsedRef: React.MutableRefObject<number>;
  pendingLabel: string;
}

/**
 * Bedside monitor with a real-time synthesized ECG. The waveform is a
 * PQRST composite driven by HR (asystole → flat line with noise).
 * Drawn on a 256×160 canvas with 2px "pixels", nearest-filtered.
 */
export function Monitor({ vitalsRef, pendingRef, elapsedRef, pendingLabel }: MonitorProps) {
  const canvas = useMemo(() => { const c = document.createElement("canvas"); c.width = 256; c.height = 160; return c; }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }, [canvas]);
  const trace = useRef<number[]>(new Array(120).fill(80));
  const phase = useRef(0);
  const frameGeom = useMemo(() => new THREE.BoxGeometry(1.6, 1.1, 0.12), []);

  // PQRST synthesis on a 0..1 cycle
  const ecg = (t: number) => {
    const g = (c: number, w: number, a: number) => a * Math.exp(-((t - c) ** 2) / (2 * w * w));
    return g(0.18, 0.025, 6) - g(0.30, 0.008, 8) + g(0.34, 0.012, 40) - g(0.38, 0.010, 12) + g(0.62, 0.05, 9);
  };

  useFrame((_, dt) => {
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width, H = canvas.height, P = 2; // 2px art pixel
    const v = vitalsRef.current;

    // Background + bezel grid (flat colours only)
    ctx.fillStyle = "#0d0b14"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1a1c2c";
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, P, H);
    for (let y = 0; y < H; y += 16) ctx.fillRect(0, y, W, P);

    const font = (px: number) => `${px}px "Press Start 2P", "VT323", monospace`;
    ctx.textBaseline = "top";

    if (pendingRef.current) {
      ctx.fillStyle = "#94b0c2"; ctx.font = font(10); ctx.textAlign = "center";
      ctx.fillText(pendingLabel, W / 2, H / 2 - 6);
      ctx.textAlign = "left";
    } else {
      // Advance trace
      const hr = Math.max(0, v.hr);
      if (hr > 0) phase.current = (phase.current + dt * (hr / 60)) % 1;
      const vf = pendingRef.current ? 0 : Math.sin(phase.current * 40) * 9 + Math.sin(phase.current * 23) * 6 + (Math.random() - 0.5) * 4;
      if (hr === 0) phase.current = (phase.current + dt * 0.35) % 1;
      const sample = hr > 0 ? ecg(phase.current) : vf;
      trace.current.push(110 - sample * 1.2); trace.current.shift();

      // Waveform (stepped, 2px blocks)
      ctx.fillStyle = hr === 0 ? "#d95763" : "#99e550";
      trace.current.forEach((y, i) => { ctx.fillRect(i * 2, Math.round(y / P) * P, P, P); ctx.fillRect(i * 2, Math.round(y / P) * P + P, P, P); });

      // Numerics
      const row = (label: string, value: string, color: string, x: number, y: number) => {
        ctx.fillStyle = "#566c86"; ctx.font = font(7); ctx.fillText(label, x, y);
        ctx.fillStyle = color; ctx.font = font(13); ctx.fillText(value, x, y + 10);
      };
      row("HR", `${Math.round(hr)}`, hr > 120 || hr < 50 ? "#d95763" : "#99e550", 8, 8);
      row("SpO2", `${Math.round(v.spo2)}`, v.spo2 < 92 ? "#d95763" : "#73eff7", 72, 8);
      row("NIBP", `${Math.round(v.sbp)}/${Math.round(v.dbp)}`, v.sbp < 90 ? "#d95763" : "#ffcd75", 144, 8);
      row("RR", `${Math.round(v.rr)}`, v.rr > 24 ? "#ffcd75" : "#f4f4f4", 8, 40);
      row("T", `${v.temp.toFixed(1)}`, v.temp > 38 ? "#ef7d57" : "#f4f4f4", 72, 40);

      // Elapsed
      const s = Math.floor(elapsedRef.current);
      ctx.fillStyle = "#ffcd75"; ctx.font = font(9); ctx.textAlign = "right";
      ctx.fillText(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`, W - 8, 44);
      ctx.textAlign = "left";
    }
    // Vignette bars (hard)
    ctx.fillStyle = "#0d0b14"; ctx.fillRect(0, H - 6, W, 6);
    texture.needsUpdate = true;
  });

  return (
    <group position={[-1.25, 1.05, -1.1]} rotation={[0, 0.55, 0]}>
      <OutlineHull geometry={frameGeom} thickness={0.03} />
      <mesh geometry={frameGeom}>
        <celShaderMaterial color={new THREE.Color("#b9c9df")} rimIntensity={0} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[1.44, 0.9]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <celShaderMaterial color={new THREE.Color("#6d82a3")} rimIntensity={0} />
      </mesh>
    </group>
  );
}
