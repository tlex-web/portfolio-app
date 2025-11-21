'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableImage({ src, alt, className = '' }: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Calculate boundaries to prevent panning outside the image
  const xOutput = useTransform(x, (value) => {
    if (!isZoomed) return 0;
    const maxX = dimensions.width * 0.5;
    return Math.max(-maxX, Math.min(maxX, value));
  });
  
  const yOutput = useTransform(y, (value) => {
    if (!isZoomed) return 0;
    const maxY = dimensions.height * 0.5;
    return Math.max(-maxY, Math.min(maxY, value));
  });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  const handleDoubleClick = () => {
    if (isZoomed) {
      // Reset position when zooming out
      x.set(0);
      y.set(0);
    }
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate mouse position relative to center
    const mouseX = e.clientX - rect.left - centerX;
    const mouseY = e.clientY - rect.top - centerY;
    
    // Pan the image in the opposite direction (parallax effect)
    x.set(-mouseX * 0.5);
    y.set(-mouseY * 0.5);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isZoomed || !containerRef.current || e.touches.length !== 1) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left - centerX;
    const touchY = touch.clientY - rect.top - centerY;
    
    x.set(-touchX * 0.5);
    y.set(-touchY * 0.5);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-zoom-${isZoomed ? 'out' : 'in'} ${className}`}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      <motion.div
        animate={{
          scale: isZoomed ? 2 : 1,
        }}
        style={{
          x: xOutput,
          y: yOutput,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className="relative w-full h-full"
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="100vw"
          quality={95}
          draggable={false}
        />
      </motion.div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm pointer-events-none">
        {isZoomed ? (
          <>
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" />
            </svg>
            Double-click to zoom out
          </>
        ) : (
          <>
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
            </svg>
            Double-click to zoom in
          </>
        )}
      </div>
    </div>
  );
}

