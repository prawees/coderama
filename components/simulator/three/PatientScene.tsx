"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Room, Bed, IVStand } from "./RoomProps";
import { Patient, HotspotId } from "./Patient";
import { Monitor, LiveVitals } from "./Monitor";

export interface PatientSceneProps {
  vitalsRef: React.MutableRefObject<LiveVitals>;
  pendingRef: React.MutableRefObject<boolean>;
  elapsedRef: React.MutableRefObject<number>;
  joltRef: React.MutableRefObject<number>;
  breathingRateRef: React.MutableRefObject<number>;
  appearance?: { skinTone?: string; bmiFactor?: number; ageGroup?: string };
  examined: HotspotId[];
  onHotspot: (id: HotspotId) => void;
  pendingLabel: string;
}

export function PatientScene(p: PatientSceneProps) {
  const pulseRef = useRef(0);
  useFrame((_, dt) => { pulseRef.current += dt * 2.5; p.elapsedRef.current += dt; });

  return (
    <group>
      {/* Camera is LOCKED to a bedside arc: no pan, no zoom-through, no clipping under the floor. */}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minDistance={2.2}
        maxDistance={4.2}
        minPolarAngle={0.45}
        maxPolarAngle={1.25}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
        target={[0, 0.55, 0.2]}
      />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, -3]} intensity={0.6} />

      <Room />
      <Bed />
      <Patient
        pulseRef={pulseRef}
        joltRef={p.joltRef}
        breathingRateRef={p.breathingRateRef}
        appearance={p.appearance}
        examined={p.examined}
        onHotspot={p.onHotspot}
      />
      <IVStand />
      <Monitor vitalsRef={p.vitalsRef} pendingRef={p.pendingRef} elapsedRef={p.elapsedRef} pendingLabel={p.pendingLabel} />
    </group>
  );
}
