import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, parseISO, differenceInDays } from 'date-fns';

import { ACHIEVEMENTS } from '@/data/achievements';

import type { WorkoutEntry, UserStats, DailyGoal } from '@/types/workout';
import {
  XP_PER_REP,
  XP_PER_ACTIVE_KCAL,
  calculateLevel,
} from '@/types/workout';

interface WorkoutStore {
  // Data
  workouts: WorkoutEntry[];
  stats: UserStats;
  dailyGoal: DailyGoal;
  newAchievements: string[]; // For showing unlock animations

  // Actions
  addWorkout: (workout: Omit<WorkoutEntry, 'id' | 'timestamp'>) => void;
  deleteWorkout: (id: string) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  clearNewAchievements: () => void;
  getWorkoutsForDate: (date: string) => WorkoutEntry[];
  getWorkoutsForWeek: () => WorkoutEntry[];
  getTodayStats: () => { reps: number; activeKcal: number; totalKcal: number };
}

const DEFAULT_STATS: UserStats = {
  totalXP: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  totalReps: 0,
  totalActiveKcal: 0,
  totalWorkouts: 0,
  unlockedAchievements: [],
  lastWorkoutDate: null,
};

const DEFAULT_GOAL: DailyGoal = {
  reps: 400,
  activeKcal: 300,
};

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      workouts: [],
      stats: DEFAULT_STATS,
      dailyGoal: DEFAULT_GOAL,
      newAchievements: [],

      addWorkout: (workoutData) => {
        const id = crypto.randomUUID();
        const timestamp = Date.now();
        const workout: WorkoutEntry = { ...workoutData, id, timestamp };

        set((state) => {
          const newWorkouts = [...state.workouts, workout];

          // Calculate XP earned (simple: 1 XP per rep, 0.5 per kcal)
          const xpEarned = Math.round(
            workout.reps * XP_PER_REP +
            workout.activeKcal * XP_PER_ACTIVE_KCAL
          );

          const today = format(new Date(), 'yyyy-MM-dd');

          // Count unique workout days
          const existingDates = new Set(state.workouts.map(w => w.date));
          const isNewDay = !existingDates.has(today);

          const newStats: UserStats = {
            ...state.stats,
            totalXP: state.stats.totalXP + xpEarned,
            level: calculateLevel(state.stats.totalXP + xpEarned),
            totalReps: state.stats.totalReps + workout.reps,
            totalActiveKcal: state.stats.totalActiveKcal + workout.activeKcal,
            totalWorkouts: isNewDay ? state.stats.totalWorkouts + 1 : state.stats.totalWorkouts,
            lastWorkoutDate: today,
          };

          // Check for new achievements
          const newUnlocked: string[] = [];
          for (const achievement of ACHIEVEMENTS) {
            if (
              !state.stats.unlockedAchievements.includes(achievement.id) &&
              achievement.requirement(newStats)
            ) {
              newUnlocked.push(achievement.id);
              newStats.totalXP += achievement.xpReward;
              newStats.level = calculateLevel(newStats.totalXP);
            }
          }

          newStats.unlockedAchievements = [
            ...state.stats.unlockedAchievements,
            ...newUnlocked,
          ];

          return {
            workouts: newWorkouts,
            stats: newStats,
            newAchievements: [...state.newAchievements, ...newUnlocked],
          };
        });
      },

      deleteWorkout: (id) => {
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        }));
      },

      setDailyGoal: (goal) => {
        set({ dailyGoal: goal });
      },

      clearNewAchievements: () => {
        set({ newAchievements: [] });
      },

      getWorkoutsForDate: (date) => {
        return get().workouts.filter((w) => w.date === date);
      },

      getWorkoutsForWeek: () => {
        const now = new Date();
        return get().workouts.filter((w) => {
          const workoutDate = parseISO(w.date);
          return differenceInDays(now, workoutDate) <= 7;
        });
      },

      getTodayStats: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayWorkouts = get().workouts.filter((w) => w.date === today);

        return {
          reps: todayWorkouts.reduce((sum, w) => sum + w.reps, 0),
          activeKcal: todayWorkouts.reduce((sum, w) => sum + w.activeKcal, 0),
          totalKcal: todayWorkouts.reduce((sum, w) => sum + w.totalKcal, 0),
        };
      },
    }),
    {
      name: 'workout-tracker-storage',
    }
  )
);
