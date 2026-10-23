'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import {
  ArrowsClockwise,
  Brain,
  ChartBar,
  ChatCircleText,
  ChatsCircle,
  Circle,
  ClipboardText,
  Cpu,
  CreditCard,
  Desktop,
  DeviceMobile,
  GameController,
  Lightning,
  LockKey,
  Notepad,
  Package,
  Plug,
  ShieldCheck,
  User,
} from '@phosphor-icons/react/dist/ssr';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface FeatureShowcaseProps {
  features: string[];
  title?: string;
}

type FeatureIcon = { Icon: typeof Circle; color: string };

const iconMap: Record<string, FeatureIcon> = {
  'natural language': { Icon: ChatCircleText, color: 'from-blue-500 to-cyan-500' },
  intelligence: { Icon: Brain, color: 'from-purple-500 to-pink-500' },
  safety: { Icon: ShieldCheck, color: 'from-green-500 to-emerald-500' },
  provider: { Icon: Plug, color: 'from-orange-500 to-red-500' },
  'cross-platform': { Icon: Desktop, color: 'from-indigo-500 to-blue-500' },
  conversation: { Icon: ChatsCircle, color: 'from-cyan-500 to-teal-500' },
  workflow: { Icon: ArrowsClockwise, color: 'from-pink-500 to-rose-500' },
  template: { Icon: ClipboardText, color: 'from-yellow-500 to-orange-500' },
  ollama: { Icon: Cpu, color: 'from-green-500 to-lime-500' },
  analytics: { Icon: ChartBar, color: 'from-purple-500 to-indigo-500' },
  caching: { Icon: Lightning, color: 'from-yellow-500 to-caution' },
  audit: { Icon: Notepad, color: 'from-gray-500 to-slate-500' },
  subscription: { Icon: CreditCard, color: 'from-green-500 to-emerald-500' },
  license: { Icon: LockKey, color: 'from-blue-500 to-indigo-500' },
  binary: { Icon: Package, color: 'from-orange-500 to-red-500' },
  authentication: { Icon: User, color: 'from-purple-500 to-pink-500' },
  playground: { Icon: GameController, color: 'from-cyan-500 to-blue-500' },
  responsive: { Icon: DeviceMobile, color: 'from-pink-500 to-rose-500' },
};

function getFeatureIcon(feature: string): FeatureIcon {
  const lowerFeature = feature.toLowerCase();

  for (const [key, value] of Object.entries(iconMap)) {
    if (lowerFeature.includes(key)) {
      return value;
    }
  }

  return { Icon: Circle, color: 'from-gray-500 to-gray-600' };
}

export default function FeatureShowcase({ features, title = 'Key Features' }: FeatureShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-white text-center">
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const { Icon, color } = getFeatureIcon(feature);
          const isHovered = hoveredIndex === index;

          return (
            <motion.div
              key={index}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.05, duration: 0.3 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative group"
            >
              <div
                className={`relative h-full p-6 rounded-xl border-2 transition-all duration-300 ${
                  isHovered
                    ? 'border-cyan-500 bg-gray-800 shadow-xl scale-105'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                {/* Icon */}
                <div className="mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </div>
                </div>

                {/* Feature Text */}
                <div className="text-gray-300 leading-relaxed">
                  {feature}
                </div>

                {/* Hover Indicator */}
                {isHovered && (
                  <motion.div
                    layoutId="feature-hover"
                    className="absolute inset-0 border-2 border-cyan-500 rounded-xl pointer-events-none"
                    transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Count */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
          <span className="text-cyan-400 font-semibold">
            {features.length} Features
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-300">Fully Implemented</span>
        </div>
      </div>
    </div>
  );
}

