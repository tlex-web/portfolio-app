'use client';

/**
 * GeologicalButton — interactive button/anchor with geological click effects.
 *
 * Replaces ParticleButton for production components. Uses Framer Motion
 * declarative animations (AnimatePresence) instead of manual RAF loops.
 * Effects are subtle, weighty, and deliberate — crystal fracture lines,
 * mineral dust settling, or tectonic ripples.
 */

import { useRef, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASING, DURATION } from '@/lib/animations';
import { useReducedMotion } from '@/lib/useReducedMotion';

type GeologicalEffect = 'fracture' | 'dust' | 'ripple';

interface EffectElement {
  id: number;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  type: GeologicalEffect;
  delay: number;
}

interface GeologicalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  effect?: GeologicalEffect;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
}

let effectIdCounter = 0;

export default function GeologicalButton({
  children,
  onClick,
  effect = 'fracture',
  className = '',
  disabled = false,
  type = 'button',
  href,
}: GeologicalButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [effects, setEffects] = useState<EffectElement[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const generateFractureElements = useCallback((cx: number, cy: number): EffectElement[] => {
    const count = 4 + Math.floor(Math.random() * 3); // 4-6 lines
    const elements: EffectElement[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (Math.random() - 0.5) * 30;
      elements.push({
        id: effectIdCounter++,
        x: cx,
        y: cy,
        rotation: angle,
        width: 2,
        height: 15 + Math.random() * 15, // 15-30px
        type: 'fracture',
        delay: i * 0.02,
      });
    }
    return elements;
  }, []);

  const generateDustElements = useCallback((cx: number, cy: number): EffectElement[] => {
    const count = 6 + Math.floor(Math.random() * 3); // 6-8 squares
    const elements: EffectElement[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (Math.random() - 0.5) * 40;
      const size = 3 + Math.random() * 2; // 3-5px
      elements.push({
        id: effectIdCounter++,
        x: cx,
        y: cy,
        rotation: angle,
        width: size,
        height: size,
        type: 'dust',
        delay: i * 0.03,
      });
    }
    return elements;
  }, []);

  const generateRippleElements = useCallback((cx: number, cy: number): EffectElement[] => {
    const count = 2;
    const elements: EffectElement[] = [];
    for (let i = 0; i < count; i++) {
      elements.push({
        id: effectIdCounter++,
        x: cx,
        y: cy,
        rotation: 0,
        width: 40,
        height: 40,
        type: 'ripple',
        delay: i * 0.1,
      });
    }
    return elements;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (!prefersReducedMotion && !disabled) {
        const element = href ? anchorRef.current : buttonRef.current;
        const rect = element?.getBoundingClientRect();
        if (rect) {
          const cx = e.clientX - rect.left;
          const cy = e.clientY - rect.top;

          let newElements: EffectElement[];
          switch (effect) {
            case 'dust':
              newElements = generateDustElements(cx, cy);
              break;
            case 'ripple':
              newElements = generateRippleElements(cx, cy);
              break;
            case 'fracture':
            default:
              newElements = generateFractureElements(cx, cy);
              break;
          }

          setEffects(newElements);

          const duration = effect === 'dust' ? 600 : effect === 'ripple' ? 500 : DURATION.fracture * 1000;
          setTimeout(() => setEffects([]), duration + 100);
        }
      }

      onClick?.();
    },
    [effect, prefersReducedMotion, disabled, href, onClick, generateFractureElements, generateDustElements, generateRippleElements]
  );

  const renderEffectElement = (el: EffectElement) => {
    switch (el.type) {
      case 'fracture': {
        const rad = (el.rotation * Math.PI) / 180;
        const endX = Math.cos(rad) * el.height;
        const endY = Math.sin(rad) * el.height;
        return (
          <motion.div
            key={el.id}
            initial={{
              x: el.x,
              y: el.y,
              scaleY: 0,
              opacity: 0.7,
            }}
            animate={{
              x: el.x + endX * 0.5,
              y: el.y + endY * 0.5,
              scaleY: 1,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: DURATION.fracture,
              delay: el.delay,
              ease: [...EASING.tectonic],
            }}
            style={{
              position: 'absolute',
              width: el.width,
              height: el.height,
              backgroundColor: 'var(--color-frost-500)',
              transformOrigin: '50% 0%',
              transform: `rotate(${el.rotation}deg)`,
              borderRadius: 1,
            }}
          />
        );
      }

      case 'dust': {
        const rad = (el.rotation * Math.PI) / 180;
        const scatterX = Math.cos(rad) * (20 + Math.random() * 10);
        const scatterY = Math.sin(rad) * (20 + Math.random() * 10);
        return (
          <motion.div
            key={el.id}
            initial={{
              x: el.x,
              y: el.y,
              opacity: 0.5,
              scale: 1,
            }}
            animate={{
              x: el.x + scatterX,
              y: el.y + scatterY + 15,
              opacity: 0,
              scale: 0.6,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              delay: el.delay,
              ease: [...EASING.erosion],
            }}
            style={{
              position: 'absolute',
              width: el.width,
              height: el.height,
              backgroundColor: 'var(--color-granite-400)',
              borderRadius: 1,
            }}
          />
        );
      }

      case 'ripple': {
        return (
          <motion.div
            key={el.id}
            initial={{
              x: el.x - el.width / 2,
              y: el.y - el.height / 2,
              scale: 0,
              opacity: 0.6,
            }}
            animate={{
              scale: 3,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              delay: el.delay,
              ease: [...EASING.geological],
            }}
            style={{
              position: 'absolute',
              width: el.width,
              height: el.height,
              border: '1px solid var(--color-frost-500)',
              borderRadius: '50%',
            }}
          />
        );
      }
    }
  };

  const effectOverlay = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {effects.map(renderEffectElement)}
      </AnimatePresence>
    </div>
  );

  const hoverGlow =
    isHovered && !disabled && !prefersReducedMotion ? (
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: [...EASING.erosion] }}
        style={{
          backgroundColor: 'var(--color-frost-500)',
        }}
      />
    ) : null;

  const sharedProps = {
    onClick: handleClick,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    className,
    style: { position: 'relative' as const, display: 'inline-block' as const, overflow: 'hidden' as const },
  };

  if (href) {
    return (
      <a ref={anchorRef} href={href} {...sharedProps}>
        <span className="relative z-10">{children}</span>
        {effectOverlay}
        {hoverGlow}
      </a>
    );
  }

  return (
    <button ref={buttonRef} type={type} disabled={disabled} {...sharedProps}>
      <span className="relative z-10">{children}</span>
      {effectOverlay}
      {hoverGlow}
    </button>
  );
}
