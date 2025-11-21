'use client';

import { useRef, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  size: number;
  color: string;
  life: number;
}

export type ParticleEffect = 
  | 'explosion' 
  | 'magnetic' 
  | 'sparkle' 
  | 'confetti'
  | 'ripple'
  | 'trail';

interface ParticleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  effect?: ParticleEffect;
  particleCount?: number;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
}

export default function ParticleButton({
  children,
  onClick,
  effect = 'explosion',
  particleCount = 20,
  className = '',
  disabled = false,
  type = 'button',
  href,
}: ParticleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [trailParticles, setTrailParticles] = useState<Particle[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const particleIdRef = useRef(0);

  const colors = {
    explosion: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    magnetic: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
    sparkle: ['#FFD700', '#FFA500', '#FFFF00', '#FFE4B5'],
    confetti: ['#FF0080', '#00FF80', '#0080FF', '#FF8000', '#8000FF'],
    ripple: ['#00FFFF', '#0080FF', '#00BFFF'],
    trail: ['#FF1493', '#FF69B4', '#FFB6C1'],
  };

  const createParticles = useCallback((e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (prefersReducedMotion || disabled) return;

    const element = href ? anchorRef.current : buttonRef.current;
    const rect = element?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newParticles: Particle[] = [];
    const effectColors = colors[effect];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const velocity = effect === 'explosion' ? 2 + Math.random() * 3 : 1 + Math.random() * 2;
      
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        angle,
        velocity,
        size: effect === 'confetti' ? 4 + Math.random() * 4 : 2 + Math.random() * 3,
        color: effectColors[Math.floor(Math.random() * effectColors.length)],
        life: 1,
      });
    }

    setParticles(newParticles);

    // Animate particles
    const animationDuration = effect === 'ripple' ? 800 : 1000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / animationDuration;

      if (progress < 1) {
        setParticles((prev) =>
          prev.map((p) => {
            let newX = p.x;
            let newY = p.y;

            switch (effect) {
              case 'explosion':
                newX += Math.cos(p.angle) * p.velocity * 3;
                newY += Math.sin(p.angle) * p.velocity * 3 + progress * 2; // Gravity
                break;
              case 'magnetic':
                // Orbit around click point
                const orbitAngle = p.angle + progress * Math.PI * 4;
                const radius = 20 + progress * 40;
                newX = p.x + Math.cos(orbitAngle) * radius - p.x + x;
                newY = p.y + Math.sin(orbitAngle) * radius - p.y + y;
                break;
              case 'sparkle':
                newX += (Math.random() - 0.5) * 4;
                newY += (Math.random() - 0.5) * 4 - progress * 3;
                break;
              case 'confetti':
                newX += Math.cos(p.angle) * p.velocity * 2;
                newY += Math.sin(p.angle) * p.velocity * 2 + progress * 5; // Strong gravity
                break;
              case 'ripple':
                newX += Math.cos(p.angle) * progress * 80;
                newY += Math.sin(p.angle) * progress * 80;
                break;
              case 'trail':
                newX += Math.cos(p.angle) * p.velocity * 2;
                newY += Math.sin(p.angle) * p.velocity * 2;
                break;
            }

            return {
              ...p,
              x: newX,
              y: newY,
              life: 1 - progress,
            };
          })
        );
        requestAnimationFrame(animate);
      } else {
        setParticles([]);
      }
    };

    requestAnimationFrame(animate);
  }, [effect, particleCount, prefersReducedMotion, disabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (prefersReducedMotion || disabled || effect !== 'trail' || !isHovered) return;

    const element = href ? anchorRef.current : buttonRef.current;
    const rect = element?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTrailParticle: Particle = {
      id: particleIdRef.current++,
      x,
      y,
      angle: 0,
      velocity: 0,
      size: 3 + Math.random() * 2,
      color: colors.trail[Math.floor(Math.random() * colors.trail.length)],
      life: 1,
    };

    setTrailParticles((prev) => [...prev.slice(-10), newTrailParticle]);

    // Fade out trail particles
    setTimeout(() => {
      setTrailParticles((prev) => prev.filter((p) => p.id !== newTrailParticle.id));
    }, 500);
  }, [effect, isHovered, prefersReducedMotion, disabled]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    createParticles(e);
    onClick?.();
  };

  const Component = href ? 'a' : 'button';
  
  // Common props for both button and anchor
  const commonProps = {
    onClick: handleClick,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onMouseMove: handleMouseMove,
    className,
  };

  const props: any = href 
    ? { 
        ...commonProps,
        ref: anchorRef,
        href,
      }
    : { 
        ...commonProps,
        ref: buttonRef,
        type,
        disabled,
      };

  return (
    <Component {...props} style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      
      {/* Particle Container */}
      <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: -1 }}>
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.x,
                y: particle.y,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: particle.x,
                y: particle.y,
                scale: effect === 'ripple' ? 2 : effect === 'confetti' ? [1, 1.2, 0.8, 1] : 0.5,
                opacity: particle.life,
                rotate: effect === 'confetti' ? [0, 360] : 0,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: effect === 'ripple' ? 0.8 : 1,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: effect === 'confetti' ? '2px' : '50%',
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
            />
          ))}

          {/* Trail particles */}
          {effect === 'trail' && trailParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: particle.x, y: particle.y, opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: '50%',
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Hover Glow Effect */}
      {isHovered && !disabled && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            background: `radial-gradient(circle at center, ${colors[effect][0]}40, transparent)`,
            zIndex: -1,
          }}
        />
      )}
    </Component>
  );
}

