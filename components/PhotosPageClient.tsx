'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import GalleryGrid from '@/components/GalleryGrid';
import ImageDetailModal from '@/components/ImageDetailModal';
import { LandscapeImage } from '@/data/types';

// Lazy load 3D carousel to reduce initial bundle size
const PhotoCarousel3D = dynamic(() => import('@/components/PhotoCarousel3D'), {
  loading: () => (
    <div className="bg-black rounded-2xl h-[600px] flex items-center justify-center">
      <div className="text-white animate-pulse">Loading 3D viewer...</div>
    </div>
  ),
  ssr: false, // Three.js doesn't work server-side
});

interface PhotosPageClientProps {
  images: LandscapeImage[];
}

export default function PhotosPageClient({ images }: PhotosPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | '3d'>('grid');
  const [selectedImage, setSelectedImage] = useState<LandscapeImage | null>(null);

  return (
    <>
      {/* View Mode Toggle */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid View
              </span>
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
                3D Carousel
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {viewMode === 'grid' ? (
          <GalleryGrid images={images} />
        ) : (
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
            <PhotoCarousel3D
              images={images}
              onImageClick={(image) => setSelectedImage(image)}
            />
          </div>
        )}
      </div>

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}
