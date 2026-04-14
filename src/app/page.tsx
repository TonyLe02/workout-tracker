'use client';

// React/Next.js
import { useState, useEffect } from 'react';

// External libraries
import { format } from 'date-fns';

// Store/State management
import { useWorkoutStore } from '@/store/workout-store';

// Components
import { Calculator } from '@/components/Calculator';
import { KcalInput } from '@/components/KcalInput';
import { LevelCard } from '@/components/LevelCard';
import { StreakCard } from '@/components/StreakCard';
import { DailyGoals } from '@/components/DailyGoals';
import { WeeklyChart } from '@/components/WeeklyChart';
import { AchievementsGrid, AchievementPopup } from '@/components/Achievements';
import { StatsCards } from '@/components/StatsCards';

// Icons
import { Dumbbell, Settings } from 'lucide-react';

// Types/Interfaces
import { ACHIEVEMENTS } from '@/data/achievements';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [previousLevel, setPreviousLevel] = useState(1);

  const {
    workouts,
    stats,
    dailyGoal,
    newAchievements,
    addWorkout,
    clearNewAchievements,
    getTodayStats,
  } = useWorkoutStore();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for level up
  useEffect(() => {
    if (mounted && stats.level > previousLevel) {
      setPreviousLevel(stats.level);
    }
  }, [stats.level, previousLevel, mounted]);

  // Show achievement popup when new achievements are unlocked
  useEffect(() => {
    if (mounted && newAchievements.length > 0) {
      setShowAchievementPopup(true);
      setCurrentPopupIndex(0);
    }
  }, [newAchievements, mounted]);

  const handleCloseAchievementPopup = () => {
    if (currentPopupIndex < newAchievements.length - 1) {
      setCurrentPopupIndex((prev) => prev + 1);
    } else {
      setShowAchievementPopup(false);
      clearNewAchievements();
    }
  };

  const handleAddReps = (reps: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    addWorkout({
      date: today,
      reps,
      activeKcal: 0,
      totalKcal: 0,
    });
  };

  const handleAddKcal = (activeKcal: number, totalKcal: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    addWorkout({
      date: today,
      reps: 0,
      activeKcal,
      totalKcal,
    });
  };

  // Get current achievement for popup
  const currentAchievement = newAchievements[currentPopupIndex]
    ? ACHIEVEMENTS.find((a) => a.id === newAchievements[currentPopupIndex])
    : null;

  // Don't render until mounted (prevents hydration issues)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const todayStats = getTodayStats();
  const isLevelUp = stats.level > previousLevel;

  return (
    <main className="min-h-screen bg-background">
      {/* Background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/background.jpg)' }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-background/50 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Workout Tracker</h1>
              <p className="text-sm text-text-secondary">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <Calculator onSubmit={handleAddReps} />
            <KcalInput onSubmit={handleAddKcal} />
          </div>

          {/* Middle Column - Progress */}
          <div className="space-y-6">
            <LevelCard
              level={stats.level}
              totalXP={stats.totalXP}
              isLevelUp={isLevelUp}
            />
            <StreakCard
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
            />
            <DailyGoals
              currentReps={todayStats.reps}
              goalReps={dailyGoal.reps}
              currentKcal={todayStats.activeKcal}
              goalKcal={dailyGoal.activeKcal}
            />
          </div>

          {/* Right Column - Charts */}
          <div className="space-y-6">
            <WeeklyChart workouts={workouts} />
            <StatsCards
              totalReps={stats.totalReps}
              totalActiveKcal={stats.totalActiveKcal}
              totalWorkouts={stats.totalWorkouts}
            />
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-8">
          <AchievementsGrid
            unlockedIds={stats.unlockedAchievements}
            newAchievementIds={newAchievements}
          />
        </div>
      </div>

      {/* Achievement Popup */}
      {showAchievementPopup && currentAchievement && (
        <AchievementPopup
          achievement={currentAchievement}
          onClose={handleCloseAchievementPopup}
        />
      )}
    </main>
  );
}
