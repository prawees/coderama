"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { OutlineHull } from "./CelShaderMaterial";

/** Cel-shaded box with ink outline - the workhorse for bed/stand/room props. */
export function CelBox({ size, color, position, rotation, outline = 0.03 }: {
  size: [number, number, number]; color: string; position?: [number, number, number]; rotation?: [number, number, number]; outline?: number;
}) {
  const geom = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]);
  const c = useMemo(() => new THREE.Color(color), [color]);
  return (
    <group position={position} rotation={rotation}>
      <OutlineHull geometry={geom} thickness={outline} />
      <mesh geometry={geom}><celShaderMaterial color={c} rimIntensity={0} /></mesh>
    </group>
  );
}

export function Bed() {
  return (
    <group position={[0, 0.4, 0]}>
      <CelBox size={[0.9, 0.06, 2.2]} color="#94b0c2" position={[0, -0.28, 0]} />
      <CelBox size={[0.06, 0.4, 0.04]} color="#566c86" position={[0, -0.05, 1.08]} />
      <CelBox size={[0.06, 0.4, 0.04]} color="#566c86" position={[0, -0.05, -1.08]} />
      {[-0.4, 0.4].map((x) => [-0.9, 0.9].map((z) => (
        <CelBox key={`${x}${z}`} size={[0.05, 0.2, 0.05]} color="#333c57" position={[x, -0.38, z]} outline={0.06} />
      )))}
      <CelBox size={[0.86, 0.12, 2.16]} color="#f4f4f4" position={[0, 0.04, 0]} />
      <CelBox size={[0.55, 0.06, 0.35]} color="#ffe9c9" position={[0, 0.14, 0.9]} />
      {/* Side rails */}
      <CelBox size={[0.03, 0.2, 1.4]} color="#94b0c2" position={[0.46, 0.2, 0]} />
      <CelBox size={[0.03, 0.2, 1.4]} color="#94b0c2" position={[-0.46, 0.2, 0]} />
    </group>
  );
}

export function IVStand() {
  return (
    <group position={[1.2, 0.4, 0.6]}>
      <CelBox size={[0.03, 1.4, 0.03]} color="#94b0c2" position={[0, 0.6, 0]} outline={0.08} />
      <CelBox size={[0.3, 0.02, 0.02]} color="#94b0c2" position={[0, 1.3, 0]} outline={0.08} />
      <CelBox size={[0.36, 0.03, 0.36]} color="#566c86" position={[0, -0.1, 0]} />
      <CelBox size={[0.1, 0.18, 0.04]} color="#73eff7" position={[0.15, 1.15, 0]} />
      <CelBox size={[0.06, 0.06, 0.005]} color="#f4f4f4" position={[0.15, 1.15, 0.025]} outline={0.01} />
    </group>
  );
}

export function Room() {
  const floor = useMemo(() => new THREE.PlaneGeometry(10, 8), []);
  return (
    <group>
      <mesh geometry={floor} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <celShaderMaterial color={new THREE.Color("#9badb7")} rimIntensity={0} />
      </mesh>
      {/* Floor tile grid lines - flat ink strips, echo the 2D tile grid */}
      {Array.from({ length: 11 }, (_, i) => (
        <CelBox key={`gx${i}`} size={[0.02, 0.004, 8]} color="#566c86" position={[-5 + i, 0.002, 0]} outline={0} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <CelBox key={`gz${i}`} size={[10, 0.004, 0.02]} color="#566c86" position={[0, 0.002, -4 + i]} outline={0} />
      ))}
      {/* Back wall + curtain rail */}
      <CelBox size={[10, 3, 0.1]} color="#73eff7" position={[0, 1.5, -4]} outline={0.01} />
      <CelBox size={[10, 0.12, 0.1]} color="#38b764" position={[0, 0.06, -3.95]} outline={0.01} />
      <CelBox size={[3.2, 2.2, 0.04]} color="#38b764" position={[2.6, 1.3, -3.9]} outline={0.02} />
    </group>
  );
}
