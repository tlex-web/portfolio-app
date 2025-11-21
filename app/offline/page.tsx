'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function OfflinePage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <svg
              className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            You&apos;re Offline
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            It looks like you&apos;ve lost your internet connection. Some content may not be available right now.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Good news!</strong> This site uses service workers to cache content. 
              Pages and images you&apos;ve visited before should still be available.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Try Again
            </button>
            
            <Link
              href="/"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold border-2 border-gray-300 dark:border-gray-600"
            >
              Go to Homepage
            </Link>
          </div>

          <div className="mt-12 text-sm text-gray-500 dark:text-gray-500">
            <p>Cached pages you can try to access:</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/photos" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
