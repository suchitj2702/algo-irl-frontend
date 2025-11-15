// Circular Progress Component
// Animated circular progress indicator for hotness scores

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  gradient?: string[]; // gradient stops for the ring
  scoreId?: string; // unique ID for gradient definition
  showLabel?: boolean;
}

export function CircularProgress({
  value,
  size = 100,
  strokeWidth = 6,
  gradient,
  scoreId = 'default',
  showLabel = true
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Use spring animation for smooth progress with better physics
  const progress = useSpring(0, {
    stiffness: 80,
    damping: 25,
    mass: 0.8,
    restDelta: 0.0001,
    restSpeed: 0.0001
  });

  const offset = useTransform(progress, (p) => {
    const calculatedOffset = circumference - (p / 100) * circumference;
    return calculatedOffset;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.set(value);
    }, 50);
    return () => clearTimeout(timer);
  }, [value, progress]);

  const gradientId = `ring-gradient-${scoreId}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Define gradient */}
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradient.map((stop, index) => {
                // Extract color from "rgb(r, g, b) percentage%" format
                const lastSpaceIndex = stop.lastIndexOf(' ');
                const color = stop.substring(0, lastSpaceIndex);
                return (
                  <stop
                    key={index}
                    offset={`${(index / (gradient.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                );
              })}
            </linearGradient>
          </defs>
        )}

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle with gradient */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gradient ? `url(#${gradientId})` : 'currentColor'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset
          }}
        />
      </svg>

      {/* Center text */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {Math.round(value)}
          </motion.span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            / 100
          </span>
        </div>
      )}
    </div>
  );
}
