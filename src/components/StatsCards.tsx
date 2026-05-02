'use client';

// Components
import { CountUp } from './CountUp';

// Icons
import {
  Calendar,
  Dumbbell,
  Flame,
  TrendingUp,
  WeightTilde,
} from 'lucide-react';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

interface StatsCardsProps {
  totalReps: number;
  totalActiveKcal: number;
  totalWorkouts: number;
  workouts: WorkoutEntry[];
}

function medianRepsPerSession(workouts: WorkoutEntry[]): number {
  const repsByDate: Record<string, number> = {};

  for (const w of workouts) {
    repsByDate[w.date] = (repsByDate[w.date] || 0) + w.reps;
  }

  const values = Object.values(repsByDate)
    .filter((r) => r > 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return 0;

  const mid = Math.floor(values.length / 2);

  return values.length % 2 === 1
    ? values[mid]
    : Math.round((values[mid - 1] + values[mid]) / 2);
}

export function StatsCards({
  totalReps,
  totalActiveKcal,
  totalWorkouts,
  workouts,
}: StatsCardsProps) {
  const medianReps = medianRepsPerSession(workouts);

  const stats = [
    {
      label: 'Total Reps',
      value: totalReps,
      icon: Dumbbell,
      color: 'text-green-500',
    },
    {
      label: 'Total kcal',
      value: totalActiveKcal,
      icon: Flame,
      color: 'text-orange-500',
    },
    {
      label: 'Workouts',
      value: totalWorkouts,
      icon: Calendar,
      color: 'text-blue-400',
    },
    {
      label: 'Median reps',
      value: medianReps,
      icon: WeightTilde,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
        <span className="text-xs text-text-secondary uppercase tracking-wider">
          Stats
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold text-text-primary mb-1">
              <CountUp value={stat.value} />
            </div>
            <div className="text-xs text-text-secondary">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
