'use client';

import { motion } from 'framer-motion';
import FeedbackForm from '@/components/FeedbackForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimatedGradientMesh from '@/components/AnimatedGradientMesh';

export default function ContactPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Gradient Mesh Background */}
        <AnimatedGradientMesh
          colorScheme="lavender"
          intensity={1.2}
          speed={0.4}
          blur={true}
          opacity={0.6}
        />

        {/* Hero Section */}
        <div className="relative py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-6xl font-bold mb-6 text-gray-900 dark:text-white drop-shadow-lg">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto drop-shadow-md">
              Have a question, feedback, or interested in collaborating? I'd love to hear from you!
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border-2 border-white/30 dark:border-gray-700/30"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Send Me a Message
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Whether you're interested in licensing my photography, discussing technology projects, 
                  or just want to say hello, I'll get back to you as soon as possible.
                </p>
              </div>
              <FeedbackForm />
            </motion.div>

            {/* Additional Info */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{
                  scale: 1.05,
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(6, 182, 212, 0.3)',
                  transition: { duration: 0.3 }
                }}
                className="text-center p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-xl border-2 border-white/30 dark:border-gray-700/30 shadow-lg cursor-pointer"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-12 mx-auto mb-4 bg-cyan-100 dark:bg-cyan-900/50 rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Response Time</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Usually within 24-48 hours</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{
                  scale: 1.05,
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
                  transition: { duration: 0.3 }
                }}
                className="text-center p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-xl border-2 border-white/30 dark:border-gray-700/30 shadow-lg cursor-pointer"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">your.email@example.com</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{
                  scale: 1.05,
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)',
                  transition: { duration: 0.3 }
                }}
                className="text-center p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-xl border-2 border-white/30 dark:border-gray-700/30 shadow-lg cursor-pointer"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-12 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Location</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Switzerland</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
