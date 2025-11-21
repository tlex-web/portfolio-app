import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PhotosPageClient from '@/components/PhotosPageClient';
import { landscapes } from '@/data/landscapes';

export default function PhotosPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section - Static Server Component */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6">Landscape Gallery</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              A collection of {landscapes.length} stunning landscape photographs from the Swiss Alps, each with interactive hotspots,
              technical details, and the stories behind the shots.
            </p>

            {/* Transitions Link */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
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
          </div>
        </div>

        {/* Client-side interactive components */}
        <PhotosPageClient images={landscapes} />
      </div>

      <Footer />
    </>
  );
}
