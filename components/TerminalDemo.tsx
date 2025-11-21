'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoCommand } from '@/data/types';

interface TerminalDemoProps {
  commands: DemoCommand[];
  autoPlay?: boolean;
  loop?: boolean;
}

export default function TerminalDemo({ commands, autoPlay = true, loop = true }: TerminalDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedInput, setDisplayedInput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isPaused, setIsPaused] = useState(!autoPlay);

  const currentCommand = commands[currentIndex];

  useEffect(() => {
    if (isPaused || !currentCommand) return;

    // Reset state
    setDisplayedInput('');
    setShowOutput(false);
    setIsTyping(true);

    // Type out the input
    const input = currentCommand.input;
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < input.length) {
        setDisplayedInput(input.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        // Show output after a pause
        setTimeout(() => {
          setShowOutput(true);
          
          // Move to next command after another pause
          setTimeout(() => {
            if (currentIndex < commands.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else if (loop) {
              setCurrentIndex(0);
            } else {
              setIsPaused(true);
            }
          }, 3000);
        }, 500);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [currentIndex, isPaused, currentCommand, commands.length, loop]);

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskBadge = (level?: string) => {
    switch (level) {
      case 'low':
        return { bg: 'bg-green-500/20', text: 'text-green-400', icon: '✓' };
      case 'medium':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '⚠' };
      case 'high':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '⚠' };
      case 'critical':
        return { bg: 'bg-red-500/20', text: 'text-red-400', icon: '⛔' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: 'ℹ' };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Terminal Window */}
      <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-700">
        {/* Terminal Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-400 text-sm ml-2">CLI_X Terminal</span>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-colors"
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
            <button
              onClick={() => {
                setCurrentIndex((currentIndex + 1) % commands.length);
                setIsPaused(false);
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
              aria-label="Next command"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Terminal Body - Fixed height to prevent jumping */}
        <div className="p-6 font-mono text-sm h-[400px] overflow-y-auto">
          {/* Input Line */}
          <div className="flex items-start mb-4">
            <span className="text-green-400 mr-2">$</span>
            <div className="flex-1">
              <span className="text-cyan-300">cli_x</span>
              <span className="text-gray-300"> "</span>
              <span className="text-white">{displayedInput}</span>
              {isTyping && (
                <motion.span
                  className="inline-block w-2 h-4 bg-white ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
              {!isTyping && <span className="text-gray-300">"</span>}
            </div>
          </div>

          {/* Output Section */}
          <AnimatePresence mode="wait">
            {showOutput && currentCommand && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Risk Level Badge */}
                {currentCommand.riskLevel && (
                  <div className="mb-3">
                    {(() => {
                      const badge = getRiskBadge(currentCommand.riskLevel);
                      return (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badge.bg}`}>
                          <span className={badge.text}>{badge.icon}</span>
                          <span className={`${badge.text} text-xs font-medium uppercase`}>
                            Risk: {currentCommand.riskLevel}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Warning Message */}
                {currentCommand.warning && (
                  <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-400">⚠️</span>
                      <span className="text-yellow-300 text-sm">{currentCommand.warning}</span>
                    </div>
                  </div>
                )}

                {/* Generated Command */}
                <div className="mb-3 p-4 bg-gray-800/50 rounded border border-gray-700">
                  <div className="text-gray-400 text-xs mb-2">Generated Command:</div>
                  <code className="text-green-400 text-sm break-all">{currentCommand.output}</code>
                </div>

                {/* Explanation */}
                {currentCommand.explanation && (
                  <div className="mb-3">
                    <div className="text-gray-400 text-xs mb-1">Explanation:</div>
                    <div className="text-gray-300 text-sm">{currentCommand.explanation}</div>
                  </div>
                )}

                {/* Execution Prompt */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Execute command?</span>
                  <span className="text-green-400">[Y]</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-red-400">[N]</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-cyan-400">[E]xplain</span>
                  <motion.span
                    className="inline-block w-2 h-4 bg-white ml-1"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Command Progress Indicator */}
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Command {currentIndex + 1} of {commands.length}
            </span>
            <div className="flex gap-1">
              {commands.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsPaused(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-cyan-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to command ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="mt-4 text-center text-sm text-gray-400">
        <p>Interactive demo showing CLI_X command generation with real-time safety analysis</p>
      </div>
    </div>
  );
}

