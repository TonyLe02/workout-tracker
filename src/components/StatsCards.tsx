'use client';

// Icons
import { Calendar, Flame, Dumbbell } from 'lucide-react';

interface StatsCardsProps {
  totalReps: number;
  totalActiveKcal: number;
  totalWorkouts: number;
}

export function StatsCards({ totalReps, totalActiveKcal, totalWorkouts }: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Reps',
      value: totalReps.toLocaleString(),
      icon: Dumbbell,
      color: 'text-white',
      bgColor: 'bg-white/10',
    },
    {
      label: 'Total kcal Burned',
      value: totalActiveKcal.toLocaleString(),
      icon: Flame,
      color: 'text-white',
      bgColor: 'bg-white/10',
    },
    {
      label: 'Total Workouts',
      value: totalWorkouts.toLocaleString(),
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-white/10',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass rounded-xl p-4 text-center"
        >
          <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-2`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-text-secondary">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
