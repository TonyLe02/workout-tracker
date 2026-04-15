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
  hydrateData: (data: { workouts: WorkoutEntry[]; dailyGoal: DailyGoal }) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  clearNewAchievements: () => void;
  getWorkoutsForDate: (date: string) => WorkoutEntry[];
  getWorkoutsForWeek: () => WorkoutEntry[];
  getTodayStats: () => { reps: number; activeKcal: number; totalKcal: number; kcal: number };
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

function calculateStatsFromWorkouts(workouts: WorkoutEntry[]): UserStats {
  const totalReps = workouts.reduce((sum, workout) => sum + workout.reps, 0);

  // Group workouts by date and calculate kcal per day using max(activeSum, latestTotal)
  const workoutsByDate: Record<string, WorkoutEntry[]> = {};
  for (const workout of workouts) {
    if (!workoutsByDate[workout.date]) workoutsByDate[workout.date] = [];
    workoutsByDate[workout.date].push(workout);
  }

  let totalKcal = 0;
  for (const date of Object.keys(workoutsByDate)) {
    const dayWorkouts = workoutsByDate[date];
    // Get latest activeKcal for the day (upsert behavior, not accumulative)
    const latestActive = dayWorkouts
      .filter((w) => w.activeKcal > 0)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.activeKcal || 0;
    const latestTotal = dayWorkouts
      .filter((w) => w.totalKcal > 0)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.totalKcal || 0;
    totalKcal += Math.max(latestActive, latestTotal);
  }

  const totalXP = Math.round(
    totalReps * XP_PER_REP + totalKcal * XP_PER_ACTIVE_KCAL
  );
  const workoutDates = new Set(workouts.map((workout) => workout.date));
  const lastWorkoutDate =
    workouts.length > 0
      ? workouts.reduce(
          (latestDate, workout) =>
            workout.date > latestDate ? workout.date : latestDate,
          workouts[0].date
        )
      : null;

  const computedStats: UserStats = {
    ...DEFAULT_STATS,
    totalXP,
    level: calculateLevel(totalXP),
    totalReps,
    totalActiveKcal: totalKcal, // Now stores the calculated total (max of active vs end-of-day)
    totalWorkouts: workoutDates.size,
    lastWorkoutDate,
  };

  const unlockedAchievements: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (achievement.requirement(computedStats)) {
      unlockedAchievements.push(achievement.id);
      computedStats.totalXP += achievement.xpReward;
      computedStats.level = calculateLevel(computedStats.totalXP);
    }
  }

  computedStats.unlockedAchievements = unlockedAchievements;

  return computedStats;
}

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
          const newStats = calculateStatsFromWorkouts(newWorkouts);
          const newUnlocked = newStats.unlockedAchievements.filter(
            (achievementId) =>
              !state.stats.unlockedAchievements.includes(achievementId)
          );

          return {
            workouts: newWorkouts,
            stats: newStats,
            newAchievements: [...state.newAchievements, ...newUnlocked],
          };
        });
      },

      deleteWorkout: (id) => {
        set((state) => {
          const workouts = state.workouts.filter((workout) => workout.id !== id);

          return {
            workouts,
            stats: calculateStatsFromWorkouts(workouts),
            newAchievements: [],
          };
        });
      },

      hydrateData: ({ workouts, dailyGoal }) => {
        set({
          workouts,
          dailyGoal,
          stats: calculateStatsFromWorkouts(workouts),
          newAchievements: [],
        });
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

        // Get the latest activeKcal entry for today (upsert behavior, not accumulative)
        const latestActiveKcal = todayWorkouts
          .filter((w) => w.activeKcal > 0)
          .sort((a, b) => b.timestamp - a.timestamp)[0]?.activeKcal || 0;
        // Get the latest totalKcal entry for today (end of day correction)
        const latestTotalKcal = todayWorkouts
          .filter((w) => w.totalKcal > 0)
          .sort((a, b) => b.timestamp - a.timestamp)[0]?.totalKcal || 0;

        // Total kcal is the max of latest active vs the end-of-day total
        const kcal = Math.max(latestActiveKcal, latestTotalKcal);

        return {
          reps: todayWorkouts.reduce((sum, w) => sum + w.reps, 0),
          activeKcal: latestActiveKcal,
          totalKcal: latestTotalKcal,
          kcal, // The display value: max(activeKcal, totalKcal)
        };
      },
    }),
    {
      name: 'workout-tracker-storage',
    }
  )
);
