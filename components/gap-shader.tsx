"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * L5b — the ink-bleed at the seam.
 *
 * Replaces ONLY the L5a crossfade element. Everything else about The Gap is
 * unchanged, so if this never loads the section still works exactly as gated
 * in L5a (INV-6).
 *
 * The effect: crimson soaking into paper fibre. Value noise warps a radial
 * field, and `progress` pushes the bleed outward from the seam. No postprocessing,
 * one plane, one material — this is atmosphere, not a render pipeline.
 */

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uTime;
  uniform vec3  uInk;
  uniform vec3  uPaper;

  // value noise — cheap, and the grain reads as fibre rather than as smoke
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 c = uv - 0.5;
    c.x *= 2.6;                                  // seam is wide and shallow

    // fibre warps the edge so the bleed creeps along the paper grain
    float grain = fbm(uv * 7.0 + vec2(uTime * 0.02, 0.0));
    float d = length(c) - grain * 0.16;

    // progress drives the wet front outward from the seam
    float front = mix(0.02, 0.78, uProgress);
    // a long falloff keeps this a wash soaking outward, not an opaque lozenge
    float ink = smoothstep(front, front - 0.62, d);
    ink *= uProgress;                            // nothing before the words meet

    // Peak, then recede: the ink settles into the fibre as the wordmark
    // resolves. Held at full it sat as a dark blot over the middle of CTLYST.
    float settle = 1.0 - smoothstep(0.55, 1.0, uProgress) * 0.72;

    vec3 col = mix(uPaper, uInk, ink);
    gl_FragColor = vec4(col, ink * 0.42 * settle);
  }
`;

function Bleed({ progress }: { progress: React.RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  // With an orthographic camera r3f's frustum is measured in pixels, so a
  // planeGeometry(2,2) renders as a literal 2px quad and the bleed is invisible.
  // viewport gives the world-unit size that actually fills the canvas.
  const { viewport } = useThree();
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uInk: { value: new THREE.Color("#7B2D26") },
      uPaper: { value: new THREE.Color("#FDFCF9") },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += delta;
    mat.current.uniforms.uProgress.value = progress.current ?? 0;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        args={[{ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true }]}
      />
    </mesh>
  );
}

export default function GapShader({ progress }: { progress: React.RefObject<number> }) {
  return (
    <Canvas
      className="pointer-events-none"
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Bleed progress={progress} />
    </Canvas>
  );
}
