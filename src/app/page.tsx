'use client';

// React/Next.js
import { useState, useEffect, useRef } from 'react';

// External libraries
import { format } from 'date-fns';

// Store/State management
import { useWorkoutStore } from '@/store/workout-store';

// Components
import { Calculator } from '@/components/Calculator';
import { KcalInput } from '@/components/KcalInput';
import { LevelCard } from '@/components/LevelCard';
import { SessionsCard } from '@/components/SessionsCard';
import { DailyGoals } from '@/components/DailyGoals';
import { WeeklyChart } from '@/components/WeeklyChart';
import { AchievementsGrid, AchievementPopup } from '@/components/Achievements';
import { StatsCards } from '@/components/StatsCards';
import { NowPlaying } from '@/components/NowPlaying';

// Utils/Helpers
import { getSpotifyAuthUrl } from '@/lib/spotify';

// Icons
import { Dumbbell, Settings } from 'lucide-react';

// Types/Interfaces
import { ACHIEVEMENTS } from '@/data/achievements';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('Tony Nguyen Le');
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    workouts,
    stats,
    dailyGoal,
    newAchievements,
    addWorkout,
    setDailyGoal,
    clearNewAchievements,
    getTodayStats,
  } = useWorkoutStore();

  // Handle hydration and load Spotify token + user name
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      setSpotifyToken(token);
    }
    const savedName = localStorage.getItem('user_name');
    if (savedName) {
      setUserName(savedName);
    }
    const savedImage = localStorage.getItem('profile_image');
    if (savedImage) {
      setProfileImage(savedImage);
    }
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

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        localStorage.setItem('profile_image', base64);
      };
      reader.readAsDataURL(file);
    }
  };

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
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-text-primary">Workout Tracker</h1>
              <p className="hidden sm:block text-sm text-text-secondary">
                Let's crush it today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              {isEditingName ? (
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onBlur={() => {
                    setIsEditingName(false);
                    localStorage.setItem('user_name', userName);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingName(false);
                      localStorage.setItem('user_name', userName);
                    }
                  }}
                  autoFocus
                  className="text-sm sm:text-lg font-medium text-text-primary bg-transparent border-b border-white/30 outline-none text-right"
                />
              ) : (
                <p
                  onClick={() => setIsEditingName(true)}
                  className="text-sm sm:text-lg font-medium text-text-primary cursor-pointer hover:text-white/80"
                >
                  {userName}
                </p>
              )}
              <p className="hidden sm:block text-sm text-text-secondary">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 overflow-hidden hover:border-white/40 transition-colors flex-shrink-0"
              title="Click to change profile picture"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-text-primary font-medium text-sm">
                  {getInitials(userName)}
                </div>
              )}
            </button>
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
            <SessionsCard
              totalSessions={stats.totalWorkouts}
              totalReps={stats.totalReps}
            />
            <DailyGoals
              currentReps={todayStats.reps}
              goalReps={dailyGoal.reps}
              currentKcal={todayStats.activeKcal}
              goalKcal={dailyGoal.activeKcal}
              onGoalChange={(reps, kcal) => setDailyGoal({ reps, activeKcal: kcal })}
            />
            <NowPlaying
              accessToken={spotifyToken}
              onConnect={async () => {
                const url = await getSpotifyAuthUrl();
                window.location.href = url;
              }}
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
