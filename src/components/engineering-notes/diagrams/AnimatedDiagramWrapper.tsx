import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { Variants } from 'framer-motion';
import { containerVariants, itemVariants } from './animationVariants';

interface AnimatedDiagramWrapperProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  threshold?: number;
  delay?: number;
}

/**
 * Wrapper component that triggers animations when the diagram scrolls into view.
 * Uses Intersection Observer via framer-motion's whileInView.
 *
 * @param children - The diagram content to animate
 * @param className - Additional CSS classes
 * @param variants - Custom animation variants (defaults to containerVariants)
 * @param threshold - Viewport threshold to trigger animation (0-1, default 0.25)
 * @param delay - Additional delay before animation starts
 */
export function AnimatedDiagramWrapper({
  children,
  className = '',
  variants = containerVariants,
  threshold = 0.25,
  delay = 0
}: AnimatedDiagramWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, render without animation
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  custom?: number;
}

/**
 * Individual animated item to be used inside AnimatedDiagramWrapper.
 * Inherits animation state from parent container.
 */
export function AnimatedItem({
  children,
  className = '',
  variants = itemVariants,
  custom
}: AnimatedItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      custom={custom}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedBarProps {
  width: string | number;
  className?: string;
  height?: string;
  delay?: number;
}

/**
 * Animated progress bar that grows from left to right.
 */
export function AnimatedBar({
  width,
  className = '',
  height = 'h-2',
  delay = 0
}: AnimatedBarProps) {
  const shouldReduceMotion = useReducedMotion();

  const barStyle = {
    width: typeof width === 'number' ? `${width}%` : width
  };

  if (shouldReduceMotion) {
    return <div className={`${height} rounded-full ${className}`} style={barStyle} />;
  }

  return (
    <motion.div
      className={`${height} rounded-full ${className}`}
      style={barStyle}
      initial={{ scaleX: 0, originX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
        delay
      }}
    />
  );
}

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
  duration?: number;
}

/**
 * Animated number that counts up to the target value.
 * Note: For simple use cases. For complex formatting,
 * use framer-motion's useSpring directly.
 */
export function AnimatedNumber({
  value,
  className = '',
  format = (n) => n.toFixed(0),
  duration = 1
}: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{format(value)}</span>;
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {format(value)}
    </motion.span>
  );
}

interface AnimatedSVGPathProps {
  d: string;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  duration?: number;
  delay?: number;
}

/**
 * Animated SVG path that draws itself.
 */
export function AnimatedSVGPath({
  d,
  className = '',
  stroke = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  duration = 1,
  delay = 0
}: AnimatedSVGPathProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <path
        d={d}
        className={className}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
    );
  }

  return (
    <motion.path
      d={d}
      className={className}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        duration,
        ease: 'easeInOut',
        delay,
        opacity: { duration: 0.2 }
      }}
    />
  );
}
