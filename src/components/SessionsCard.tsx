'use client';

// Icons
import { Calendar, WeightTilde } from 'lucide-react';

import type { WorkoutEntry } from '@/types/workout';

interface SessionsCardProps {
  totalSessions: number;
  workouts: WorkoutEntry[];
}

function medianRepsPerSession(workouts: WorkoutEntry[]): number {
  const repsByDate: Record<string, number> = {};

  for (const w of workouts) {
    repsByDate[w.date] = (repsByDate[w.date] || 0) + w.reps;
  }

  const values = Object.values(repsByDate).filter((r) => r > 0).sort((a, b) => a - b);

  if (values.length === 0) return 0;

  const mid = Math.floor(values.length / 2);

  return values.length % 2 === 1
    ? values[mid]
    : Math.round((values[mid - 1] + values[mid]) / 2);
}

export function SessionsCard({ totalSessions, workouts }: SessionsCardProps) {
  const medianReps = medianRepsPerSession(workouts);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        {/* Total Sessions */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Sessions</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-primary">
                {totalSessions}
              </span>
              <span className="text-text-secondary">logged</span>
            </div>
          </div>
        </div>

        {/* Median Reps */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-text-secondary text-sm justify-end">
            <WeightTilde className="w-4 h-4" />
            Median reps/session
          </div>
          <div className="text-2xl font-bold text-white">
            {medianReps}
          </div>
        </div>
      </div>
    </div>
  );
}
