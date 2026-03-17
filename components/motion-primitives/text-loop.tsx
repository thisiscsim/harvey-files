'use client';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, Transition } from 'motion/react';
import { Children, ReactNode, useEffect, useState } from 'react';

export type TextLoopProps = {
  children: ReactNode;
  className?: string;
  interval?: number;
  transition?: Transition;
  onIndexChange?: (index: number) => void;
};

export function TextLoop({
  children,
  className,
  interval = 3000,
  transition = { duration: 0.3 },
  onIndexChange,
}: TextLoopProps) {
  const childArray = Children.toArray(children);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % childArray.length;
        onIndexChange?.(nextIndex);
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [childArray.length, interval, onIndexChange]);

  return (
    <div className={cn('relative inline-block overflow-hidden align-top', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={transition}
          className="block"
        >
          {childArray[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
