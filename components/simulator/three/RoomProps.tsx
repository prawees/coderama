"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { useTexture, Billboard } from "@react-three/drei";
import { OutlineHull } from "./CelShaderMaterial";

/**
 * Examination room dressed with the project's own pixel art (tileset.jpg crops,
 * built by tools/build_assets.py): tiled floor, window wall and upright prop
 * billboards. Nearest filtering keeps the pixels crisp, so the 3D suite reads
 * as the same world as the 2D ward.
 */
function pixelTex(t: THREE.Texture, repeat?: [number, number]) {
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.needsUpdate = true;
  return t;
}

/** Cel-shaded box with ink outline, for the bed frame. */
export function CelBox({ size, color, position, rotation, outline = 0.03 }: {
  size: [number, number, number]; color: string; position?: [number, number, number]; rotation?: [number, number, number]; outline?: number;
}) {
  const geom = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]);
  const c = useMemo(() => new THREE.Color(color), [color]);
  return (
    <group position={position} rotation={rotation}>
      {outline > 0 && <OutlineHull geometry={geom} thickness={outline} />}
      <mesh geometry={geom}><celShaderMaterial color={c} rimIntensity={0} /></mesh>
    </group>
  );
}

/** Upright sprite prop that turns to face the camera around Y only. */
export function Prop({ src, height, position }: { src: string; height: number; position: [number, number, number] }) {
  const tex = useTexture(src);
  pixelTex(tex);
  const img = tex.image as { width: number; height: number } | undefined;
  const w = img ? (height * img.width) / img.height : height;
  return (
    <Billboard position={[position[0], position[1] + height / 2, position[2]]} lockX lockZ>
      <mesh>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.5} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

export function Bed() {
  return (
    <group position={[0, 0.4, 0]}>
      <CelBox size={[0.9, 0.06, 2.2]} color="#b9c9df" position={[0, -0.28, 0]} />
      <CelBox size={[0.06, 0.45, 0.04]} color="#6d82a3" position={[0, -0.05, 1.08]} />
      <CelBox size={[0.06, 0.45, 0.04]} color="#6d82a3" position={[0, -0.05, -1.08]} />
      <CelBox size={[0.9, 0.36, 0.05]} color="#b9c9df" position={[0, 0.02, 1.1]} />
      <CelBox size={[0.9, 0.24, 0.05]} color="#b9c9df" position={[0, -0.04, -1.1]} />
      {[-0.4, 0.4].map((x) => [-0.9, 0.9].map((z) => (
        <CelBox key={`${x}${z}`} size={[0.05, 0.2, 0.05]} color="#6d82a3" position={[x, -0.38, z]} outline={0.06} />
      )))}
      <CelBox size={[0.86, 0.12, 2.16]} color="#f3f6ff" position={[0, 0.04, 0]} />
      <CelBox size={[0.55, 0.07, 0.35]} color="#71b4e8" position={[0, 0.14, 0.88]} />
      <CelBox size={[0.03, 0.18, 1.3]} color="#b9c9df" position={[0.46, 0.2, 0.05]} />
      <CelBox size={[0.03, 0.18, 1.3]} color="#b9c9df" position={[-0.46, 0.2, 0.05]} />
    </group>
  );
}

export function IVStand() {
  return <Prop src="/assets/props/iv_pole.png" height={1.5} position={[-0.85, 0, 1.25]} />;
}

export function Room() {
  const floor = useTexture('/assets/props/floor_tile.png');
  pixelTex(floor, [5, 4]);
  const band = useTexture('/assets/props/wall_window.png');
  pixelTex(band, [3, 1]);
  const bandH = 10 / 3 / ((band.image as any)?.width / (band.image as any)?.height || 2.68);
  return (
    <group>
      {/* Tiled floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshBasicMaterial map={floor} toneMapped={false} />
      </mesh>
      {/* Back wall: plain upper wall, window band, mint stripe, navy skirting */}
      <mesh position={[0, 1.6, -3.99]}><planeGeometry args={[10, 3.2]} /><meshBasicMaterial color="#eef4ff" toneMapped={false} /></mesh>
      <mesh position={[0, 1.55, -3.98]}><planeGeometry args={[10, bandH]} /><meshBasicMaterial map={band} toneMapped={false} /></mesh>
      <mesh position={[0, 0.72, -3.97]}><planeGeometry args={[10, 0.1]} /><meshBasicMaterial color="#93dbda" toneMapped={false} /></mesh>
      <mesh position={[0, 0.06, -3.97]}><planeGeometry args={[10, 0.12]} /><meshBasicMaterial color="#254671" toneMapped={false} /></mesh>
      {/* Left wall */}
      <mesh position={[-4.99, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[8, 3.2]} /><meshBasicMaterial color="#e3ecf8" toneMapped={false} /></mesh>
      <mesh position={[-4.98, 0.72, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[8, 0.1]} /><meshBasicMaterial color="#93dbda" toneMapped={false} /></mesh>
      <mesh position={[-4.98, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[8, 0.12]} /><meshBasicMaterial color="#254671" toneMapped={false} /></mesh>

      {/* Equipment from the tileset */}
      <Prop src="/assets/props/crash_cart.png" height={1.0} position={[1.55, 0, -1.2]} />
      <Prop src="/assets/props/supply_cart.png" height={1.0} position={[-1.7, 0, 1.3]} />
      <Prop src="/assets/props/bin_biohazard.png" height={0.55} position={[2.3, 0, -2.4]} />
      <Prop src="/assets/props/bin_recycle.png" height={0.55} position={[2.75, 0, -2.4]} />
      <Prop src="/assets/props/sanitizer.png" height={0.5} position={[-2.2, 0.9, -3.8]} />
      <Prop src="/assets/props/chairs_blue.png" height={0.9} position={[3.2, 0, 0.8]} />
      <Prop src="/assets/props/water_cooler.png" height={1.3} position={[-3.6, 0, -3.4]} />
      <Prop src="/assets/props/bedside_table.png" height={0.75} position={[0.9, 0, 1.45]} />
    </group>
  );
}
