'use client';

// React/Next.js
import { useState } from 'react';

// Components
import { ProgressRing } from './ProgressRing';

// Icons
import { Target, Zap, Settings, Check } from 'lucide-react';

interface DailyGoalsProps {
  currentReps: number;
  goalReps: number;
  currentKcal: number;
  goalKcal: number;
  onGoalChange?: (reps: number, kcal: number) => void;
}

export function DailyGoals({
  currentReps,
  goalReps,
  currentKcal,
  goalKcal,
  onGoalChange,
}: DailyGoalsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editReps, setEditReps] = useState(goalReps.toString());
  const [editKcal, setEditKcal] = useState(goalKcal.toString());

  const repsProgress = goalReps > 0 ? (currentReps / goalReps) * 100 : 0;
  const kcalProgress = goalKcal > 0 ? (currentKcal / goalKcal) * 100 : 0;

  const repsComplete = repsProgress >= 100;
  const kcalComplete = kcalProgress >= 100;

  const handleSave = () => {
    const newReps = parseInt(editReps, 10) || 100;
    const newKcal = parseInt(editKcal, 10) || 300;
    onGoalChange?.(newReps, newKcal);
    setIsEditing(false);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-white" />
          <span className="text-sm text-text-secondary uppercase tracking-wider">
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
            <label className="text-xs text-text-secondary mb-1 block">Active kcal Goal</label>
            <input
              type="number"
              value={editKcal}
              onChange={(e) => setEditKcal(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-center font-mono focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
      ) : (

      <div className="flex items-center justify-around">
        {/* Reps Goal */}
        <div className="flex flex-col items-center">
          <ProgressRing
            progress={repsProgress}
            size={100}
            strokeWidth={8}
            color={repsComplete ? '#22c55e' : '#ffffff'}
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
            color={kcalComplete ? '#22c55e' : '#f97316'}
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
      )}
    </div>
  );
}
