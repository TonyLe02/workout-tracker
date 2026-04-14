'use client';

// React/Next.js
import { useMemo } from 'react';

// External libraries
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

// Icons
import { BarChart3 } from 'lucide-react';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

interface WeeklyChartProps {
  workouts: WorkoutEntry[];
}

export function WeeklyChart({ workouts }: WeeklyChartProps) {
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayWorkouts = workouts.filter((w) => w.date === dateStr);

      return {
        date: dateStr,
        day: format(date, 'EEE'),
        reps: dayWorkouts.reduce((sum, w) => sum + w.reps, 0),
        activeKcal: dayWorkouts.reduce((sum, w) => sum + w.activeKcal, 0),
        totalKcal: dayWorkouts.reduce((sum, w) => sum + w.totalKcal, 0),
      };
    });

    return last7Days;
  }, [workouts]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-border">
          <p className="text-text-secondary text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm font-semibold"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <span className="text-sm text-text-secondary uppercase tracking-wider">
          Weekly Progress
        </span>
      </div>

      {/* Reps Chart */}
      <div className="mb-6">
        <div className="text-xs text-text-secondary mb-2">Reps</div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a3a3a3', fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="reps"
                name="Reps"
                fill="#00d9ff"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calories Chart */}
      <div>
        <div className="text-xs text-text-secondary mb-2">Active Calories</div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a3a3a3', fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="activeKcal"
                name="Active kcal"
                stroke="#a855f7"
                strokeWidth={2}
                fill="url(#colorKcal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
