'use client';

import { Texture, Vector3 } from 'three';
import { terrain } from '@/data/generated/terrain';
import { tokens } from '@/data/generated/tokens';

/**
 * The terrain shader (HOME-02; D-17, correction C1; 09-UI-SPEC "Night-tinted
 * relief"; 09-RESEARCH Pattern 7). It redraws the CSS poster's layers 1-3:
 *
 *   ground   = mix(surface, hillshade texel, reliefOpacity), the composite the
 *              browser itself computes for the poster's opacity-0.32 <img> over
 *              bg-surface (correction C1);
 *   contours = firn-50 at the contour alphas (index every indexEvery-th
 *              interval, minor lines at 60 %), 1 CSS px wide at any zoom,
 *              anti-aliased from fwidth.
 *
 * Contours come from the unscaled height (vH = position.y before the relief
 * scale), so they exist on the flat p = 0 plane and the plan view matches the
 * poster's contour SVG. Lines fade out where an interval spans too few pixels
 * to keep them apart (steep faces seen obliquely).
 *
 * Colour handling (the poster parity depends on it): this is a ShaderMaterial
 * with no colorspace or tonemapping chunk, used with toneMapped false on a
 * `flat` canvas, and the hillshade texture has NoColorSpace. Every value here is
 * therefore an sRGB-encoded number written straight to the framebuffer, the way
 * CSS composites. The colours are Vector3s of the generated sRGB floats, never
 * THREE.Color (which would linearise them). All values come from
 * data/generated/tokens.ts and data/generated/terrain.ts; no literal colour.
 */

export const terrainVertexShader = /* glsl */ `
uniform float uRelief;
uniform float uExaggeration;
varying float vH;
varying vec2 vUv;

void main() {
  vH = position.y;
  vUv = uv;
  vec3 p = position;
  p.y *= uRelief * uExaggeration;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const terrainFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uHill;
uniform vec3 uSurface;
uniform vec3 uLine;
uniform float uReliefOpacity;
uniform float uInterval;
uniform float uIndexEvery;
uniform float uWidthPx;
uniform float uIndexAlpha;
uniform float uMinorAlpha;
uniform float uRelief;

varying float vH;
varying vec2 vUv;

// Coverage of the line at every integer of f: uWidthPx device pixels wide,
// anti-aliased over one pixel, faded out once neighbouring lines would merge.
float lineCov(float f) {
  float w = fwidth(f);
  float d = abs(fract(f - 0.5) - 0.5) / max(w, 1e-6);
  float cov = clamp(uWidthPx * 0.5 + 0.5 - d, 0.0, 1.0);
  return cov * (1.0 - smoothstep(0.25, 0.6, w));
}

void main() {
  vec3 ground = mix(uSurface, vec3(texture2D(uHill, vUv).r), uReliefOpacity);
  float minor = lineCov(vH / uInterval) * uMinorAlpha;
  float index = lineCov(vH / (uInterval * uIndexEvery)) * uIndexAlpha;
  gl_FragColor = vec4(mix(ground, uLine, max(minor, index)), 1.0);
}
`;

const vec3 = (rgb: readonly [number, number, number]) => new Vector3(rgb[0], rgb[1], rgb[2]);

/** The uniforms of one terrain material: `hill` is the hillshade texture, `dpr` the renderer pixel ratio. */
export function createTerrainUniforms({ hill, dpr }: { hill: Texture; dpr: number }) {
  return {
    uHill: { value: hill },
    uSurface: { value: vec3(tokens.srgb.night950) },
    uLine: { value: vec3(tokens.srgb.firn50) },
    uReliefOpacity: { value: tokens.reliefOpacity },
    uInterval: { value: terrain.contours.hero.intervalM },
    uIndexEvery: { value: terrain.contours.hero.indexEvery },
    /** 1 CSS px in device pixels, like the poster SVG's non-scaling 1 px stroke. */
    uWidthPx: { value: dpr },
    uIndexAlpha: { value: tokens.contourAlpha },
    uMinorAlpha: { value: tokens.contourMinorAlpha },
    /** Relief scale: 0 = the flat plan view of the poster (p = 0); 09-10 raises it. */
    uRelief: { value: 0 },
    uExaggeration: { value: 1 },
  };
}

export type TerrainUniforms = ReturnType<typeof createTerrainUniforms>;
