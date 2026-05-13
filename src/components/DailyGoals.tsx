'use client';

// React/Next.js
import { useEffect, useRef, useState } from 'react';

// Components
import { ConfettiBurst } from './ConfettiBurst';
import { ProgressRing } from './ProgressRing';

// Icons
import {
  ArrowDown,
  ArrowUp,
  Check,
  Dumbbell,
  Flame,
  Lightbulb,
  Minus,
  Settings,
  Target,
} from 'lucide-react';

interface DailyGoalsProps {
  currentReps: number;
  goalReps: number;
  currentKcal: number;
  goalKcal: number;
  avgReps?: number;
  avgKcal?: number;
  yesterdayReps?: number;
  yesterdayKcal?: number;
  onGoalChange?: (reps: number, kcal: number) => void;
}

interface DeltaPillProps {
  current: number;
  yesterday: number;
}

function DeltaPill({ current, yesterday }: DeltaPillProps) {
  if (yesterday === 0 && current === 0) return null;

  const delta = current - yesterday;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-text-secondary/70">
        <Minus className="w-2.5 h-2.5" />
        same as yesterday
      </span>
    );
  }

  const isUp = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] ${
        isUp ? 'text-green-400/90' : 'text-red-400/90'
      }`}
    >
      {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
      {Math.abs(delta).toLocaleString()} vs yesterday
    </span>
  );
}

function suggestGoal(avg: number): number {
  if (avg <= 0) return 0;
  // Round to nearest sensible bucket so suggestions feel intentional.
  const step = avg >= 500 ? 50 : avg >= 100 ? 25 : 10;
  return Math.max(step, Math.round(avg / step) * step);
}

type RingView = 'value' | 'percent' | 'remaining';

const VIEW_ORDER: RingView[] = ['value', 'percent', 'remaining'];

function cycleView(view: RingView): RingView {
  const index = VIEW_ORDER.indexOf(view);
  return VIEW_ORDER[(index + 1) % VIEW_ORDER.length];
}

interface RingCenterProps {
  view: RingView;
  current: number;
  goal: number;
  percent: number;
  accentClass: string;
}

function RingCenter({ view, current, goal, percent, accentClass }: RingCenterProps) {
  if (view === 'percent') {
    return (
      <div className="text-2xl font-bold text-text-primary">
        {Math.round(percent)}%
      </div>
    );
  }

  if (view === 'remaining') {
    const remaining = Math.max(0, goal - current);
    if (remaining === 0) {
      return (
        <>
          <div className={`text-xl font-bold ${accentClass}`}>Done!</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">
            Goal hit
          </div>
        </>
      );
    }
    return (
      <>
        <div className="text-2xl font-bold text-text-primary">
          {remaining.toLocaleString()}
        </div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wider">
          to go
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-2xl font-bold text-text-primary">{current}</div>
      <div className="text-xs text-text-secondary">/ {goal}</div>
    </>
  );
}

export function DailyGoals({
  currentReps,
  goalReps,
  currentKcal,
  goalKcal,
  avgReps,
  avgKcal,
  yesterdayReps,
  yesterdayKcal,
  onGoalChange,
}: DailyGoalsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState<RingView>('value');
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
          <div>
            <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1.5">
              Quick Presets
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Easy', reps: 100, kcal: 150 },
                { label: 'Standard', reps: 300, kcal: 300 },
                { label: 'Strong', reps: 600, kcal: 500 },
                { label: 'Beast', reps: 1000, kcal: 750 },
              ].map((preset) => {
                const isActive =
                  parseInt(editReps, 10) === preset.reps &&
                  parseInt(editKcal, 10) === preset.kcal;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setEditReps(String(preset.reps));
                      setEditKcal(String(preset.kcal));
                    }}
                    className={`h-10 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40'
                        : 'bg-surface-hover/50 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
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
              repsCelebrating
                ? 'animate-goal-complete-pulse'
                : repsComplete
                ? 'animate-goal-complete-breathe'
                : ''
            }`}
            style={{
              ['--goal-pulse-color' as string]: 'rgba(34, 197, 94, 0.55)',
              ['--goal-breathe-color' as string]: 'rgba(34, 197, 94, 0.18)',
            } as React.CSSProperties}
          >
            <ProgressRing
              progress={repsProgress}
              size={100}
              strokeWidth={8}
              color={repsComplete ? '#22c55e' : undefined}
              overflowColor="#16a34a"
              useGradient={!repsComplete}
              gradientFrom="#4ade80"
              gradientTo="#22c55e"
              showTrailingDot
              glowWhenComplete
            >
              <button
                type="button"
                onClick={() => setView(cycleView)}
                aria-label="Cycle ring view"
                title="Tap to cycle: value · percent · remaining"
                className="text-center cursor-pointer rounded-full px-2 py-1 focus:outline-none"
              >
                <RingCenter
                  view={view}
                  current={currentReps}
                  goal={goalReps}
                  percent={repsProgress}
                  accentClass="text-green-500"
                />
              </button>
            </ProgressRing>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-text-secondary">
            <Dumbbell className="w-4 h-4 text-green-500" />
            Reps
          </div>
          {yesterdayReps !== undefined && (
            <div className="mt-1">
              <DeltaPill current={currentReps} yesterday={yesterdayReps} />
            </div>
          )}
          {repsComplete && (
            <div
              className={`text-xs text-green-500 mt-1 ${
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
              kcalCelebrating
                ? 'animate-goal-complete-pulse'
                : kcalComplete
                ? 'animate-goal-complete-breathe'
                : ''
            }`}
            style={{
              ['--goal-pulse-color' as string]: 'rgba(249, 115, 22, 0.55)',
              ['--goal-breathe-color' as string]: 'rgba(249, 115, 22, 0.18)',
            } as React.CSSProperties}
          >
            <ProgressRing
              progress={kcalProgress}
              size={100}
              strokeWidth={8}
              color={kcalComplete ? '#f97316' : undefined}
              overflowColor="#c2410c"
              useGradient={!kcalComplete}
              gradientFrom="#eab308"
              gradientTo="#f97316"
              showTrailingDot
              glowWhenComplete
            >
              <button
                type="button"
                onClick={() => setView(cycleView)}
                aria-label="Cycle ring view"
                title="Tap to cycle: value · percent · remaining"
                className="text-center cursor-pointer rounded-full px-2 py-1 focus:outline-none"
              >
                <RingCenter
                  view={view}
                  current={currentKcal}
                  goal={goalKcal}
                  percent={kcalProgress}
                  accentClass="text-orange-500"
                />
              </button>
            </ProgressRing>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-text-secondary">
            <Flame className="w-4 h-4 text-orange-500" />
            Total kcal
          </div>
          {yesterdayKcal !== undefined && (
            <div className="mt-1">
              <DeltaPill current={currentKcal} yesterday={yesterdayKcal} />
            </div>
          )}
          {kcalComplete && (
            <div
              className={`text-xs text-orange-500 mt-1 ${
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
