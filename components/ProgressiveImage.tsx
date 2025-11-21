'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  thumbnailSrc?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  priority?: boolean;
}

export default function ProgressiveImage({
  src,
  alt,
  thumbnailSrc,
  className = '',
  fill = false,
  sizes,
  quality = 85,
  priority = false,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // If priority, load immediately
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // Stop observing once in view
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Skeleton/Placeholder - shown before image loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {/* Blur thumbnail - loads first if provided */}
      {thumbnailSrc && !isLoaded && isInView && (
        <div className="absolute inset-0 blur-sm scale-105 opacity-50">
          <Image
            src={thumbnailSrc}
            alt={alt}
            fill={fill}
            className="object-cover"
            quality={10}
          />
        </div>
      )}

      {/* Full quality image - loads when in view */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          className={`object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes={sizes}
          quality={quality}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}
