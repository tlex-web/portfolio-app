'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, MathUtils, type Group, type Texture } from 'three';
import SafeCanvas from '@/components/SafeCanvas';
import ContextLossGuard from '@/components/home/terrain/ContextLossGuard';
import { tokens } from '@/data/generated/tokens';
import type { PhotoView } from '@/lib/photos/view-model';
import { downgradeAscent } from '@/lib/useAscentMode';
import { useProgressiveTextures } from '@/lib/useProgressiveTextures';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** The ring the frames stand on, in scene units. */
const RADIUS = 8;
/** The largest photo plane: a 4 x 3 box every photo fits in at its own ratio. */
const BOX_W = 4;
const BOX_H = 3;
/** The mount around each photo, in scene units on each side. */
const MOUNT = 0.1;
/** Front-frame scale and lift towards the camera. */
const FRONT_SCALE = 1.25;
const FRONT_Z = 1;
/** Vertical field of view (degrees), and the share of the stage the front frame may fill. */
const FOV = 50;
const FIT_H = 0.72;
const FIT_W = 0.84;
/**
 * Exponential damping rate (1/s) for the rotation, scale and lift: about 95 %
 * settled after 3 / DAMP s, which is 250 ms (--duration-panel, UI-SPEC Motion).
 */
const DAMP = 12;
/** Idle float amplitude (scene units): the front frame more than the side frames. */
const FLOAT_FRONT = 0.1;
const FLOAT_SIDE = 0.04;

/**
 * Places the camera so the front frame fits the stage at any aspect ratio:
 * at most FIT_H of its height and FIT_W of its width (a phone's tall stage
 * moves the camera back). Runs in the frame loop, so a resize applies on the
 * next frame, in 'demand' mode too (R3F renders one on resize).
 */
function CameraFit() {
  useFrame(({ camera, size }) => {
    const tan = Math.tan(MathUtils.degToRad(FOV / 2));
    const aspect = size.width / Math.max(1, size.height);
    const byHeight = (BOX_H * FRONT_SCALE) / FIT_H / (2 * tan);
    const byWidth = (BOX_W * FRONT_SCALE) / FIT_W / (2 * tan * aspect);
    const distance = Math.max(byHeight, byWidth);
    camera.position.set(0, 0.6, RADIUS + FRONT_Z + distance);
    camera.lookAt(0, 0.15, RADIUS + FRONT_Z);
  });
  return null;
}

/** The plane size of a photo inside the BOX_W x BOX_H box, at its true ratio. */
function planeSize(aspect: { w: number; h: number }): [number, number] {
  const ratio = aspect.w / aspect.h;
  return ratio >= BOX_W / BOX_H ? [BOX_W, BOX_W / ratio] : [BOX_H * ratio, BOX_H];
}

type FrameProps = {
  photo: PhotoView;
  texture: Texture;
  index: number;
  angle: number;
  isFront: boolean;
  float: boolean;
  onPick: () => void;
};

/**
 * One photo on the ring: the photo plane (unlit, so it shows its own colours)
 * on a night-950 mount, turned to face the camera every frame (the legacy
 * ring faced inwards, so the front photo was its mirrored back). The front
 * frame scales up and lifts towards the camera; the float bobs the frame
 * while `float` is on.
 */
function Frame({ photo, texture, index, angle, isFront, float, onPick }: FrameProps) {
  const groupRef = useRef<Group>(null);
  const liftRef = useRef<Group>(null);
  const placed = useRef(false);
  const [w, h] = planeSize(photo.aspect);
  const x = Math.sin(angle) * RADIUS;
  const z = Math.cos(angle) * RADIUS;

  useFrame((state, delta) => {
    const lift = liftRef.current;
    if (lift) {
      // The first frame places the frame; later changes of the front photo ease.
      const scale = isFront ? FRONT_SCALE : 1;
      const liftZ = isFront ? FRONT_Z : 0;
      const ease = placed.current;
      placed.current = true;
      lift.scale.setScalar(ease ? MathUtils.damp(lift.scale.x, scale, DAMP, delta) : scale);
      lift.position.z = ease ? MathUtils.damp(lift.position.z, liftZ, DAMP, delta) : liftZ;
    }
    const group = groupRef.current;
    if (!group) return;
    // Every frame faces the camera, so no photo is ever seen from behind (mirrored).
    group.lookAt(state.camera.position);
    if (!float) return;
    const amount = isFront ? FLOAT_FRONT : FLOAT_SIDE;
    group.position.y = Math.sin(state.clock.getElapsedTime() * 0.4 + index * 0.5) * amount;
  });

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {/* Scale and lift are set in useFrame (props would snap them on every step). */}
      <group ref={liftRef}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            onPick();
          }}
        >
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial
            map={texture}
            toneMapped={false}
            transparent
            opacity={isFront ? 1 : 0.7}
            side={DoubleSide}
          />
        </mesh>
        {/* The mount sits just behind the photo (local -z, away from the camera). */}
        <mesh position-z={-0.02}>
          <planeGeometry args={[w + MOUNT * 2, h + MOUNT * 2]} />
          <meshStandardMaterial color={tokens.hex.night950} roughness={0.9} metalness={0} />
        </mesh>
      </group>
    </group>
  );
}

type RingProps = {
  photos: readonly PhotoView[];
  index: number;
  float: boolean;
  snap: boolean;
  onSelect: (i: number) => void;
  onOpen: (i: number) => void;
  onReady: () => void;
};

/** The ring of frames; it turns so the front photo faces the camera. */
function Ring({ photos, index, float, snap, onSelect, onOpen, onReady }: RingProps) {
  const ringRef = useRef<Group>(null);
  const placed = useRef(false);
  const angleStep = (Math.PI * 2) / photos.length;
  const sources = useMemo(
    () => photos.map((p) => ({ thumbSrc: p.tile.src, fullSrc: p.openerSrc })),
    [photos]
  );
  const { textures, allThumbsLoaded } = useProgressiveTextures(sources, index);

  useEffect(() => {
    if (allThumbsLoaded) onReady();
  }, [allThumbsLoaded, onReady]);

  useFrame((_state, delta) => {
    const ring = ringRef.current;
    if (!ring) return;
    const target = -index * angleStep;
    const ease = placed.current && !snap;
    placed.current = true;
    ring.rotation.y = ease ? MathUtils.damp(ring.rotation.y, target, DAMP, delta) : target;
  });

  if (!allThumbsLoaded) return null;

  return (
    // The rotation is set in useFrame, so a step eases instead of snapping.
    <group ref={ringRef}>
      {photos.map((photo, i) => (
        <Frame
          key={photo.slug}
          photo={photo}
          texture={textures[i]}
          index={i}
          angle={i * angleStep}
          isFront={i === index}
          float={float}
          onPick={() => (i === index ? onOpen(i) : onSelect(i))}
        />
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={-1.9}>
        <circleGeometry args={[RADIUS + 5, 64]} />
        <meshStandardMaterial color={tokens.hex.night950} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/**
 * The restyled 3D carousel (PHOTO-02, PHOTO-04; D-12; 10-UI-SPEC "Carousel
 * View", 3D column; 10-RESEARCH Pitfalls 7 and 8). Built from the legacy
 * components/PhotoCarousel3D.tsx (deleted in 10-09 with the v1 photo UI).
 *
 * - Loaded only through CarouselView's `dynamic(..., { ssr: false })` in the
 *   'eligible' branch, so three.js is never requested under the static gate.
 * - Renders through SafeCanvas (Phase 7 rule). A canvas that fails to start
 *   calls downgradeAscent('load-error') and a lost context (ContextLossGuard)
 *   downgradeAscent('context-lost'): the gate then reads 'static' and the
 *   flat stepper takes over, with no error copy.
 * - Colours come only from data/generated/tokens.ts: clear colour and fog
 *   night-900 (the frame box, bg-surface-raised), mounts and ground
 *   night-950, one neutral mist-300 light. No hex literal here.
 * - No drei Html: the title and the loading skeleton are DOM siblings of the
 *   canvas in CarouselView (Pitfall 8). No key listener at all: the region's
 *   onKeyDown and the DOM buttons drive `index` (Pitfall 7).
 * - Pointer: a click on the front frame calls onOpen, on a side frame onSelect.
 * - Motion: the ring turns and the front frame lifts over about 250 ms. The
 *   idle float runs only while `paused` is false and reduced motion is off;
 *   `paused` (offscreen or a hidden tab) also switches the frame loop to
 *   'demand', so nothing is drawn. Nothing advances `index` (PHOTO-04).
 * - Textures: the manifest 640 WebP thumbnails first, then the 1024 WebP by
 *   proximity to the front photo (useProgressiveTextures); onReady fires once
 *   every thumbnail is in.
 */
export default function PhotoCarousel3D({
  photos,
  index,
  onSelect,
  onOpen,
  paused,
  onReady,
}: {
  photos: readonly PhotoView[];
  index: number;
  onSelect: (i: number) => void;
  onOpen: (i: number) => void;
  paused: boolean;
  onReady: () => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <SafeCanvas
      aria-hidden
      onCanvasError={() => downgradeAscent('load-error')}
      frameloop={paused ? 'demand' : 'always'}
      camera={{ position: [0, 0.6, 16], fov: FOV }}
      dpr={[1, 1.5]}
      flat
      gl={{ alpha: false, antialias: true, stencil: false }}
      onCreated={({ gl }) => gl.setClearColor(tokens.hex.night900)}
      className="absolute inset-0"
    >
      <ContextLossGuard />
      <CameraFit />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 8]} intensity={1.2} color={tokens.hex.mist300} />
      <fog attach="fog" args={[tokens.hex.night900, 10, 30]} />
      <Ring
        photos={photos}
        index={index}
        float={!paused && !reducedMotion}
        snap={reducedMotion}
        onSelect={onSelect}
        onOpen={onOpen}
        onReady={onReady}
      />
    </SafeCanvas>
  );
}
