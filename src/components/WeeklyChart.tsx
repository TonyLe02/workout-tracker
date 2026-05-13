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
import { BarChart3, Minus, TrendingDown, TrendingUp } from 'lucide-react';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

type TimeRange = 'week' | 'month' | 'year';

interface ProgressChartProps {
  workouts: WorkoutEntry[];
}

// Each kcal log is a cumulative snapshot from the tracker (not a delta),
// so the day's value is the latest reading — never a sum.
function dayKcal(dayWorkouts: WorkoutEntry[]): number {
  const latest = [...dayWorkouts].sort((a, b) => b.timestamp - a.timestamp);
  const latestTotal = latest.find((w) => w.totalKcal > 0)?.totalKcal ?? 0;
  const latestActive = latest.find((w) => w.activeKcal > 0)?.activeKcal ?? 0;
  return latestTotal || latestActive;
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

function sumWindow(workouts: WorkoutEntry[], from: Date, to: Date) {
  const byDate: Record<string, WorkoutEntry[]> = {};
  let totalReps = 0;

  for (const workout of workouts) {
    const workoutDate = new Date(workout.date);
    if (workoutDate < from || workoutDate > to) continue;
    totalReps += workout.reps;
    if (!byDate[workout.date]) byDate[workout.date] = [];
    byDate[workout.date].push(workout);
  }

  let totalKcal = 0;
  for (const date of Object.keys(byDate)) {
    totalKcal += dayKcal(byDate[date]);
  }

  return { reps: totalReps, kcal: totalKcal };
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? Infinity : null;
  return ((current - previous) / previous) * 100;
}

interface TrendBadgeProps {
  delta: number | null;
  label: string;
}

function TrendBadge({ delta, label }: TrendBadgeProps) {
  if (delta === null) {
    return null;
  }

  if (delta === Infinity) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-green-500/10 text-green-400 ring-1 ring-green-500/20 text-[11px] font-medium">
        <TrendingUp className="w-3 h-3" />
        New {label}
      </span>
    );
  }

  const rounded = Math.round(delta);
  if (rounded === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-white/5 text-text-secondary ring-1 ring-white/10 text-[11px] font-medium">
        <Minus className="w-3 h-3" />
        Flat
      </span>
    );
  }

  const isUp = rounded > 0;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        isUp
          ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20'
          : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
      }`}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}
      {rounded}% {label}
    </span>
  );
}

export function WeeklyChart({ workouts }: ProgressChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const trend = useMemo(() => {
    if (timeRange !== 'week') return null;
    const now = new Date();
    const currentStart = subDays(now, 6);
    const previousEnd = subDays(now, 7);
    const previousStart = subDays(now, 13);

    const current = sumWindow(workouts, currentStart, now);
    const previous = sumWindow(workouts, previousStart, previousEnd);

    return {
      reps: percentDelta(current.reps, previous.reps),
      kcal: percentDelta(current.kcal, previous.kcal),
    };
  }, [workouts, timeRange]);

  const chartData = useMemo(() => {
    const now = new Date();

    if (timeRange === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayWorkouts = workouts.filter((w) => w.date === dateStr);

        return {
          date: dateStr,
          label: format(date, 'EEE'),
          reps: dayWorkouts.reduce((sum, w) => sum + w.reps, 0),
          kcal: dayKcal(dayWorkouts),
        };
      });
    }

    if (timeRange === 'month') {
      return Array.from({ length: 30 }, (_, i) => {
        const date = subDays(now, 29 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayWorkouts = workouts.filter((w) => w.date === dateStr);

        return {
          date: dateStr,
          label: format(date, 'd'),
          reps: dayWorkouts.reduce((sum, w) => sum + w.reps, 0),
          kcal: dayKcal(dayWorkouts),
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
        monthKcal += dayKcal(byDate[date]);
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
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
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
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-text-secondary">Reps</div>
          {trend && <TrendBadge delta={trend.reps} label="vs last week" />}
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a3a3a3', fontSize: 10 }}
                interval={timeRange === 'month' ? 4 : 0}
                padding={{ left: 12, right: 12 }}
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
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-text-secondary">Total Calories</div>
          {trend && <TrendBadge delta={trend.kcal} label="vs last week" />}
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
                padding={{ left: 12, right: 12 }}
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
