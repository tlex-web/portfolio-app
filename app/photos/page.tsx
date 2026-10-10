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
          </div>
        </div>

        {/* Client-side interactive components */}
        <PhotosPageClient images={landscapes} />
      </div>

      <Footer />
    </>
  );
}
