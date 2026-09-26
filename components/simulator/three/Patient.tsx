"use client";
import { useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";
import { OutlineHull } from "./CelShaderMaterial";
import { quantizeToPalette } from "@/lib/palettes";

import type { BodyRegion } from "@/lib/clinical/catalog";
export type HotspotId = BodyRegion;

export interface PatientProps {
  pulseRef: React.MutableRefObject<number>;
  joltRef: React.MutableRefObject<number>;          // set >0 by CPR minigame; decays here
  breathingRateRef: React.MutableRefObject<number>; // rr per minute
  appearance?: { skinTone?: string; bmiFactor?: number; ageGroup?: string };
  examined: HotspotId[];
  onHotspot: (id: HotspotId) => void;
}

/** Cel-shaded STL patient with clickable examination hotspots and a CPR jolt. */
export function Patient({ pulseRef, joltRef, breathingRateRef, appearance, examined, onHotspot }: PatientProps) {
  const group = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Mesh>(null);
  const bodyGeom = useLoader(STLLoader, "/assets/standard_male_lowpoly.stl");
  const blanketGeom = useLoader(STLLoader, "/assets/blanket_lowpoly.stl");
  const [hover, setHover] = useState<HotspotId | null>(null);

  const bmi = appearance?.bmiFactor || 1;
  const skin = useMemo(() => new THREE.Color(quantizeToPalette(appearance?.skinTone || "#f1c27d")), [appearance?.skinTone]);
  const bodyScale: [number, number, number] = [0.2 * bmi, 0.2, 0.2 * bmi];

  useFrame((_, dt) => {
    if (!group.current) return;
    // Breathing: chest rise proportional to RR (flat, stepped - 4 discrete positions)
    const rr = Math.max(0, breathingRateRef.current);
    const breathe = rr > 0 ? Math.round(Math.sin(pulseRef.current * (rr / 16)) * 3) / 3 * 0.01 : 0;
    // CPR jolt: instantaneous downward compression, exponential recoil
    if (joltRef.current > 0) joltRef.current = Math.max(0, joltRef.current - dt * 6);
    const jolt = -joltRef.current * 0.06;
    group.current.position.y = 0.4 + breathe + jolt;
    if (chest.current) chest.current.scale.setScalar(1 + (joltRef.current > 0.5 ? 0.15 : 0));
  });

  // Hotspots are invisible-ish picking volumes with hard-edged rim when hovered / examined
  const spots: { id: HotspotId; pos: [number, number, number]; r: number }[] = [
    { id: 'head',       pos: [0.0, 0.34, 0.95], r: 0.15 },
    { id: 'neck',       pos: [0.0, 0.28, 0.74], r: 0.08 },
    { id: 'chest',      pos: [0.0, 0.30, 0.45], r: 0.20 },
    { id: 'abdomen',    pos: [0.0, 0.26, 0.08], r: 0.17 },
    { id: 'pelvis',     pos: [0.0, 0.24, -0.22], r: 0.14 },
    { id: 'upperLimbs', pos: [0.30, 0.24, 0.20], r: 0.12 },
    { id: 'lowerLimbs', pos: [0.0, 0.22, -0.72], r: 0.24 },
  ];

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      {/* Body */}
      <OutlineHull geometry={bodyGeom} rotation={[-Math.PI / 2, 0, Math.PI]} position={[0.1, 0, 0.3]} scale={bodyScale.map((s) => s * 1.03) as any} />
      <mesh geometry={bodyGeom} rotation={[-Math.PI / 2, 0, Math.PI]} position={[0.1, 0, 0.3]} scale={bodyScale}>
        <celShaderMaterial color={skin} rimIntensity={0} />
      </mesh>
      {/* Blanket */}
      <OutlineHull geometry={blanketGeom} rotation={[-Math.PI / 2, 0, Math.PI]} position={[0.1, 0.02, 0.3]} scale={bodyScale.map((s) => s * 1.03) as any} />
      <mesh geometry={blanketGeom} rotation={[-Math.PI / 2, 0, Math.PI]} position={[0.1, 0.02, 0.3]} scale={bodyScale}>
        <celShaderMaterial color={new THREE.Color("#3b5dc9")} rimIntensity={0} />
      </mesh>

      {/* Hotspots */}
      {spots.map((s) => {
        const active = hover === s.id;
        const done = examined.includes(s.id);
        return (
          <mesh
            key={s.id}
            ref={s.id === 'chest' ? chest : undefined}
            position={s.pos}
            onPointerOver={(e) => { e.stopPropagation(); setHover(s.id); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto'; }}
            onClick={(e) => { e.stopPropagation(); onHotspot(s.id); }}
          >
            <sphereGeometry args={[s.r, 12, 8]} />
            <meshBasicMaterial
              color={done ? "#99e550" : "#73eff7"}
              transparent
              opacity={active ? 0.4 : done ? 0.18 : 0.12}
              depthWrite={false}
              wireframe={active}
            />
          </mesh>
        );
      })}
    </group>
  );
}
