'use client';

import { motion } from 'motion/react';
import { Clock, EnvelopeSimple, MapPin } from '@phosphor-icons/react/dist/ssr';
import FeedbackForm from '@/components/FeedbackForm';
import AnimatedGradientMesh from '@/components/AnimatedGradientMesh';
import { site } from '@/data/site';

/**
 * Contact, interim contrast fix (SHELL-06, UI-SPEC "Contact Interim Contrast
 * Fix"). All text sits on solid surface-raised panels, never on the mesh, so
 * every pair is a UI-SPEC token pair with or without WebGL and in either OS
 * colour scheme. Phase 12 redesigns the page and removes the mesh.
 */
const cardClass = 'text-center p-6 bg-surface-raised border border-line rounded-lg';
const iconTileClass =
  'w-12 h-12 mx-auto mb-4 bg-surface-overlay rounded-full flex items-center justify-center';

// The address breaks after the "@" first (<wbr>); wrap-anywhere is the fallback
// for a part longer than the card. Copied text stays the plain address.
const [emailUser, emailDomain] = site.email.split('@');

export default function ContactPage() {
  return (
    <>
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-surface-raised border border-line rounded-lg p-8 md:p-12 text-left">
              <h1 className="text-6xl font-bold mb-6 text-ink">
                Get in Touch
              </h1>
              <p className="text-base text-ink-muted max-w-prose">
                Have a question, feedback, or interested in collaborating? I&apos;d love to hear from you!
              </p>
            </div>
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
              className="bg-surface-raised border border-line rounded-lg p-8"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-ink">
                  Send Me a Message
                </h2>
                <p className="text-ink">
                  Whether you&apos;re interested in licensing my photography, discussing technology projects,
                  or just want to say hello, I&apos;ll get back to you as soon as possible.
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
                className={cardClass}
              >
                <div className={iconTileClass}>
                  <Clock size={20} aria-hidden="true" className="text-ink-muted" />
                </div>
                <h3 className="font-bold text-ink mb-2">Response Time</h3>
                <p className="text-sm text-ink-muted">Usually within 24-48 hours</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={cardClass}
              >
                <div className={iconTileClass}>
                  <EnvelopeSimple size={20} aria-hidden="true" className="text-ink-muted" />
                </div>
                <h3 className="font-bold text-ink mb-2">Email</h3>
                <p className="text-sm text-ink-muted wrap-anywhere">
                  {`${emailUser}@`}<wbr />{emailDomain}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className={cardClass}
              >
                <div className={iconTileClass}>
                  <MapPin size={20} aria-hidden="true" className="text-ink-muted" />
                </div>
                <h3 className="font-bold text-ink mb-2">Location</h3>
                <p className="text-sm text-ink-muted">Switzerland</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
