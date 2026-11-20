import React from 'react';
import { motion } from 'motion/react';

export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 28,
  mass: 0.7,
};

export const SPRING_CARD = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 26,
  mass: 0.85,
};

export const SPRING_POP = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 20,
};

export interface MotionButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  hoverScale?: number;
  hoverY?: number;
  tapScale?: number;
}

export function MotionButton({
  hoverScale = 1.025,
  hoverY = -1.5,
  tapScale = 0.96,
  disabled,
  children,
  ...rest
}: MotionButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: hoverScale, y: hoverY }}
      whileTap={disabled ? undefined : { scale: tapScale, y: 0 }}
      transition={SPRING_SNAPPY}
      disabled={disabled}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
