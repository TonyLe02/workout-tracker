'use client';

// React/Next.js
import { useMemo, useState } from 'react';

// External libraries
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  startOfYear,
} from 'date-fns';

// Icons
import { BarChart3 } from 'lucide-react';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

type TimeRange = 'week' | 'month' | 'year';

interface ProgressChartProps {
  workouts: WorkoutEntry[];
}

interface TooltipEntry {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

export function WeeklyChart({ workouts }: ProgressChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const chartData = useMemo(() => {
    const now = new Date();

    if (timeRange === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayWorkouts = workouts.filter((w) => w.date === dateStr);

        const activeSum = dayWorkouts.reduce((sum, w) => sum + w.activeKcal, 0);
        const latestTotal = dayWorkouts
          .filter((w) => w.totalKcal > 0)
          .sort((a, b) => b.timestamp - a.timestamp)[0]?.totalKcal || 0;

        return {
          date: dateStr,
          label: format(date, 'EEE'),
          reps: dayWorkouts.reduce((sum, w) => sum + w.reps, 0),
          kcal: Math.max(activeSum, latestTotal),
        };
      });
    }

    if (timeRange === 'month') {
      return Array.from({ length: 30 }, (_, i) => {
        const date = subDays(now, 29 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayWorkouts = workouts.filter((w) => w.date === dateStr);

        const activeSum = dayWorkouts.reduce((sum, w) => sum + w.activeKcal, 0);
        const latestTotal = dayWorkouts
          .filter((w) => w.totalKcal > 0)
          .sort((a, b) => b.timestamp - a.timestamp)[0]?.totalKcal || 0;

        return {
          date: dateStr,
          label: format(date, 'd'),
          reps: dayWorkouts.reduce((sum, w) => sum + w.reps, 0),
          kcal: Math.max(activeSum, latestTotal),
        };
      });
    }

    // Yearly view - aggregate by month
    const yearStart = startOfYear(now);
    const months = eachMonthOfInterval({ start: yearStart, end: now });

    return months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthWorkouts = workouts.filter((w) => {
        const wDate = new Date(w.date);
        return wDate >= monthStart && wDate <= monthEnd;
      });

      // Group by date within the month and calculate per-day kcal
      const byDate: Record<string, typeof monthWorkouts> = {};
      for (const w of monthWorkouts) {
        if (!byDate[w.date]) byDate[w.date] = [];
        byDate[w.date].push(w);
      }

      let monthKcal = 0;
      for (const date of Object.keys(byDate)) {
        const dayWorkouts = byDate[date];
        const activeSum = dayWorkouts.reduce((sum, w) => sum + w.activeKcal, 0);
        const latestTotal = dayWorkouts
          .filter((w) => w.totalKcal > 0)
          .sort((a, b) => b.timestamp - a.timestamp)[0]?.totalKcal || 0;
        monthKcal += Math.max(activeSum, latestTotal);
      }

      return {
        date: format(monthDate, 'yyyy-MM'),
        label: format(monthDate, 'MMM'),
        reps: monthWorkouts.reduce((sum, w) => sum + w.reps, 0),
        kcal: monthKcal,
      };
    });
  }, [workouts, timeRange]);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 backdrop-blur-xl rounded-lg p-3 border border-white/10">
          <p className="text-text-secondary text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm font-semibold text-white"
            >
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const rangeLabels: Record<TimeRange, string> = {
    week: 'Weekly',
    month: 'Monthly',
    year: 'Yearly',
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            {rangeLabels[timeRange]} Progress
          </span>
        </div>
        <div className="flex gap-1 bg-surface-hover/50 rounded-lg p-1">
          {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white/10 text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {range === 'week' ? '7D' : range === 'month' ? '30D' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Reps Chart */}
      <div className="mb-6">
        <div className="text-xs text-text-secondary mb-2">Reps</div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a3a3a3', fontSize: 10 }}
                interval={timeRange === 'month' ? 4 : 0}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.08)' }} />
              <Bar
                dataKey="reps"
                name="Reps"
                fill="rgba(34,197,94,0.8)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calories Chart */}
      <div>
        <div className="text-xs text-text-secondary mb-2">Total Calories</div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a3a3a3', fontSize: 10 }}
                interval={timeRange === 'month' ? 4 : 0}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} />
              <Area
                type="monotone"
                dataKey="kcal"
                name="Total kcal"
                stroke="#f97316"
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
