"use client"

import { useRef } from "react";
import { useFrame, useLoader, extend } from "@react-three/fiber";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import * as THREE from "three";
import { CelShaderMaterial } from "./CelShaderMaterial";

extend({ CelShaderMaterial });

export function Patient({ 
  pulseRef, 
  appearance 
}: { 
  pulseRef: React.MutableRefObject<number>;
  appearance?: { skinTone?: string; bmiFactor?: number; ageGroup?: string };
}) {
  const blanketRef = useRef<THREE.Mesh>(null);
  const geom = useLoader(STLLoader, "/assets/standard_male_lowpoly.stl");
  const blanket = useLoader(STLLoader, "/assets/blanket_lowpoly.stl");

  useFrame(() => {
    if (blanketRef.current) {
      const breathe = Math.sin(pulseRef.current * 2) * 0.008;
      //blanketRef.current.position.y = 0.12 + breathe;
    }
  });

  return (
    <group position={[0, 0.4, 0]}>
      {/* STL patient model — lying on the bed */}
      <mesh
        geometry={geom}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        position={[0.1, 0, 0.3]}
        scale={[
          0.2 * (appearance?.bmiFactor || 1), // X (width/girth)
          0.2, // Y (depth when standing, actually height when lying down if rotation is applied. Wait, STL is rotated -PI/2 on X)
          0.2 * (appearance?.bmiFactor || 1)  // Z (thickness)
        ]}
        castShadow
      >
        {/* @ts-ignore */}
        <celShaderMaterial color={new THREE.Color(appearance?.skinTone || "#f5cba7")} rimIntensity={0.1} />
      </mesh>
      <mesh
        geometry={blanket}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        position={[0.1, 0.02, 0.3]}
        scale={[
          0.2 * (appearance?.bmiFactor || 1),
          0.2,
          0.2 * (appearance?.bmiFactor || 1)
        ]}
        castShadow
      >
        {/* @ts-ignore */}
        <celShaderMaterial color={new THREE.Color("#25b6ff")} rimIntensity={0.0} />
      </mesh>

      {/* Blanket over lower body */}

    </group>
  );
}
