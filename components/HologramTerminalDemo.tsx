'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoCommand } from '@/data/types';

interface HologramTerminalDemoProps {
  commands: DemoCommand[];
  autoPlay?: boolean;
  loopDelay?: number;
}

export default function HologramTerminalDemo({
  commands,
  autoPlay = true,
  loopDelay = 3000,
}: HologramTerminalDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [displayedInput, setDisplayedInput] = useState('');
  const [displayedOutput, setDisplayedOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentCommand = commands[currentIndex];

  // Typing animation effect
  useEffect(() => {
    if (!isPlaying) return;

    setIsTyping(true);
    setDisplayedInput('');
    setDisplayedOutput('');

    let inputIndex = 0;
    let outputIndex = 0;

    // Type input (natural language)
    const inputInterval = setInterval(() => {
      if (inputIndex < currentCommand.input.length) {
        setDisplayedInput(currentCommand.input.slice(0, inputIndex + 1));
        inputIndex++;
      } else {
        clearInterval(inputInterval);

        // Type output after a brief pause
        setTimeout(() => {
          const outputInterval = setInterval(() => {
            if (outputIndex < currentCommand.output.length) {
              setDisplayedOutput(currentCommand.output.slice(0, outputIndex + 1));
              outputIndex++;
            } else {
              clearInterval(outputInterval);
              setIsTyping(false);

              // Move to next command after delay
              setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % commands.length);
              }, loopDelay);
            }
          }, 10); // Faster typing for output
        }, 500);
      }
    }, 50); // Input typing speed

    return () => {
      clearInterval(inputInterval);
    };
  }, [currentIndex, isPlaying, currentCommand, commands.length, loopDelay]);

  const riskColors = {
    low: 'text-green-400 border-green-400',
    medium: 'text-yellow-400 border-yellow-400',
    high: 'text-orange-400 border-orange-400',
    critical: 'text-red-400 border-red-400',
  };

  return (
    <div className="relative">
      {/* Terminal Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-cyan-500/30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex gap-1.5 sm:gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
          </div>
          <span className="text-cyan-400 text-xs sm:text-sm font-bold tracking-wider">CLI_X TERMINAL</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Risk Badge */}
          {currentCommand.riskLevel && (
            <div
              className={`hidden xs:block px-2 sm:px-3 py-1 rounded-full text-xs font-bold border ${
                riskColors[currentCommand.riskLevel]
              } shadow-lg`}
            >
              {currentCommand.riskLevel.toUpperCase()} RISK
            </div>
          )}

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center transition-all"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="space-y-3 sm:space-y-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Natural Language Input */}
            <div className="flex items-start gap-2 mb-3">
              <span className="text-purple-400 font-bold text-sm">USER:</span>
              <span className="text-white font-normal text-sm flex-1">
                {displayedInput}
                {isTyping && displayedInput.length < currentCommand.input.length && (
                  <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse"></span>
                )}
              </span>
            </div>

            {/* Generated Command */}
            {displayedOutput && (
              <div className="flex items-start gap-2 mb-2">
                <span className="text-green-400 font-bold text-lg">❯</span>
                <span className="text-cyan-300 font-mono text-sm flex-1">
                  {displayedOutput}
                  {isTyping && displayedOutput.length < currentCommand.output.length && (
                    <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse"></span>
                  )}
                </span>
              </div>
            )}

            {/* Warning (if present) */}
            {currentCommand.warning && displayedOutput === currentCommand.output && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border-l-4 mb-3 ${
                  currentCommand.riskLevel === 'critical' || currentCommand.riskLevel === 'high'
                    ? 'bg-red-900/20 border-red-500 text-red-300'
                    : 'bg-yellow-900/20 border-yellow-500 text-yellow-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">{currentCommand.warning}</span>
                </div>
              </motion.div>
            )}

            {/* Explanation */}
            {!isTyping && currentCommand.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-cyan-200 text-sm leading-relaxed">{currentCommand.explanation}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-cyan-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-cyan-400 text-xs font-bold">
            COMMAND {currentIndex + 1} / {commands.length}
          </span>
          <div className="flex gap-1">
            {commands.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-cyan-400 w-6'
                    : 'bg-cyan-400/30 hover:bg-cyan-400/50'
                }`}
                aria-label={`Go to command ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

