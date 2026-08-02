import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export const CelShaderMaterial = shaderMaterial(
  {
    color: new THREE.Color('#ffffff'),
    rimColor: new THREE.Color('#00ffff'), // Cyan / Neon
    rimIntensity: 0.0, // 0 to 1 for glowing effect
    lightDirection: new THREE.Vector3(1, 1, 1).normalize(),
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 color;
    uniform vec3 rimColor;
    uniform float rimIntensity;
    uniform vec3 lightDirection;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // Basic lighting using dot product
      float NdotL = dot(vNormal, lightDirection);
      
      // Step function for Cel-Shading (Toon look)
      float lightIntensity;
      if (NdotL > 0.5) {
        lightIntensity = 1.0;
      } else if (NdotL > 0.1) {
        lightIntensity = 0.5;
      } else {
        lightIntensity = 0.2;
      }

      vec3 finalColor = color * lightIntensity;

      // Rim lighting for glowing interactive elements
      if (rimIntensity > 0.0) {
        vec3 viewDir = normalize(vViewPosition);
        float rimFactor = 1.0 - max(dot(viewDir, vNormal), 0.0);
        float rimAmount = smoothstep(0.6, 1.0, rimFactor);
        finalColor += rimColor * rimAmount * rimIntensity;
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ CelShaderMaterial });
