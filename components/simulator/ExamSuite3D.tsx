"use client";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import "./three/CelShaderMaterial";
import { PatientScene, PatientSceneProps } from "./three/PatientScene";

/**
 * The 3D Examination Suite viewport (top 60% of the case screen).
 * Rendered at half device resolution with nearest upscaling so the cel-shaded
 * scene keeps a chunky, pixel-consistent edge next to the 2D UI.
 */
export default function ExamSuite3D(props: PatientSceneProps) {
  return (
    <Canvas
      dpr={[0.75, 1]}
      camera={{ position: [2.4, 1.6, 2.6], fov: 42, near: 0.1, far: 30 }}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      style={{ imageRendering: "pixelated" }}
      onCreated={({ gl }) => { gl.setClearColor(new THREE.Color("#1a1c2c")); }}
    >
      <Suspense fallback={null}>
        <PatientScene {...props} />
      </Suspense>
    </Canvas>
  );
}
