'use client';

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { decode } from 'fast-png';
import {
  Box3,
  NoColorSpace,
  PlaneGeometry,
  ShaderMaterial,
  Sphere,
  Texture,
  TextureLoader,
} from 'three';
import { useAscent } from '@/components/home/AscentController';
import { terrain } from '@/data/generated/terrain';
import { RELIEF_EXAGGERATION } from '@/lib/ascent/route';
import { planeSize, toMetres, validateHeightmap, vertexUv } from '@/lib/terrain/heightmap';
import { downgradeAscent } from '@/lib/useAscentMode';
import {
  createTerrainUniforms,
  terrainFragmentShader,
  terrainVertexShader,
} from './terrain-shader';

/**
 * The real terrain (HOME-02; D-16, D-17, D-18; 09-RESEARCH Patterns 6 and 9;
 * 09-UI-SPEC "Stage: Poster, Sheet Box and Canvas").
 *
 * Loads the gridSize² heightmap (256 on stages narrower than 768 px, else 512)
 * from the content-hashed same-origin URL in data/generated/terrain.ts,
 * decodes it on the main thread with fast-png (no Worker, so no CSP
 * exception), validates it (T-09-12) and builds a pixel-centre-registered
 * plane: side W (N - 1) / N with N - 1 segments, row 0 (north) at -z, the
 * metres in position.y (the shader scales them by uRelief, 0 at p = 0) and uv
 * overridden to the pixel centres, so the mesh, the hillshade and the poster's
 * contour SVG line up. The loop yields between fetch, decode and build to keep
 * input responsive (T-09-13).
 *
 * The hillshade texture is the poster's own decoded <img data-poster-img> (no
 * second download, the same texels), with the 1100 px WebP as a fallback. The
 * img is never disposed; the GPU texture made from it is.
 *
 * Reveal: on the first frame that draws the mesh, a requestAnimationFrame
 * callback (the frame is on screen by then) calls markRevealed(), so the stage
 * reads '3d' and the canvas fades in over the poster, and leaves the
 * performance mark 'ascent-canvas-ready' with the progress it revealed at.
 *
 * Any failure (fetch, decode, format, texture) turns Home static for the rest
 * of the page view through downgradeAscent('load-error'). An unmount (a
 * downgrade, reduced motion turned on, leaving the page) aborts the load: the
 * fetch is cancelled, every later step checks the signal before it touches
 * state, the AbortError is swallowed (no log, no downgrade), a pending reveal
 * frame is cancelled (markRevealed is never called), and every GPU resource
 * made so far is disposed: geometry, material and texture in the cleanup, and a
 * texture that finishes after the cleanup on the spot.
 *
 * Frustum culling stays on with a bounding sphere that covers every relief
 * from 0 (flat) up to RELIEF_EXAGGERATION (the largest uRelief x
 * uExaggeration the camera rig sets, 09-10).
 *
 * `shaderRef` receives the live material (null after the cleanup), so the
 * camera rig can drive uRelief and uExaggeration along the route (09-10).
 */

const W = terrain.extent.widthM;

/** Lets the browser handle input between the heavy steps (INP). */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** The registered terrain plane for an N x N grid of metres. */
function buildGeometry(metres: Float32Array, n: number): PlaneGeometry {
  const side = planeSize(n, W);
  const geometry = new PlaneGeometry(side, side, n - 1, n - 1);
  geometry.rotateX(-Math.PI / 2); // plane row 0 (north) -> -z
  geometry.deleteAttribute('normal'); // the hillshade texture is the lighting
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let iy = 0, k = 0; iy < n; iy++) {
    for (let ix = 0; ix < n; ix++, k++) {
      position.setY(k, metres[k]);
      const [u, v] = vertexUv(ix, iy, n);
      uv.setXY(k, u, v);
    }
  }
  // Bounds for every relief between 0 (the flat plan view) and RELIEF_EXAGGERATION.
  geometry.computeBoundingBox();
  const box = (geometry.boundingBox as Box3).clone();
  const maxScale = Math.max(1, RELIEF_EXAGGERATION);
  box.min.y = Math.min(0, box.min.y * maxScale);
  box.max.y = Math.max(0, box.max.y * maxScale);
  geometry.boundingSphere = box.getBoundingSphere(new Sphere());
  return geometry;
}

/**
 * The poster's hillshade as a detached image. three sizes texture storage from
 * `image.width` (getMipLevels, texStorage2D), and a rendered <img> reports its
 * layout width there (1430 px for a 1100 px file at 1440 px), which would leave
 * the texels in one corner of a larger, black texture. A detached copy of the
 * same URL reports its intrinsic size; the browser serves it from the image
 * already loaded for the poster, so nothing is downloaded twice.
 */
async function posterImage(stage: HTMLElement | null): Promise<HTMLImageElement | null> {
  const img = stage?.querySelector<HTMLImageElement>('img[data-poster-img]');
  if (!img) return null;
  try {
    await img.decode();
    const src = img.currentSrc || img.src;
    if (!(img.naturalWidth > 0) || !src) return null;
    const copy = new Image();
    copy.src = src;
    await copy.decode();
    return copy;
  } catch {
    return null; // a broken poster image: use the fallback
  }
}

/** The poster's hillshade as a texture, or the 1100 px WebP when the poster image is unusable. */
async function loadHillshade(stage: HTMLElement | null): Promise<Texture> {
  const img = await posterImage(stage);
  let texture: Texture | null = img ? new Texture(img) : null;
  texture ??= await new TextureLoader().loadAsync(terrain.assets.hillshade.webp['1100']);
  texture.colorSpace = NoColorSpace; // texels are sRGB-encoded values, used as they are
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export default function TerrainMesh({
  gridSize,
  onMetres,
  shaderRef,
}: {
  gridSize: 256 | 512;
  /** Receives the decoded metres (gridSize² values, row 0 north) for anchoring things on the mesh. */
  onMetres?: (metres: Float32Array) => void;
  /** Receives the live terrain material (null once disposed), for the relief uniforms. */
  shaderRef?: RefObject<ShaderMaterial | null>;
}) {
  const { stageRef, markRevealed, progress } = useAscent();
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const dpr = useThree((s) => s.viewport.dpr);
  const [built, setBuilt] = useState<{ geometry: PlaneGeometry; material: ShaderMaterial } | null>(
    null
  );
  const revealFrame = useRef<number | null>(null);
  /** The live material, for uniform updates from effects (state values are not mutated). */
  const materialRef = useRef<ShaderMaterial | null>(null);
  /** The renderer pixel ratio the material should use when it is created. */
  const dprRef = useRef(dpr);

  const deliverMetres = useEffectEvent((metres: Float32Array) => onMetres?.(metres));
  const shareMaterial = useEffectEvent((live: ShaderMaterial | null) => {
    if (shaderRef) shaderRef.current = live;
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let geometry: PlaneGeometry | null = null;
    let material: ShaderMaterial | null = null;
    let texture: Texture | null = null;

    (async () => {
      const response = await fetch(terrain.assets.heightmap[gridSize], { signal });
      if (!response.ok) throw new Error(`heightmap: HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      await yieldToMain();
      if (signal.aborted) return;

      const png = decode(new Uint8Array(buffer));
      validateHeightmap(png, gridSize);
      const metres = toMetres(png.data, terrain.dem.heightScale);
      await yieldToMain();
      if (signal.aborted) return;

      geometry = buildGeometry(metres, gridSize);
      const hill = await loadHillshade(stageRef.current);
      if (signal.aborted) {
        hill.dispose(); // the cleanup already ran and could not see it
        return;
      }
      texture = hill;
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());

      material = new ShaderMaterial({
        uniforms: createTerrainUniforms({ hill: texture, dpr: dprRef.current }),
        vertexShader: terrainVertexShader,
        fragmentShader: terrainFragmentShader,
        toneMapped: false,
      });
      materialRef.current = material;
      shareMaterial(material);
      deliverMetres(metres);
      setBuilt({ geometry, material });
      invalidate();
    })().catch(() => {
      if (!signal.aborted) downgradeAscent('load-error');
    });

    return () => {
      controller.abort();
      if (revealFrame.current !== null) cancelAnimationFrame(revealFrame.current);
      revealFrame.current = null;
      materialRef.current = null;
      shareMaterial(null);
      geometry?.dispose();
      material?.dispose();
      // A uniform texture is not freed by material.dispose() (A4); the poster img stays.
      texture?.dispose();
    };
  }, [gridSize, gl, invalidate, stageRef]);

  // Contour lines stay 1 CSS px wide when the pixel ratio changes (zoom, another screen).
  useEffect(() => {
    dprRef.current = dpr;
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uWidthPx.value = dpr;
    invalidate();
  }, [dpr, invalidate]);

  useFrame(() => {
    if (!built || revealFrame.current !== null) return;
    // This frame draws the mesh; it is on screen when the next animation frame starts.
    revealFrame.current = requestAnimationFrame(() => {
      markRevealed();
      performance.mark('ascent-canvas-ready', { detail: { p: progress.get(), gridSize } });
    });
  });

  if (!built) return null;
  return <mesh geometry={built.geometry} material={built.material} frustumCulled />;
}
