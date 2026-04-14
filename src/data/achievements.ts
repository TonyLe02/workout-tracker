import type { Achievement } from '@/types/workout';

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: 'streak-3',
    name: 'On Fire',
    description: '3 day workout streak',
    icon: '🔥',
    requirement: (stats) => stats.currentStreak >= 3,
    xpReward: 50,
    tier: 'bronze',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7 day workout streak',
    icon: '⚡',
    requirement: (stats) => stats.currentStreak >= 7,
    xpReward: 150,
    tier: 'silver',
  },
  {
    id: 'streak-30',
    name: 'Monthly Monster',
    description: '30 day workout streak',
    icon: '💪',
    requirement: (stats) => stats.currentStreak >= 30,
    xpReward: 500,
    tier: 'gold',
  },
  {
    id: 'streak-100',
    name: 'Unstoppable',
    description: '100 day workout streak',
    icon: '👑',
    requirement: (stats) => stats.currentStreak >= 100,
    xpReward: 2000,
    tier: 'diamond',
  },

  // Rep achievements
  {
    id: 'reps-100',
    name: 'Century',
    description: 'Complete 100 total reps',
    icon: '💯',
    requirement: (stats) => stats.totalReps >= 100,
    xpReward: 25,
    tier: 'bronze',
  },
  {
    id: 'reps-1000',
    name: 'Thousand Strong',
    description: 'Complete 1,000 total reps',
    icon: '🏋️',
    requirement: (stats) => stats.totalReps >= 1000,
    xpReward: 100,
    tier: 'silver',
  },
  {
    id: 'reps-10000',
    name: 'Rep Machine',
    description: 'Complete 10,000 total reps',
    icon: '🤖',
    requirement: (stats) => stats.totalReps >= 10000,
    xpReward: 500,
    tier: 'gold',
  },
  {
    id: 'reps-100000',
    name: 'Legendary',
    description: 'Complete 100,000 total reps',
    icon: '🌟',
    requirement: (stats) => stats.totalReps >= 100000,
    xpReward: 5000,
    tier: 'diamond',
  },

  // Calorie achievements
  {
    id: 'kcal-1000',
    name: 'Burner',
    description: 'Burn 1,000 active kcal',
    icon: '🔥',
    requirement: (stats) => stats.totalActiveKcal >= 1000,
    xpReward: 50,
    tier: 'bronze',
  },
  {
    id: 'kcal-10000',
    name: 'Inferno',
    description: 'Burn 10,000 active kcal',
    icon: '☄️',
    requirement: (stats) => stats.totalActiveKcal >= 10000,
    xpReward: 250,
    tier: 'silver',
  },
  {
    id: 'kcal-50000',
    name: 'Furnace',
    description: 'Burn 50,000 active kcal',
    icon: '🌋',
    requirement: (stats) => stats.totalActiveKcal >= 50000,
    xpReward: 1000,
    tier: 'gold',
  },

  // Workout count achievements
  {
    id: 'workouts-10',
    name: 'Getting Started',
    description: 'Log 10 workouts',
    icon: '📝',
    requirement: (stats) => stats.totalWorkouts >= 10,
    xpReward: 30,
    tier: 'bronze',
  },
  {
    id: 'workouts-50',
    name: 'Committed',
    description: 'Log 50 workouts',
    icon: '📊',
    requirement: (stats) => stats.totalWorkouts >= 50,
    xpReward: 150,
    tier: 'silver',
  },
  {
    id: 'workouts-200',
    name: 'Veteran',
    description: 'Log 200 workouts',
    icon: '🎖️',
    requirement: (stats) => stats.totalWorkouts >= 200,
    xpReward: 500,
    tier: 'gold',
  },

  // Level achievements
  {
    id: 'level-10',
    name: 'Double Digits',
    description: 'Reach level 10',
    icon: '🔟',
    requirement: (stats) => stats.level >= 10,
    xpReward: 100,
    tier: 'bronze',
  },
  {
    id: 'level-25',
    name: 'Quarter Century',
    description: 'Reach level 25',
    icon: '🏆',
    requirement: (stats) => stats.level >= 25,
    xpReward: 300,
    tier: 'silver',
  },
  {
    id: 'level-50',
    name: 'Half Century',
    description: 'Reach level 50',
    icon: '⭐',
    requirement: (stats) => stats.level >= 50,
    xpReward: 750,
    tier: 'gold',
  },
  {
    id: 'level-100',
    name: 'Centurion',
    description: 'Reach level 100',
    icon: '💎',
    requirement: (stats) => stats.level >= 100,
    xpReward: 2500,
    tier: 'diamond',
  },

  // First time achievements
  {
    id: 'first-workout',
    name: 'First Step',
    description: 'Log your first workout',
    icon: '🎯',
    requirement: (stats) => stats.totalWorkouts >= 1,
    xpReward: 10,
    tier: 'bronze',
  },
];

export const TIER_COLORS = {
  bronze: {
    bg: 'from-amber-700 to-amber-900',
    border: 'border-amber-600',
    text: 'text-amber-400',
  },
  silver: {
    bg: 'from-slate-400 to-slate-600',
    border: 'border-slate-400',
    text: 'text-slate-300',
  },
  gold: {
    bg: 'from-yellow-500 to-yellow-700',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
  },
  diamond: {
    bg: 'from-cyan-400 to-purple-600',
    border: 'border-cyan-400',
    text: 'text-cyan-300',
  },
};
