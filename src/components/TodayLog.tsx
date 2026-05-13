'use client';

import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';

import { Check, Clock, Dumbbell, Flame, Heart, Pencil, Trash2, X, Zap } from 'lucide-react';

import type { WorkoutEntry } from '@/types/workout';

type DayTab = 'today' | 'yesterday';

interface TodayLogProps {
  workouts: WorkoutEntry[];
  onDelete: (id: string) => void;
  onEdit?: (
    id: string,
    updates: Partial<Pick<WorkoutEntry, 'reps' | 'activeKcal' | 'totalKcal'>>
  ) => void;
}

function describeEntry(entry: WorkoutEntry) {
  const parts: Array<{ label: string; icon: typeof Dumbbell; color: string }> = [];

  if (entry.reps > 0) {
    parts.push({
      label: `${entry.reps.toLocaleString()} reps`,
      icon: Dumbbell,
      color: 'text-green-500',
    });
  }
  if (entry.activeKcal > 0) {
    parts.push({
      label: `${entry.activeKcal.toLocaleString()} active kcal`,
      icon: Zap,
      color: 'text-yellow-500',
    });
  }
  if (entry.totalKcal > 0) {
    parts.push({
      label: `${entry.totalKcal.toLocaleString()} total kcal`,
      icon: Flame,
      color: 'text-orange-500',
    });
  }

  return parts;
}

export function TodayLog({ workouts, onDelete, onEdit }: TodayLogProps) {
  const [activeTab, setActiveTab] = useState<DayTab>('today');

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const targetDate = activeTab === 'today' ? today : yesterday;

  const todayCount = useMemo(
    () => workouts.filter((w) => w.date === today).length,
    [workouts, today]
  );
  const yesterdayCount = useMemo(
    () => workouts.filter((w) => w.date === yesterday).length,
    [workouts, yesterday]
  );

  const todaysEntries = useMemo(
    () =>
      workouts
        .filter((workout) => workout.date === targetDate)
        .sort((leftEntry, rightEntry) => rightEntry.timestamp - leftEntry.timestamp),
    [workouts, targetDate]
  );

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ reps: string; activeKcal: string; totalKcal: string }>({
    reps: '0',
    activeKcal: '0',
    totalKcal: '0',
  });

  const handleClick = (id: string) => {
    if (confirmingId === id) {
      onDelete(id);
      setConfirmingId(null);
      return;
    }
    setConfirmingId(id);
    window.setTimeout(() => {
      setConfirmingId((current) => (current === id ? null : current));
    }, 2500);
  };

  const startEditing = (entry: WorkoutEntry) => {
    setEditingId(entry.id);
    setEditValues({
      reps: String(entry.reps),
      activeKcal: String(entry.activeKcal),
      totalKcal: String(entry.totalKcal),
    });
    setConfirmingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = (entry: WorkoutEntry) => {
    if (!onEdit) {
      setEditingId(null);
      return;
    }
    const updates: Partial<Pick<WorkoutEntry, 'reps' | 'activeKcal' | 'totalKcal'>> = {};
    if (entry.reps > 0) updates.reps = Math.max(0, parseInt(editValues.reps, 10) || 0);
    if (entry.activeKcal > 0)
      updates.activeKcal = Math.max(0, parseInt(editValues.activeKcal, 10) || 0);
    if (entry.totalKcal > 0)
      updates.totalKcal = Math.max(0, parseInt(editValues.totalKcal, 10) || 0);
    onEdit(entry.id, updates);
    setEditingId(null);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <span className="text-xs text-text-secondary uppercase tracking-wider truncate">
            Log
          </span>
        </div>
        {todaysEntries.length > 0 && (
          <span className="text-[11px] uppercase tracking-wider text-text-secondary/70 flex-shrink-0">
            {todaysEntries.length} {todaysEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-surface-hover/50 rounded-lg p-1 mb-4">
        {(['today', 'yesterday'] as DayTab[]).map((tab) => {
          const count = tab === 'today' ? todayCount : yesterdayCount;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-2 py-1 text-xs rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span className="capitalize">{tab}</span>
              {count > 0 && (
                <span className="text-[10px] font-mono text-text-secondary/70">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {todaysEntries.length === 0 ? (
        <div className="py-8 text-center">
          <Heart className="w-8 h-8 mx-auto mb-2 text-text-secondary/30" />
          <p className="text-sm text-text-secondary/70">
            {activeTab === 'today'
              ? 'Nothing logged yet today.'
              : 'Nothing was logged yesterday.'}
          </p>
          <p className="text-xs text-text-secondary/50 mt-1">
            {activeTab === 'today'
              ? 'Add reps or calories above to get started.'
              : 'Switch to Today to start logging now.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide -mx-1 px-1">
          {todaysEntries.map((entry) => {
            const parts = describeEntry(entry);
            if (parts.length === 0) return null;

            const isConfirming = confirmingId === entry.id;
            const isEditing = editingId === entry.id;
            const time = format(new Date(entry.timestamp), 'HH:mm');

            if (isEditing) {
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 rounded-xl bg-surface-hover/70 ring-1 ring-white/10 px-3 py-2.5"
                >
                  <div className="text-[11px] font-mono text-text-secondary/70 w-10 flex-shrink-0">
                    {time}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                    {entry.reps > 0 && (
                      <label className="flex items-center gap-1.5 text-sm">
                        <Dumbbell className="w-3.5 h-3.5 text-green-500" />
                        <input
                          type="number"
                          value={editValues.reps}
                          onChange={(event) =>
                            setEditValues((current) => ({ ...current, reps: event.target.value }))
                          }
                          className="w-20 px-2 py-1 rounded-md bg-background/60 border border-border text-text-primary font-mono text-sm text-right focus:outline-none focus:border-border-hover"
                        />
                        <span className="text-xs text-text-secondary">reps</span>
                      </label>
                    )}
                    {entry.activeKcal > 0 && (
                      <label className="flex items-center gap-1.5 text-sm">
                        <Zap className="w-3.5 h-3.5 text-yellow-500" />
                        <input
                          type="number"
                          value={editValues.activeKcal}
                          onChange={(event) =>
                            setEditValues((current) => ({ ...current, activeKcal: event.target.value }))
                          }
                          className="w-20 px-2 py-1 rounded-md bg-background/60 border border-border text-text-primary font-mono text-sm text-right focus:outline-none focus:border-border-hover"
                        />
                        <span className="text-xs text-text-secondary">active</span>
                      </label>
                    )}
                    {entry.totalKcal > 0 && (
                      <label className="flex items-center gap-1.5 text-sm">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <input
                          type="number"
                          value={editValues.totalKcal}
                          onChange={(event) =>
                            setEditValues((current) => ({ ...current, totalKcal: event.target.value }))
                          }
                          className="w-20 px-2 py-1 rounded-md bg-background/60 border border-border text-text-primary font-mono text-sm text-right focus:outline-none focus:border-border-hover"
                        />
                        <span className="text-xs text-text-secondary">total</span>
                      </label>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => saveEditing(entry)}
                    aria-label="Save changes"
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-green-400 hover:bg-green-500/15 transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    aria-label="Cancel"
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary/70 hover:text-text-primary hover:bg-white/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            }

            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-xl bg-surface-hover/40 hover:bg-surface-hover/60 transition-colors px-3 py-2.5"
              >
                <div className="text-[11px] font-mono text-text-secondary/70 w-10 flex-shrink-0">
                  {time}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                  {parts.map((part) => {
                    const Icon = part.icon;
                    return (
                      <div
                        key={part.label}
                        className="flex items-center gap-1.5 text-sm text-text-primary"
                      >
                        <Icon className={`w-3.5 h-3.5 ${part.color}`} />
                        <span>{part.label}</span>
                      </div>
                    );
                  })}
                </div>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => startEditing(entry)}
                    aria-label="Edit entry"
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary/60 hover:text-text-primary hover:bg-white/5 transition-all"
                    title="Edit entry"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleClick(entry.id)}
                  aria-label={isConfirming ? 'Confirm delete' : 'Delete entry'}
                  className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                    isConfirming
                      ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                      : 'text-text-secondary/60 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                  title={isConfirming ? 'Click again to confirm' : 'Delete entry'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
