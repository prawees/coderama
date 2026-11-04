"use client";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, ReactThreeFiber } from "@react-three/fiber";

/** Three hard light bands, warm in the shadow, so the room reads like the clinic's pixel art. */
export const CelShaderMaterial = shaderMaterial(
  { color: new THREE.Color("#f1c27d"), lightDirection: new THREE.Vector3(1, 1.6, 1).normalize() },
  `varying vec3 vNormal;
   void main() {
     vNormal = normalize(normalMatrix * normal);
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform vec3 color;
   uniform vec3 lightDirection;
   varying vec3 vNormal;
   void main() {
     float l = dot(normalize(vNormal), normalize(lightDirection));
     float band = l > 0.45 ? 1.0 : (l > -0.05 ? 0.82 : 0.62);
     vec3 c = color * band;
     if (band < 0.7) c *= vec3(1.04, 0.92, 0.9);
     gl_FragColor = vec4(c, 1.0);
   }`
);
extend({ CelShaderMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      celShaderMaterial: ReactThreeFiber.Object3DNode<any, any> & { color?: THREE.Color | string };
    }
  }
}

export const INK = "#3a2a2f";

/** A box with a dark outline, the building block of the room. */
export function Box({ size, color, position, rotation, outline = 0.025 }: {
  size: [number, number, number]; color: string; position?: [number, number, number]; rotation?: [number, number, number]; outline?: number;
}) {
  const hull: [number, number, number] = [size[0] + outline * 2, size[1] + outline * 2, size[2] + outline * 2];
  return (
    <group position={position} rotation={rotation}>
      {outline > 0 && <mesh><boxGeometry args={hull} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>}
      <mesh><boxGeometry args={size} /><celShaderMaterial color={new THREE.Color(color)} /></mesh>
    </group>
  );
}
