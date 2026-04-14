'use client';

// Components
import { ProgressRing } from './ProgressRing';

// Icons
import { Target, Zap } from 'lucide-react';

interface DailyGoalsProps {
  currentReps: number;
  goalReps: number;
  currentKcal: number;
  goalKcal: number;
}

export function DailyGoals({
  currentReps,
  goalReps,
  currentKcal,
  goalKcal,
}: DailyGoalsProps) {
  const repsProgress = goalReps > 0 ? (currentReps / goalReps) * 100 : 0;
  const kcalProgress = goalKcal > 0 ? (currentKcal / goalKcal) * 100 : 0;

  const repsComplete = repsProgress >= 100;
  const kcalComplete = kcalProgress >= 100;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-primary" />
        <span className="text-sm text-text-secondary uppercase tracking-wider">
          Daily Goals
        </span>
      </div>

      <div className="flex items-center justify-around">
        {/* Reps Goal */}
        <div className="flex flex-col items-center">
          <ProgressRing
            progress={repsProgress}
            size={100}
            strokeWidth={8}
            color={repsComplete ? '#22c55e' : '#00d9ff'}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {currentReps}
              </div>
              <div className="text-xs text-text-secondary">/ {goalReps}</div>
            </div>
          </ProgressRing>
          <div className="mt-3 flex items-center gap-1 text-sm text-text-secondary">
            <Target className="w-4 h-4" />
            Reps
          </div>
          {repsComplete && (
            <div className="text-xs text-success mt-1">Complete!</div>
          )}
        </div>

        {/* Kcal Goal */}
        <div className="flex flex-col items-center">
          <ProgressRing
            progress={kcalProgress}
            size={100}
            strokeWidth={8}
            color={kcalComplete ? '#22c55e' : '#a855f7'}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {currentKcal}
              </div>
              <div className="text-xs text-text-secondary">/ {goalKcal}</div>
            </div>
          </ProgressRing>
          <div className="mt-3 flex items-center gap-1 text-sm text-text-secondary">
            <Zap className="w-4 h-4" />
            Active kcal
          </div>
          {kcalComplete && (
            <div className="text-xs text-success mt-1">Complete!</div>
          )}
        </div>
      </div>
    </div>
  );
}
