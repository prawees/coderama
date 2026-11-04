"use client";
import { useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { withBase } from "@/lib/basePath";
import { BodyRegion } from "@/lib/examOrder";
import { Box, INK } from "./Materials";

export interface LiveVitals { hr: number; sbp: number; dbp: number; rr: number; spo2: number; temp: number; }
export interface BedsideProps {
  vitalsRef: React.MutableRefObject<LiveVitals>;
  appearance?: { skinTone?: string; bmiFactor?: number; ageGroup?: string };
  examined: BodyRegion[];
  onRegion: (r: BodyRegion) => void;
}

const SPOTS: { id: BodyRegion; pos: [number, number, number]; r: number }[] = [
  { id: "head", pos: [0, 0.32, 0.86], r: 0.2 },
  { id: "chest", pos: [0, 0.3, 0.38], r: 0.24 },
  { id: "abdomen", pos: [0, 0.26, -0.08], r: 0.2 },
  { id: "limbs", pos: [0, 0.22, -0.68], r: 0.3 },
];

/** Tiled floor drawn once on a small canvas, so it stays chunky like the clinic's mint tile. */
function useTileTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const x = c.getContext("2d")!;
    x.fillStyle = "#a9d3cc"; x.fillRect(0, 0, 32, 32);
    x.fillStyle = "#9fc9c4"; x.fillRect(0, 0, 16, 16); x.fillRect(16, 16, 16, 16);
    x.fillStyle = "#7fa9a6"; x.fillRect(0, 0, 32, 1); x.fillRect(0, 0, 1, 32); x.fillRect(0, 16, 32, 1); x.fillRect(16, 0, 1, 32);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 4);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function Room() {
  const tile = useTileTexture();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 8]} /><meshBasicMaterial map={tile} toneMapped={false} /></mesh>
      {/* Back wall: cream plaster over a wood wainscot, like the clinic */}
      <mesh position={[0, 1.6, -3.99]}><planeGeometry args={[10, 3.2]} /><meshBasicMaterial color="#f3e3c3" toneMapped={false} /></mesh>
      <mesh position={[0, 0.38, -3.98]}><planeGeometry args={[10, 0.76]} /><meshBasicMaterial color="#b47640" toneMapped={false} /></mesh>
      <mesh position={[0, 0.78, -3.97]}><planeGeometry args={[10, 0.06]} /><meshBasicMaterial color="#86522e" toneMapped={false} /></mesh>
      <mesh position={[-4.99, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[8, 3.2]} /><meshBasicMaterial color="#eedbb6" toneMapped={false} /></mesh>
      <mesh position={[-4.98, 0.38, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[8, 0.76]} /><meshBasicMaterial color="#a86c38" toneMapped={false} /></mesh>
      {/* Window with the sky behind it, on the wall the camera faces */}
      <Box size={[0.05, 1.1, 1.5]} color="#86522e" position={[-4.95, 1.75, 1.1]} outline={0.02} />
      <Box size={[0.05, 0.9, 1.3]} color="#bfe6f0" position={[-4.92, 1.75, 1.1]} outline={0} />
      <Box size={[0.06, 0.9, 0.05]} color="#86522e" position={[-4.9, 1.75, 1.1]} outline={0} />
      {/* Curtain drawn back behind the bed */}
      <Box size={[0.08, 2, 1.6]} color="#8fd0de" position={[-2.3, 1.0, -1.4]} />
    </group>
  );
}

function Bed() {
  return (
    <group position={[0, 0.4, 0]}>
      <Box size={[0.92, 0.06, 2.2]} color="#9aa9a6" position={[0, -0.26, 0]} />
      {[-0.4, 0.4].map((x) => [-0.95, 0.95].map((z) => (
        <Box key={`${x}${z}`} size={[0.05, 0.22, 0.05]} color="#6f7f7c" position={[x, -0.38, z]} />
      )))}
      <Box size={[0.92, 0.42, 0.05]} color="#9aa9a6" position={[0, 0.02, 1.12]} />
      <Box size={[0.92, 0.26, 0.05]} color="#9aa9a6" position={[0, -0.06, -1.12]} />
      <Box size={[0.88, 0.12, 2.16]} color="#fff6e3" position={[0, 0.04, 0]} />
      <Box size={[0.56, 0.07, 0.34]} color="#f8ecd0" position={[0, 0.14, 0.88]} />
    </group>
  );
}

function Patient({ appearance, examined, onRegion, vitalsRef }: BedsideProps) {
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);
  const body = useLoader(STLLoader, withBase("/assets/standard_male_lowpoly.stl"));
  const blanket = useLoader(STLLoader, withBase("/assets/blanket_lowpoly.stl"));
  const [hover, setHover] = useState<BodyRegion | null>(null);
  const skin = useMemo(() => new THREE.Color(appearance?.skinTone && /^#[0-9a-f]{6}$/i.test(appearance.skinTone) ? appearance.skinTone : "#e0ac69"), [appearance?.skinTone]);
  const bmi = appearance?.bmiFactor || 1;
  const kid = appearance?.ageGroup === "child";
  const s = kid ? 0.72 : 1;
  const scale: [number, number, number] = [0.2 * bmi * s, 0.2 * s, 0.2 * bmi * s];
  const hull: [number, number, number] = [scale[0] * 1.03, scale[1] * 1.03, scale[2] * 1.03];
  const rot: [number, number, number] = [-Math.PI / 2, 0, Math.PI];
  const offset = kid ? 0.42 : 0.3;

  useFrame((_, dt) => {
    t.current += dt;
    if (!group.current) return;
    // The chest rises with the respiratory rate; no breathing at RR 0
    const rr = Math.max(0, vitalsRef.current.rr);
    group.current.position.y = 0.4 + (rr > 0 ? Math.sin(t.current * (rr / 60) * Math.PI * 2) * 0.007 : 0);
  });

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      <mesh geometry={body} rotation={rot} position={[0.1, 0, offset]} scale={hull}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
      <mesh geometry={body} rotation={rot} position={[0.1, 0, offset]} scale={scale}><celShaderMaterial color={skin} /></mesh>
      <mesh geometry={blanket} rotation={rot} position={[0.1, 0.02, offset]} scale={hull}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
      <mesh geometry={blanket} rotation={rot} position={[0.1, 0.02, offset]} scale={scale}><celShaderMaterial color={new THREE.Color("#7fb6c9")} /></mesh>
      {SPOTS.map((sp) => {
        const done = examined.includes(sp.id);
        return (
          <mesh key={sp.id} position={sp.pos}
            onPointerOver={(e) => { e.stopPropagation(); setHover(sp.id); }}
            onPointerOut={() => setHover(null)}
            onClick={(e) => { e.stopPropagation(); onRegion(sp.id); }}>
            <sphereGeometry args={[sp.r, 10, 8]} />
            <meshBasicMaterial color={done ? "#86c35f" : "#ffd66b"} transparent opacity={hover === sp.id ? 0.42 : done ? 0.16 : 0.1} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Bedside monitor: a PQRST trace synthesized from the case's heart rate, on a small chunky canvas. */
function Monitor({ vitalsRef }: { vitalsRef: BedsideProps["vitalsRef"] }) {
  const canvas = useMemo(() => { const c = document.createElement("canvas"); c.width = 128; c.height = 80; return c; }, []);
  const tex = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t; }, [canvas]);
  const trace = useRef<number[]>(new Array(128).fill(50));
  const phase = useRef(0);
  const ecg = (x: number) => {
    const g = (c: number, w: number, a: number) => a * Math.exp(-((x - c) ** 2) / (2 * w * w));
    return g(0.18, 0.025, 3) - g(0.3, 0.008, 4) + g(0.34, 0.012, 22) - g(0.38, 0.01, 6) + g(0.62, 0.05, 5);
  };
  useFrame((_, dt) => {
    const c = canvas.getContext("2d");
    if (!c) return;
    const v = vitalsRef.current;
    const hr = Math.max(0, v.hr);
    // 0/0 with no rate is shown as coarse VF, not a flat line, so an arrest looks like one
    const arrest = hr === 0;
    phase.current = (phase.current + dt * (arrest ? 0.35 : hr / 60)) % 1;
    const y = arrest ? Math.sin(phase.current * 40) * 6 + Math.sin(phase.current * 23) * 4 + (Math.random() - 0.5) * 3 : ecg(phase.current);
    trace.current.push(58 - y); trace.current.shift();
    c.fillStyle = "#1b2320"; c.fillRect(0, 0, 128, 80);
    c.fillStyle = arrest ? "#ff8a8a" : "#9be38a";
    trace.current.forEach((yy, i) => c.fillRect(i, Math.round(yy), 1, 1));
    c.font = "bold 12px monospace"; c.textBaseline = "top";
    c.fillStyle = hr > 110 || hr < 40 ? "#ff8a8a" : "#9be38a"; c.fillText(`HR ${Math.round(hr)}`, 3, 2);
    c.fillStyle = v.sbp < 90 ? "#ff8a8a" : "#ffd66b"; c.fillText(`${Math.round(v.sbp)}/${Math.round(v.dbp)}`, 62, 2);
    c.fillStyle = v.spo2 < 92 ? "#ff8a8a" : "#7fc8d8"; c.fillText(`SpO2 ${Math.round(v.spo2)}`, 3, 15);
    tex.needsUpdate = true;
  });
  return (
    <group position={[-1.15, 1.0, -0.35]} rotation={[0, Math.PI / 2, 0]}>
      <Box size={[1.1, 0.72, 0.1]} color="#6b5a4e" />
      <mesh position={[0, 0, 0.056]}><planeGeometry args={[0.98, 0.61]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <Box size={[0.06, 0.65, 0.06]} color="#6f7f7c" position={[0, -0.68, 0]} />
      <Box size={[0.5, 0.05, 0.5]} color="#6f7f7c" position={[0, -0.98, 0]} />
    </group>
  );
}

function IVPole() {
  return (
    <group position={[-0.8, 0, 1.3]}>
      <Box size={[0.04, 1.75, 0.04]} color="#9aa9a6" position={[0, 0.88, 0]} />
      <Box size={[0.36, 0.03, 0.03]} color="#9aa9a6" position={[0, 1.74, 0]} />
      <Box size={[0.42, 0.05, 0.42]} color="#6f7f7c" position={[0, 0.03, 0]} />
      <Box size={[0.13, 0.22, 0.05]} color="#d9f0f4" position={[0.14, 1.58, 0]} />
    </group>
  );
}

function SideTable() {
  return (
    <group position={[-1.05, 0, 0.55]}>
      <Box size={[0.5, 0.6, 0.5]} color="#c48a52" position={[0, 0.3, 0]} />
      <Box size={[0.4, 0.04, 0.02]} color="#86522e" position={[0, 0.34, 0.26]} outline={0} />
      <Box size={[0.1, 0.14, 0.1]} color="#fff6e3" position={[0.1, 0.68, 0]} outline={0.015} />
    </group>
  );
}

export function BedsideScene(p: BedsideProps) {
  return (
    <group>
      {/* The camera stays at the bedside: no panning, no clipping through the floor or walls */}
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.12} minDistance={2.3} maxDistance={4.4}
        minPolarAngle={0.55} maxPolarAngle={1.25} minAzimuthAngle={0.75} maxAzimuthAngle={2.4} target={[-0.1, 0.5, 0.05]} />
      <Room />
      <Bed />
      <Patient {...p} />
      <Monitor vitalsRef={p.vitalsRef} />
      <IVPole />
      <SideTable />
    </group>
  );
}
