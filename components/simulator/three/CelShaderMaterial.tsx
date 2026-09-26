"use client";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, ReactThreeFiber } from "@react-three/fiber";
import { MASTER_PALETTE } from "@/lib/palettes";

/**
 * Cel shader that quantizes to the SAME 32-colour master palette as the 2D
 * sprites, so the 3D suite and the Pixi ward read as one universe.
 *
 *  - 3 hard light bands (no smooth falloff)
 *  - Palette LUT snap on the final colour (nearest of 32 swatches)
 *  - Optional rim glow for interactive hotspots (also palette-snapped)
 *  - Pair with <OutlineHull/> for thick ink outlines.
 */
const paletteVec = MASTER_PALETTE.map((h) => new THREE.Color(h));

export const CelShaderMaterial = shaderMaterial(
  {
    color: new THREE.Color("#f1c27d"),
    rimColor: new THREE.Color("#73eff7"),
    rimIntensity: 0.0,
    lightDirection: new THREE.Vector3(1, 1.4, 1).normalize(),
    palette: paletteVec,
    paletteSize: paletteVec.length,
  },
  /* vertex */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* fragment */ `
    uniform vec3 color;
    uniform vec3 rimColor;
    uniform float rimIntensity;
    uniform vec3 lightDirection;
    uniform vec3 palette[48];
    uniform int paletteSize;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    vec3 snapToPalette(vec3 c) {
      vec3 best = palette[0];
      float bestD = 1e9;
      for (int i = 0; i < 48; i++) {
        if (i >= paletteSize) break;
        vec3 d = c - palette[i];
        float dist = dot(d, d);
        if (dist < bestD) { bestD = dist; best = palette[i]; }
      }
      return best;
    }

    void main() {
      float NdotL = dot(normalize(vNormal), normalize(lightDirection));
      float band = NdotL > 0.55 ? 1.0 : (NdotL > 0.05 ? 0.72 : 0.45);
      vec3 shaded = color * band;
      // Warm the shadow band slightly (mirrors the hue-shifted 2D ramps)
      if (band < 0.5) shaded = mix(shaded, shaded * vec3(1.08, 0.9, 0.85), 0.5);

      if (rimIntensity > 0.0) {
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - max(dot(viewDir, normalize(vNormal)), 0.0);
        float rimStep = rim > 0.72 ? 1.0 : 0.0; // hard-edged rim, no smoothstep
        shaded = mix(shaded, rimColor, rimStep * rimIntensity);
      }

      gl_FragColor = vec4(snapToPalette(shaded), 1.0);
    }
  `
);

extend({ CelShaderMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      celShaderMaterial: ReactThreeFiber.Object3DNode<any, any> & {
        color?: THREE.Color | string;
        rimColor?: THREE.Color | string;
        rimIntensity?: number;
      };
    }
  }
}

/** Inverted-hull ink outline. Wrap any mesh geometry: renders back faces scaled out in ink colour. */
export function OutlineHull({ geometry, thickness = 0.035, color = "#0d0b14", ...rest }: {
  geometry: THREE.BufferGeometry; thickness?: number; color?: string;
} & JSX.IntrinsicElements["mesh"]) {
  return (
    <mesh geometry={geometry} scale={1 + thickness} {...rest}>
      <meshBasicMaterial color={color} side={THREE.BackSide} />
    </mesh>
  );
}
