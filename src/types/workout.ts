export interface WorkoutEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  reps: number;
  activeKcal: number;
  totalKcal: number;
  exerciseType?: string;
  timestamp: number;
}

export interface UserStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalReps: number;
  totalActiveKcal: number;
  totalWorkouts: number;
  unlockedAchievements: string[];
  lastWorkoutDate: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (stats: UserStats) => boolean;
  xpReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface DailyGoal {
  reps: number;
  activeKcal: number;
}

// XP calculation constants
export const XP_PER_REP = 1;
export const XP_PER_ACTIVE_KCAL = 0.5;
export const XP_STREAK_MULTIPLIER = 0.1; // 10% bonus per streak day (max 100%)
export const XP_PER_LEVEL = 100; // XP needed to level up increases each level

export const EXERCISE_TYPES = [
  'Push-ups',
  'Pull-ups',
  'Squats',
  'Lunges',
  'Burpees',
  'Sit-ups',
  'Plank (seconds)',
  'Jumping Jacks',
  'Mountain Climbers',
  'Dips',
  'Other',
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

// Level titles for fun
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Rookie',
  5: 'Beginner',
  10: 'Regular',
  15: 'Dedicated',
  20: 'Athlete',
  25: 'Beast',
  30: 'Champion',
  40: 'Legend',
  50: 'Immortal',
  75: 'Demigod',
  100: 'Olympian',
};

export function getLevelTitle(level: number): string {
  const levels = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const lvl of levels) {
    if (level >= lvl) {
      return LEVEL_TITLES[lvl];
    }
  }
  return 'Rookie';
}

export function calculateLevel(totalXP: number): number {
  // Each level requires progressively more XP
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, Level 4: 600 XP, etc.
  let level = 1;
  let xpNeeded = 0;
  
  while (totalXP >= xpNeeded + level * XP_PER_LEVEL) {
    xpNeeded += level * XP_PER_LEVEL;
    level++;
  }
  
  return level;
}

export function getXPForNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function getCurrentLevelXP(totalXP: number, level: number): number {
  let xpUsed = 0;
  for (let i = 1; i < level; i++) {
    xpUsed += i * XP_PER_LEVEL;
  }
  return totalXP - xpUsed;
}
