'use client';

import { useState } from 'react';

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
  type LucideIcon,
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
      <span className="inline-flex items-center gap-0.5 text-[11px] text-text-secondary/70">
        <Minus className="w-3 h-3" />
        same as yesterday
      </span>
    );
  }

  const isUp = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] ${
        isUp ? 'text-green-400/90' : 'text-red-400/90'
      }`}
    >
      {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(delta).toLocaleString()} vs yesterday
    </span>
  );
}

function suggestGoal(avg: number): number {
  if (avg <= 0) return 0;
  const step = avg >= 500 ? 50 : avg >= 100 ? 25 : 10;
  return Math.max(step, Math.round(avg / step) * step);
}

interface GoalRowProps {
  label: string;
  icon: LucideIcon;
  iconClass: string;
  current: number;
  goal: number;
  yesterday?: number;
  barGradient: string;
}

function GoalRow({
  label,
  icon: Icon,
  iconClass,
  current,
  goal,
  yesterday,
  barGradient,
}: GoalRowProps) {
  const progress = goal > 0 ? (current / goal) * 100 : 0;
  const displayPercent = Math.round(progress);
  const complete = progress >= 100;
  const overflow = Math.max(0, current - goal);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <Icon className={`w-4 h-4 ${iconClass}`} />
          <span>{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-mono font-semibold text-text-primary">
            {current.toLocaleString()}
          </span>
          <span className="text-xs text-text-secondary font-mono">
            / {goal.toLocaleString()}
          </span>
          {complete && (
            <Check className={`w-3.5 h-3.5 self-center ml-0.5 ${iconClass}`} />
          )}
        </div>
      </div>

      <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${barGradient}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        {yesterday !== undefined ? (
          <DeltaPill current={current} yesterday={yesterday} />
        ) : (
          <span />
        )}
        <span className="text-[11px] text-text-secondary/80 font-mono">
          {overflow > 0 ? `+${overflow.toLocaleString()} over · ` : ''}
          {displayPercent}%
        </span>
      </div>
    </div>
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
  const [editReps, setEditReps] = useState(goalReps.toString());
  const [editKcal, setEditKcal] = useState(goalKcal.toString());

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
      <div className="flex items-center justify-between mb-5">
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
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {isEditing ? (
            <Check className="w-4 h-4 text-green-500" />
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
              className="w-full h-10 px-3 rounded-lg bg-surface-hover/50 border border-border text-text-primary text-center font-mono focus:outline-none focus:border-border-hover"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Total kcal Goal</label>
            <input
              type="number"
              value={editKcal}
              onChange={(e) => setEditKcal(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-hover/50 border border-border text-text-primary text-center font-mono focus:outline-none focus:border-border-hover"
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
                        ? 'bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/40'
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
        <div className="space-y-5">
          <GoalRow
            label="Reps"
            icon={Dumbbell}
            iconClass="text-green-500"
            current={currentReps}
            goal={goalReps}
            yesterday={yesterdayReps}
            barGradient="from-green-400 to-green-500"
          />
          <GoalRow
            label="Total kcal"
            icon={Flame}
            iconClass="text-orange-500"
            current={currentKcal}
            goal={goalKcal}
            yesterday={yesterdayKcal}
            barGradient="from-amber-500 to-orange-500"
          />
        </div>
      )}

      {(showRepsHint || showKcalHint) && (
        <div className="mt-5 pt-4 border-t border-border/50 space-y-1.5">
          {showRepsHint && (
            <button
              type="button"
              onClick={applyRepsSuggestion}
              className="w-full flex items-center gap-2 text-left text-xs text-text-secondary hover:text-text-primary group transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400/80 flex-shrink-0" />
              <span className="flex-1">
                Reps avg{' '}
                <span className="text-text-primary font-mono">
                  {Math.round(avgReps ?? 0)}
                </span>
                /day · try{' '}
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
                Kcal avg{' '}
                <span className="text-text-primary font-mono">
                  {Math.round(avgKcal ?? 0)}
                </span>
                /day · try{' '}
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
