'use client';

import { useMemo } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

import { Clock, Crown, Dumbbell, Flame } from 'lucide-react';

import { sumKcalForDay } from '@/lib/kcal';
import type { WorkoutEntry } from '@/types/workout';

interface PersonalBestsProps {
  workouts: WorkoutEntry[];
}

interface DailyRecord {
  value: number;
  date: string | null;
}

function formatDate(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (isToday(parsed)) return 'Today';
  if (isYesterday(parsed)) return 'Yesterday';
  return format(parsed, 'MMM d');
}

function formatHour(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? 'am' : 'pm';
  return `${h12}${suffix}`;
}

function findPeakHour(workouts: WorkoutEntry[]): { hour: number | null; count: number } {
  if (workouts.length === 0) return { hour: null, count: 0 };

  const buckets = new Array<number>(24).fill(0);
  for (const workout of workouts) {
    if (workout.reps <= 0 && workout.activeKcal <= 0 && workout.totalKcal <= 0) continue;
    const hour = new Date(workout.timestamp).getHours();
    buckets[hour] += 1;
  }

  let bestHour = -1;
  let bestCount = 0;
  for (let i = 0; i < 24; i++) {
    if (buckets[i] > bestCount) {
      bestCount = buckets[i];
      bestHour = i;
    }
  }

  return bestHour === -1 ? { hour: null, count: 0 } : { hour: bestHour, count: bestCount };
}

function findBests(workouts: WorkoutEntry[]): { reps: DailyRecord; kcal: DailyRecord } {
  const byDate: Record<string, WorkoutEntry[]> = {};

  for (const workout of workouts) {
    if (!byDate[workout.date]) byDate[workout.date] = [];
    byDate[workout.date].push(workout);
  }

  let bestReps: DailyRecord = { value: 0, date: null };
  let bestKcal: DailyRecord = { value: 0, date: null };

  for (const date of Object.keys(byDate)) {
    const entries = byDate[date];
    const reps = entries.reduce((sum, entry) => sum + entry.reps, 0);
    const kcal = sumKcalForDay(entries);

    if (reps > bestReps.value) bestReps = { value: reps, date };
    if (kcal > bestKcal.value) bestKcal = { value: kcal, date };
  }

  return { reps: bestReps, kcal: bestKcal };
}

interface RecordRowProps {
  icon: typeof Dumbbell;
  iconColor: string;
  label: string;
  record: DailyRecord;
  unit: string;
}

function RecordRow({ icon: Icon, iconColor, label, record, unit }: RecordRowProps) {
  const hasRecord = record.value > 0 && record.date;
  const isCurrentDay = record.date ? isToday(parseISO(record.date)) : false;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-hover/40 px-3 py-2.5">
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-text-secondary/70">
          {label}
        </div>
        {hasRecord ? (
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold text-text-primary font-mono">
              {record.value.toLocaleString()}
            </span>
            <span className="text-[11px] text-text-secondary">{unit}</span>
          </div>
        ) : (
          <div className="text-sm text-text-secondary/60 mt-0.5">No record yet</div>
        )}
      </div>
      {hasRecord && record.date && (
        <div
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
            isCurrentDay
              ? 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30'
              : 'text-text-secondary/70'
          }`}
        >
          {formatDate(record.date)}
        </div>
      )}
    </div>
  );
}

export function PersonalBests({ workouts }: PersonalBestsProps) {
  const bests = useMemo(() => findBests(workouts), [workouts]);
  const peakHour = useMemo(() => findPeakHour(workouts), [workouts]);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
        <span className="text-xs text-text-secondary uppercase tracking-wider">
          Personal Bests
        </span>
      </div>
      <div className="space-y-2">
        <RecordRow
          icon={Dumbbell}
          iconColor="text-green-500"
          label="Best Day · Reps"
          record={bests.reps}
          unit="reps"
        />
        <RecordRow
          icon={Flame}
          iconColor="text-orange-500"
          label="Best Day · Calories"
          record={bests.kcal}
          unit="kcal"
        />
        <div className="flex items-center gap-3 rounded-xl bg-surface-hover/40 px-3 py-2.5">
          <Clock className="w-4 h-4 flex-shrink-0 text-blue-400" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/70">
              Most Active Hour
            </div>
            {peakHour.hour !== null ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-bold text-text-primary font-mono">
                  {formatHour(peakHour.hour)}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {peakHour.count} {peakHour.count === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            ) : (
              <div className="text-sm text-text-secondary/60 mt-0.5">No pattern yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
