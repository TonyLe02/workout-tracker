'use client';

// React/Next.js
import { useEffect, useRef, useState } from 'react';

// Components
import { ConfettiBurst } from './ConfettiBurst';
import { ProgressRing } from './ProgressRing';

// Icons
import { Check, Dumbbell, Flame, Lightbulb, Settings, Target } from 'lucide-react';

interface DailyGoalsProps {
  currentReps: number;
  goalReps: number;
  currentKcal: number;
  goalKcal: number;
  avgReps?: number;
  avgKcal?: number;
  onGoalChange?: (reps: number, kcal: number) => void;
}

function suggestGoal(avg: number): number {
  if (avg <= 0) return 0;
  // Round to nearest sensible bucket so suggestions feel intentional.
  const step = avg >= 500 ? 50 : avg >= 100 ? 25 : 10;
  return Math.max(step, Math.round(avg / step) * step);
}

export function DailyGoals({
  currentReps,
  goalReps,
  currentKcal,
  goalKcal,
  avgReps,
  avgKcal,
  onGoalChange,
}: DailyGoalsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPercent, setShowPercent] = useState(false);
  const [editReps, setEditReps] = useState(goalReps.toString());
  const [editKcal, setEditKcal] = useState(goalKcal.toString());

  const repsProgress = goalReps > 0 ? (currentReps / goalReps) * 100 : 0;
  const kcalProgress = goalKcal > 0 ? (currentKcal / goalKcal) * 100 : 0;

  const repsComplete = repsProgress >= 100;
  const kcalComplete = kcalProgress >= 100;

  const [repsCelebrating, setRepsCelebrating] = useState(false);
  const [kcalCelebrating, setKcalCelebrating] = useState(false);
  const previousRepsCompleteRef = useRef(repsComplete);
  const previousKcalCompleteRef = useRef(kcalComplete);

  useEffect(() => {
    if (!previousRepsCompleteRef.current && repsComplete) {
      setRepsCelebrating(true);
      const timer = window.setTimeout(() => setRepsCelebrating(false), 800);
      previousRepsCompleteRef.current = repsComplete;
      return () => window.clearTimeout(timer);
    }
    previousRepsCompleteRef.current = repsComplete;
  }, [repsComplete]);

  useEffect(() => {
    if (!previousKcalCompleteRef.current && kcalComplete) {
      setKcalCelebrating(true);
      const timer = window.setTimeout(() => setKcalCelebrating(false), 800);
      previousKcalCompleteRef.current = kcalComplete;
      return () => window.clearTimeout(timer);
    }
    previousKcalCompleteRef.current = kcalComplete;
  }, [kcalComplete]);

  const handleSave = () => {
    const newReps = parseInt(editReps, 10) || 100;
    const newKcal = parseInt(editKcal, 10) || 300;
    onGoalChange?.(newReps, newKcal);
    setIsEditing(false);
  };

  const suggestedReps = avgReps !== undefined ? suggestGoal(avgReps) : 0;
  const suggestedKcal = avgKcal !== undefined ? suggestGoal(avgKcal) : 0;

  const repsOffByALot =
    suggestedReps > 0 && Math.abs(suggestedReps - goalReps) / Math.max(goalReps, 1) > 0.3;
  const kcalOffByALot =
    suggestedKcal > 0 && Math.abs(suggestedKcal - goalKcal) / Math.max(goalKcal, 1) > 0.3;

  const showRepsHint = !isEditing && repsOffByALot && suggestedReps !== goalReps;
  const showKcalHint = !isEditing && kcalOffByALot && suggestedKcal !== goalKcal;

  const applyRepsSuggestion = () => {
    if (suggestedReps > 0) onGoalChange?.(suggestedReps, goalKcal);
  };
  const applyKcalSuggestion = () => {
    if (suggestedKcal > 0) onGoalChange?.(goalReps, suggestedKcal);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            Daily Goals
          </span>
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setEditReps(goalReps.toString());
              setEditKcal(goalKcal.toString());
              setIsEditing(true);
            }
          }}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {isEditing ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Settings className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Reps Goal</label>
            <input
              type="number"
              value={editReps}
              onChange={(e) => setEditReps(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-center font-mono focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Total kcal Goal</label>
            <input
              type="number"
              value={editKcal}
              onChange={(e) => setEditKcal(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-center font-mono focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
      ) : (

      <div className="relative flex items-center justify-around">
        <ConfettiBurst
          trigger={repsCelebrating ? `reps-${currentReps}` : false}
          spread={100}
          count={14}
          className="left-0 right-1/2"
        />
        <ConfettiBurst
          trigger={kcalCelebrating ? `kcal-${currentKcal}` : false}
          spread={100}
          count={14}
          className="left-1/2 right-0"
        />
        {/* Reps Goal */}
        <div className="flex flex-col items-center">
          <div
            className={`rounded-full ${
              repsCelebrating ? 'animate-goal-complete-pulse' : ''
            }`}
          >
            <ProgressRing
              progress={repsProgress}
              size={100}
              strokeWidth={8}
              color={repsComplete ? '#22c55e' : undefined}
              useGradient={!repsComplete}
            >
              <button
                type="button"
                onClick={() => setShowPercent((v) => !v)}
                aria-label="Toggle percentage view"
                className="text-center cursor-pointer rounded-full px-2 py-1 hover:bg-white/5 transition-colors focus:outline-none"
              >
                {showPercent ? (
                  <div className="text-2xl font-bold text-text-primary">
                    {Math.round(repsProgress)}%
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-text-primary">
                      {currentReps}
                    </div>
                    <div className="text-xs text-text-secondary">/ {goalReps}</div>
                  </>
                )}
              </button>
            </ProgressRing>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-text-secondary">
            <Dumbbell className="w-4 h-4 text-green-500" />
            Reps
          </div>
          {repsComplete && (
            <div
              className={`text-xs text-success mt-1 ${
                repsCelebrating ? 'animate-pop-in' : ''
              }`}
            >
              Complete!
            </div>
          )}
        </div>

        {/* Kcal Goal */}
        <div className="flex flex-col items-center">
          <div
            className={`rounded-full ${
              kcalCelebrating ? 'animate-goal-complete-pulse' : ''
            }`}
          >
            <ProgressRing
              progress={kcalProgress}
              size={100}
              strokeWidth={8}
              color={kcalComplete ? '#22c55e' : undefined}
              useGradient={!kcalComplete}
            >
              <button
                type="button"
                onClick={() => setShowPercent((v) => !v)}
                aria-label="Toggle percentage view"
                className="text-center cursor-pointer rounded-full px-2 py-1 hover:bg-white/5 transition-colors focus:outline-none"
              >
                {showPercent ? (
                  <div className="text-2xl font-bold text-text-primary">
                    {Math.round(kcalProgress)}%
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-text-primary">
                      {currentKcal}
                    </div>
                    <div className="text-xs text-text-secondary">/ {goalKcal}</div>
                  </>
                )}
              </button>
            </ProgressRing>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-text-secondary">
            <Flame className="w-4 h-4 text-orange-500" />
            Total kcal
          </div>
          {kcalComplete && (
            <div
              className={`text-xs text-success mt-1 ${
                kcalCelebrating ? 'animate-pop-in' : ''
              }`}
            >
              Complete!
            </div>
          )}
        </div>
      </div>
      )}

      {(showRepsHint || showKcalHint) && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-1.5">
          {showRepsHint && (
            <button
              type="button"
              onClick={applyRepsSuggestion}
              className="w-full flex items-center gap-2 text-left text-xs text-text-secondary hover:text-text-primary group transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400/80 flex-shrink-0" />
              <span className="flex-1">
                Reps avg <span className="text-text-primary font-mono">{Math.round(avgReps ?? 0)}</span>/day · try{' '}
                <span className="text-text-primary font-mono">{suggestedReps}</span>
              </span>
              <span className="text-yellow-400/80 group-hover:text-yellow-300 text-[11px] font-semibold uppercase tracking-wider">
                Apply
              </span>
            </button>
          )}
          {showKcalHint && (
            <button
              type="button"
              onClick={applyKcalSuggestion}
              className="w-full flex items-center gap-2 text-left text-xs text-text-secondary hover:text-text-primary group transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400/80 flex-shrink-0" />
              <span className="flex-1">
                Kcal avg <span className="text-text-primary font-mono">{Math.round(avgKcal ?? 0)}</span>/day · try{' '}
                <span className="text-text-primary font-mono">{suggestedKcal}</span>
              </span>
              <span className="text-yellow-400/80 group-hover:text-yellow-300 text-[11px] font-semibold uppercase tracking-wider">
                Apply
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
