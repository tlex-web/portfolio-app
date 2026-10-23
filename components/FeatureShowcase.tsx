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

type FeatureIcon = { Icon: typeof Circle };

const iconMap: Record<string, FeatureIcon> = {
  'natural language': { Icon: ChatCircleText },
  intelligence: { Icon: Brain },
  safety: { Icon: ShieldCheck },
  provider: { Icon: Plug },
  'cross-platform': { Icon: Desktop },
  conversation: { Icon: ChatsCircle },
  workflow: { Icon: ArrowsClockwise },
  template: { Icon: ClipboardText },
  ollama: { Icon: Cpu },
  analytics: { Icon: ChartBar },
  caching: { Icon: Lightning },
  audit: { Icon: Notepad },
  subscription: { Icon: CreditCard },
  license: { Icon: LockKey },
  binary: { Icon: Package },
  authentication: { Icon: User },
  playground: { Icon: GameController },
  responsive: { Icon: DeviceMobile },
};

function getFeatureIcon(feature: string): FeatureIcon {
  const lowerFeature = feature.toLowerCase();

  for (const [key, value] of Object.entries(iconMap)) {
    if (lowerFeature.includes(key)) {
      return value;
    }
  }

  return { Icon: Circle };
}

export default function FeatureShowcase({ features, title = 'Key Features' }: FeatureShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-ink text-center">
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const { Icon } = getFeatureIcon(feature);
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
                    ? 'border-accent bg-surface-raised shadow-xl scale-105'
                    : 'border-line bg-surface-raised'
                }`}
              >
                {/* Icon */}
                <div className="mb-4">
                  <div
                    className="w-12 h-12 rounded-lg bg-surface-overlay flex items-center justify-center shadow-lg"
                  >
                    <Icon size={20} aria-hidden="true" className="text-ink-muted" />
                  </div>
                </div>

                {/* Feature Text */}
                <div className="text-ink leading-relaxed">
                  {feature}
                </div>

                {/* Hover Indicator */}
                {isHovered && (
                  <motion.div
                    layoutId="feature-hover"
                    className="absolute inset-0 border-2 border-accent rounded-xl pointer-events-none"
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-overlay border border-line-strong rounded-full">
          <span className="text-accent font-semibold">
            {features.length} Features
          </span>
          <span className="text-ink-muted">•</span>
          <span className="text-ink">Fully Implemented</span>
        </div>
      </div>
    </div>
  );
}

