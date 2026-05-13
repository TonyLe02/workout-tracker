'use client';

import { useId } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100+ (values above 100 trigger overflow lap)
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Color used when progress exceeds 100% (second lap). Defaults to a darker shade of `color`. */
  overflowColor?: string;
  bgColor?: string;
  useGradient?: boolean;
  /** Gradient start color (only when useGradient is true). */
  gradientFrom?: string;
  /** Gradient end color (only when useGradient is true). */
  gradientTo?: string;
  /** Render a trailing dot at the end of the progress arc. */
  showTrailingDot?: boolean;
  /** Apply a soft pulsing glow when progress reaches 100%. */
  glowWhenComplete?: boolean;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#00d9ff',
  overflowColor,
  bgColor = '#262626',
  useGradient = false,
  gradientFrom = '#eab308',
  gradientTo = '#f97316',
  showTrailingDot = false,
  glowWhenComplete = false,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const baseProgress = Math.min(progress, 100);
  const baseOffset = circumference - (baseProgress / 100) * circumference;
  const overflow = Math.max(0, progress - 100);
  const overflowProgress = Math.min(overflow, 100);
  const overflowOffset = circumference - (overflowProgress / 100) * circumference;
  const reactId = useId();
  // useId returns strings like ":r1:" which are valid in SVG hrefs but feel safer
  // when reduced to alphanumerics for an SVG `url(#...)` reference.
  const gradientId = `progress-gradient-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const isComplete = progress >= 100;

  // Trailing dot position. The SVG is rotated -90deg, so angle 0 (pre-rotation)
  // sits at 12 o'clock visually. Use the active arc's progress for placement.
  const dotProgress = overflow > 0 ? overflowProgress : baseProgress;
  const dotAngleRad = (dotProgress / 100) * 2 * Math.PI;
  const center = size / 2;
  const dotX = center + radius * Math.cos(dotAngleRad);
  const dotY = center + radius * Math.sin(dotAngleRad);
  const dotColor =
    overflow > 0 ? overflowColor ?? color : useGradient ? gradientTo : color;
  // Hide the dot at exactly 0% so it doesn't sit on the 12 o'clock axis when empty.
  const showDot = showTrailingDot && dotProgress > 0;

  const glowing = glowWhenComplete && isComplete;

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-shadow duration-500 ${
        glowing ? 'rounded-full' : ''
      }`}
      style={
        glowing
          ? {
              filter: `drop-shadow(0 0 12px ${overflowColor ?? color}55)`,
            }
          : undefined
      }
    >
      <svg
        className="progress-ring"
        width={size}
        height={size}
      >
        {useGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
        )}
        {/* Background circle */}
        <circle
          stroke={bgColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Primary progress circle (0–100%) */}
        <circle
          className="progress-ring-circle"
          stroke={useGradient ? `url(#${gradientId})` : color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={baseOffset}
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Overflow lap (100%+ progress) */}
        {overflow > 0 && (
          <circle
            className="progress-ring-circle"
            stroke={overflowColor ?? color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={overflowOffset}
            r={radius}
            cx={center}
            cy={center}
          />
        )}
        {/* Trailing dot */}
        {showDot && (
          <>
            <circle
              cx={dotX}
              cy={dotY}
              r={strokeWidth / 2 + 0.5}
              fill={dotColor}
              style={{ transition: 'cx 500ms ease-out, cy 500ms ease-out, fill 300ms' }}
            />
            <circle
              cx={dotX}
              cy={dotY}
              r={strokeWidth / 6}
              fill="#ffffff"
              opacity={0.55}
              style={{ transition: 'cx 500ms ease-out, cy 500ms ease-out' }}
            />
          </>
        )}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
