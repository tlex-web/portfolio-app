'use client';

import { useState } from 'react';
import Link from 'next/link';
import GalleryGrid from '@/components/GalleryGrid';
import PhotoCarousel3D from '@/components/PhotoCarousel3D';
import ImageDetailModal from '@/components/ImageDetailModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { landscapes } from '@/data/landscapes';
import { LandscapeImage } from '@/data/types';

export default function PhotosPage() {
  const [viewMode, setViewMode] = useState<'grid' | '3d'>('grid');
  const [selectedImage, setSelectedImage] = useState<LandscapeImage | null>(null);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6">Landscape Gallery</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              A collection of {landscapes.length} stunning landscape photographs from the Swiss Alps, each with interactive hotspots,
              technical details, and the stories behind the shots.
            </p>

            {/* View Mode Toggle & Transitions Link */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <Link
                href="/transitions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all font-medium border-2 border-white/30"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                View Shader Transitions
              </Link>
            </div>

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
            <GalleryGrid images={landscapes} />
          ) : (
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
              <PhotoCarousel3D
                images={landscapes}
                onImageClick={(image) => setSelectedImage(image)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <Footer />
    </>
  );
}
