'use client';

import { useEffect, useState } from 'react';
import { LandscapeImage } from '@/data/types';
import Image from 'next/image';
import InteractiveHotspot from './InteractiveHotspot';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageDetailModalProps {
  image: LandscapeImage | null;
  onClose: () => void;
}

export default function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          onClose();
        }
      }
    };

    if (image) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [image, onClose, isZoomed]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-900 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image */}
        <div className="relative w-full h-96 md:h-[600px] bg-gray-900">
          <motion.div
            className="relative w-full h-full cursor-zoom-in"
            onClick={() => setIsZoomed(!isZoomed)}
            animate={{
              scale: isZoomed ? 1.5 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-contain"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
            />

            {/* Interactive Hotspots */}
            {!isZoomed && image.annotations && image.annotations.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative w-full h-full">
                  {image.annotations.map((annotation) => (
                    <div key={annotation.id} className="pointer-events-auto">
                      <InteractiveHotspot annotation={annotation} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Zoom Indicator */}
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm pointer-events-none">
            {isZoomed ? (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" />
                </svg>
                Click to zoom out
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                </svg>
                Click to zoom in
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6 md:p-8">
          <h2 id="modal-title" className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            {image.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{image.location}</p>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Story</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{image.story}</p>
          </div>

          {/* Technical Details */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Technical Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {image.technicalDetails.camera && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Camera</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {image.technicalDetails.camera}
                  </p>
                </div>
              )}
              {image.technicalDetails.lens && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Lens</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {image.technicalDetails.lens}
                  </p>
                </div>
              )}
              {image.technicalDetails.aperture && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Aperture</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {image.technicalDetails.aperture}
                  </p>
                </div>
              )}
              {image.technicalDetails.shutterSpeed && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Shutter Speed</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {image.technicalDetails.shutterSpeed}
                  </p>
                </div>
              )}
              {image.technicalDetails.iso && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">ISO</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {image.technicalDetails.iso}
                  </p>
                </div>
              )}
              {image.technicalDetails.captureDate && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(image.technicalDetails.captureDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {image.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

