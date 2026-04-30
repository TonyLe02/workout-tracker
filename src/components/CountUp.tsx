'use client';

// React/Next.js
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CountUp({
  value,
  format = defaultFormat,
  duration = 600,
  className,
}: CountUpProps) {
  const [displayed, setDisplayed] = useState(value);
  const previousValueRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousValueRef.current = value;
      setDisplayed(value);
      return;
    }

    const startValue = previousValueRef.current;
    const targetValue = value;

    if (startValue === targetValue) {
      return;
    }

    if (prefersReducedMotion()) {
      previousValueRef.current = targetValue;
      setDisplayed(targetValue);
      return;
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const startTime = performance.now();
    const delta = targetValue - startValue;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + delta * eased;

      setDisplayed(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = targetValue;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      previousValueRef.current = targetValue;
    };
  }, [value, duration]);

  return <span className={className}>{format(displayed)}</span>;
}
