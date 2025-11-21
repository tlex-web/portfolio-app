'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RoadmapTimeline from '@/components/RoadmapTimeline';
import RoadmapFilters from '@/components/RoadmapFilters';
import RoadmapProgress from '@/components/RoadmapProgress';
import { roadmapItems } from '@/data/roadmap';
import { motion } from 'framer-motion';

export default function RoadmapPage() {
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter items based on selections
  const filteredItems = roadmapItems.filter((item) => {
    const areaMatch = selectedArea === 'all' || item.area === selectedArea;
    const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
    return areaMatch && statusMatch;
  });

  // Sort items: completed last, in-progress first, then planned
  const sortedItems = [...filteredItems].sort((a, b) => {
    const statusOrder = { 'in-progress': 0, 'planned': 1, 'completed': 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold mb-4">Project Roadmap</h1>
              <p className="text-xl text-purple-100 max-w-3xl mx-auto">
                Track the evolution of my portfolio, CLI_X tool, and website platform. See what's
                been accomplished and what's coming next.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Progress & Filters */}
            <div className="lg:col-span-1 space-y-8">
              {/* Progress Overview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <RoadmapProgress items={roadmapItems} />
              </motion.div>

              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 sticky top-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Filters
                </h2>
                <RoadmapFilters
                  selectedArea={selectedArea}
                  selectedStatus={selectedStatus}
                  onAreaChange={setSelectedArea}
                  onStatusChange={setSelectedStatus}
                />

                {/* Active Filters Summary */}
                {(selectedArea !== 'all' || selectedStatus !== 'all') && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Active Filters
                      </span>
                      <button
                        onClick={() => {
                          setSelectedArea('all');
                          setSelectedStatus('all');
                        }}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredItems.length} of {roadmapItems.length} items
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Main Content - Timeline */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {/* Results Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Roadmap Timeline
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {filteredItems.length === 0
                      ? 'No items match your filters'
                      : `Showing ${filteredItems.length} roadmap ${
                          filteredItems.length === 1 ? 'item' : 'items'
                        }`}
                  </p>
                </div>

                {/* Timeline */}
                {filteredItems.length > 0 ? (
                  <RoadmapTimeline items={sortedItems} />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No Results Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Try adjusting your filters to see more roadmap items
                    </p>
                    <button
                      onClick={() => {
                        setSelectedArea('all');
                        setSelectedStatus('all');
                      }}
                      className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4">Want to Collaborate?</h2>
              <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
                I'm always open to feedback and collaboration opportunities. Get in touch to discuss
                any of these projects!
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-cyan-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
              >
                Contact Me
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
