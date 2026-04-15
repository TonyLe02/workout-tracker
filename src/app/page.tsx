'use client';

// React/Next.js
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

// External libraries
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

// Store/State management
import { useWorkoutStore } from '@/store/workout-store';

// Components
import { AchievementsGrid, AchievementPopup } from '@/components/Achievements';
import { Calculator } from '@/components/Calculator';
import { DailyGoals } from '@/components/DailyGoals';
import { KcalInput } from '@/components/KcalInput';
import { LevelCard } from '@/components/LevelCard';
import { NowPlaying } from '@/components/NowPlaying';
import { SessionsCard } from '@/components/SessionsCard';
import { StatsCards } from '@/components/StatsCards';
import { WeeklyChart } from '@/components/WeeklyChart';

// Utils/Helpers
import { secureGet } from '@/lib/secure-storage';
import { getSpotifyAuthUrl } from '@/lib/spotify';
import {
  fetchProfile,
  fetchWorkouts,
  getCurrentUser,
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithGoogle,
  signOutFromSupabase,
  upsertProfile,
  upsertWorkouts,
} from '@/lib/supabase';

// Types/Interfaces
import { ACHIEVEMENTS } from '@/data/achievements';
import type { DailyGoal, WorkoutEntry } from '@/types/workout';

// Icons
import { Cloud, CloudCheck, Dumbbell, Loader2, LogOut } from 'lucide-react';

type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return initials || 'U';
}

function mergeWorkouts(
  localWorkouts: WorkoutEntry[],
  remoteWorkouts: WorkoutEntry[]
) {
  const workoutMap = new Map<string, WorkoutEntry>();

  for (const workout of remoteWorkouts) {
    workoutMap.set(workout.id, workout);
  }

  for (const workout of localWorkouts) {
    workoutMap.set(workout.id, workout);
  }

  return Array.from(workoutMap.values()).sort(
    (leftWorkout, rightWorkout) => leftWorkout.timestamp - rightWorkout.timestamp
  );
}

function getUserMetadataName(user: User | null) {
  if (!user) {
    return '';
  }

  if (typeof user.user_metadata.full_name === 'string') {
    return user.user_metadata.full_name;
  }

  if (typeof user.user_metadata.name === 'string') {
    return user.user_metadata.name;
  }

  return '';
}

function getUserMetadataAvatar(user: User | null) {
  if (!user) {
    return null;
  }

  if (typeof user.user_metadata.avatar_url === 'string') {
    return user.user_metadata.avatar_url;
  }

  if (typeof user.user_metadata.picture === 'string') {
    return user.user_metadata.picture;
  }

  return null;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasHydratedRemoteDataRef = useRef(false);
  const isManualSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  const {
    workouts,
    stats,
    dailyGoal,
    newAchievements,
    addWorkout,
    clearNewAchievements,
    getTodayStats,
    hydrateData,
    setDailyGoal,
  } = useWorkoutStore();

  useEffect(() => {
    setMounted(true);

    const localName = localStorage.getItem('user_name')?.trim() ?? '';
    const localProfileImage = localStorage.getItem('profile_image');

    // Load encrypted Spotify token
    secureGet('spotify_access_token').then((token) => {
      if (token) {
        setSpotifyToken(token);
      }
    });

    if (localName) {
      setUserName(localName);
      setWelcomeName(localName);
    }

    if (localProfileImage) {
      setProfileImage(localProfileImage);
    }

    if (!isSupabaseConfigured) {
      setShowWelcome(!localName);
      return;
    }

    let isActive = true;

    async function initializeAuth() {
      try {
        const currentUser = await getCurrentUser();

        if (!isActive) {
          return;
        }

        setAuthUser(currentUser);

        if (!localName) {
          setShowWelcome(true);
        }
      } finally {
        if (isActive) {
          setAuthReady(true);
        }
      }
    }

    initializeAuth();

    const unsubscribe = onAuthStateChange((_event, session) => {
      if (!isActive) {
        return;
      }

      const nextUser = session?.user ?? null;
      setAuthUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setSyncStatus('local');
        setShowWelcome(true);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (mounted && stats.level > previousLevel) {
      setPreviousLevel(stats.level);
    }
  }, [mounted, previousLevel, stats.level]);

  useEffect(() => {
    if (mounted && newAchievements.length > 0) {
      setShowAchievementPopup(true);
      setCurrentPopupIndex(0);
    }
  }, [mounted, newAchievements]);

  useEffect(() => {
    if (!mounted || !authReady) {
      return;
    }

    if (!authUser) {
      hasHydratedRemoteDataRef.current = false;
      setSyncStatus('local');
      return;
    }

    let isCancelled = false;
    const currentUser = authUser;

    async function hydrateRemoteData() {
      setSyncStatus('syncing');
      hasHydratedRemoteDataRef.current = false;

      try {
        const [remoteProfile, remoteWorkouts] = await Promise.all([
          fetchProfile(currentUser.id),
          fetchWorkouts(currentUser.id),
        ]);

        if (isCancelled) {
          return;
        }

        const localState = useWorkoutStore.getState();
        const localName = localStorage.getItem('user_name')?.trim() ?? '';
        const localProfileImage = localStorage.getItem('profile_image');
        const mergedWorkouts = mergeWorkouts(localState.workouts, remoteWorkouts);
        const mergedDailyGoal: DailyGoal = {
          reps: remoteProfile?.daily_goal_reps ?? localState.dailyGoal.reps,
          activeKcal:
            remoteProfile?.daily_goal_active_kcal ?? localState.dailyGoal.activeKcal,
        };
        const mergedName = (
          remoteProfile?.name?.trim() ||
          localName ||
          getUserMetadataName(currentUser)
        ).trim();
        const mergedProfileImage =
          remoteProfile?.avatar_url ||
          localProfileImage ||
          getUserMetadataAvatar(currentUser);

        hydrateData({
          workouts: mergedWorkouts,
          dailyGoal: mergedDailyGoal,
        });

        setUserName(mergedName);
        setWelcomeName(mergedName);
        setProfileImage(mergedProfileImage);
        setShowWelcome(!mergedName);

        if (mergedName) {
          localStorage.setItem('user_name', mergedName);
        } else {
          localStorage.removeItem('user_name');
        }

        if (mergedProfileImage) {
          localStorage.setItem('profile_image', mergedProfileImage);
        } else {
          localStorage.removeItem('profile_image');
        }

        await Promise.all([
          upsertProfile(currentUser.id, {
            name: mergedName,
            avatarUrl: mergedProfileImage,
            dailyGoal: mergedDailyGoal,
          }),
          upsertWorkouts(currentUser.id, mergedWorkouts),
        ]);

        if (isCancelled) {
          return;
        }

        hasHydratedRemoteDataRef.current = true;
        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync workout data from Supabase:', error);

        if (!isCancelled) {
          hasHydratedRemoteDataRef.current = true;
          setSyncStatus('error');
        }
      }
    }

    hydrateRemoteData();

    return () => {
      isCancelled = true;
    };
  }, [authReady, authUser, hydrateData, mounted]);

  useEffect(() => {
    if (!mounted || !authReady || !authUser || !hasHydratedRemoteDataRef.current) {
      return;
    }

    // Skip auto-sync if manual refetch is in progress
    if (isManualSyncingRef.current) {
      return;
    }

    const syncTimeout = window.setTimeout(async () => {
      // Skip if manual sync in progress or synced very recently
      if (isManualSyncingRef.current || Date.now() - lastSyncTimeRef.current < 2000) {
        return;
      }

      setSyncStatus('syncing');

      try {
        await Promise.all([
          upsertProfile(authUser.id, {
            name: userName.trim(),
            avatarUrl: profileImage,
            dailyGoal,
          }),
          upsertWorkouts(authUser.id, workouts),
        ]);

        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to save workout data to Supabase:', error);
        setSyncStatus('error');
      }
    }, 500);

    return () => {
      window.clearTimeout(syncTimeout);
    };
  }, [
    authReady,
    authUser,
    dailyGoal,
    mounted,
    profileImage,
    userName,
    workouts,
  ]);

  const currentAchievement = newAchievements[currentPopupIndex]
    ? ACHIEVEMENTS.find(
        (achievement) => achievement.id === newAchievements[currentPopupIndex]
      )
    : null;

  const handleCloseAchievementPopup = () => {
    if (currentPopupIndex < newAchievements.length - 1) {
      setCurrentPopupIndex((previousIndex) => previousIndex + 1);
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Image = reader.result as string;
      setProfileImage(base64Image);
      localStorage.setItem('profile_image', base64Image);
    };

    reader.readAsDataURL(file);
  };

  const handleWelcomeSubmit = () => {
    const trimmedName = welcomeName.trim();

    if (!trimmedName) {
      return;
    }

    setUserName(trimmedName);
    localStorage.setItem('user_name', trimmedName);
    setShowWelcome(false);
  };

  const handleSaveUserName = () => {
    const trimmedName = userName.trim();

    setUserName(trimmedName);
    setIsEditingName(false);

    if (trimmedName) {
      localStorage.setItem('user_name', trimmedName);
      setShowWelcome(false);
      return;
    }

    localStorage.removeItem('user_name');
    setShowWelcome(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to start Google sign-in:', error);
      setSyncStatus('error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutFromSupabase();
      setAuthUser(null);
      setSyncStatus('local');
    } catch (error) {
      console.error('Failed to sign out of Supabase:', error);
      setSyncStatus('error');
    }
  };

  const handleManualRefetch = async () => {
    if (!authUser || isManualSyncingRef.current) return;

    isManualSyncingRef.current = true;
    setSyncStatus('syncing');

    try {
      const [remoteProfile, remoteWorkouts] = await Promise.all([
        fetchProfile(authUser.id),
        fetchWorkouts(authUser.id),
      ]);

      const localState = useWorkoutStore.getState();
      const mergedWorkouts = mergeWorkouts(localState.workouts, remoteWorkouts);
      const mergedDailyGoal: DailyGoal = {
        reps: remoteProfile?.daily_goal_reps ?? localState.dailyGoal.reps,
        activeKcal:
          remoteProfile?.daily_goal_active_kcal ?? localState.dailyGoal.activeKcal,
      };

      hydrateData({
        workouts: mergedWorkouts,
        dailyGoal: mergedDailyGoal,
      });

      lastSyncTimeRef.current = Date.now();
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to refetch data from Supabase:', error);
      setSyncStatus('error');
    } finally {
      // Delay clearing the flag so the auto-sync useEffect skips
      setTimeout(() => {
        isManualSyncingRef.current = false;
      }, 1000);
    }
  };

  if (!mounted || !authReady) {
    return (
      <main className="min-h-screen bg-background">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: 'url(/background.jpg)' }}
        />
        <div className="fixed inset-0 bg-background/50 pointer-events-none" />
        <div className="relative min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your data...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (showWelcome) {
    return (
      <main className="min-h-screen bg-background">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: 'url(/background.jpg)' }}
        />
        <div className="fixed inset-0 bg-background/50 pointer-events-none" />

        <div className="relative min-h-screen flex items-center justify-center px-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Welcome to Workout Tracker
            </h1>
            <p className="text-text-secondary mb-6">
              Enter your name to get started. You can sync with Google later to
              access your data across devices.
            </p>

            <input
              type="text"
              value={welcomeName}
              onChange={(event) => setWelcomeName(event.target.value)}
              onKeyDown={(event) =>
                event.key === 'Enter' && handleWelcomeSubmit()
              }
              placeholder="Enter your name"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-text-primary placeholder-text-secondary outline-none focus:border-white/40 text-center text-lg mb-4"
            />

            <button
              onClick={handleWelcomeSubmit}
              disabled={!welcomeName.trim()}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                welcomeName.trim()
                  ? 'bg-white text-background hover:bg-white/90'
                  : 'bg-white/20 text-text-secondary cursor-not-allowed'
              }`}
            >
              Let&apos;s Go
            </button>
          </div>
        </div>
      </main>
    );
  }

  const todayStats = getTodayStats();
  const isLevelUp = stats.level > previousLevel;

  return (
    <main className="min-h-screen bg-background">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/background.jpg)' }}
      />
      <div className="fixed inset-0 bg-background/50 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 py-8">
        <header className="flex items-end justify-between mb-8 gap-4">
          <div className="flex items-end">
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              Let&apos;s crush it!
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="text-right flex flex-col justify-center">
              {isEditingName ? (
                <input
                  type="text"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  onBlur={handleSaveUserName}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSaveUserName();
                    }
                  }}
                  autoFocus
                  className="text-sm sm:text-lg font-medium text-text-primary bg-transparent border-b border-white/30 outline-none text-right"
                />
              ) : (
                <p
                  onClick={() => setIsEditingName(true)}
                  className="text-sm sm:text-lg font-medium text-text-primary cursor-pointer hover:text-white/80 leading-tight"
                >
                  {userName}
                </p>
              )}

              <p className="text-xs sm:text-sm text-text-secondary leading-tight">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>

              <div className="flex items-center justify-end gap-1.5 sm:gap-2 whitespace-nowrap">
                {syncStatus !== 'local' && (
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wide inline-flex items-center gap-1">
                    {syncStatus === 'syncing' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-text-secondary" />
                        <span className="text-text-secondary">Syncing</span>
                      </>
                    ) : syncStatus === 'synced' ? (
                      <button
                        onClick={handleManualRefetch}
                        className="inline-flex items-center gap-1 hover:opacity-70 transition-opacity"
                        title="Click to refresh data from cloud"
                      >
                        <CloudCheck className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Synced</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleManualRefetch}
                        className="inline-flex items-center gap-1 hover:opacity-70 transition-opacity"
                        title="Click to retry sync"
                      >
                        <span className="text-red-400">Sync error</span>
                      </button>
                    )}
                  </span>
                )}

                {isSupabaseConfigured &&
                  (authUser ? (
                    <button
                      onClick={handleSignOut}
                      className="text-[10px] sm:text-[11px] uppercase tracking-wide text-white/70 hover:text-red-400 inline-flex items-center gap-1 transition-colors"
                      title="Sign out of Google sync"
                    >
                      <LogOut className="w-3 h-3" />
                      Sign out
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleSignIn}
                      className="text-[10px] sm:text-[11px] uppercase tracking-wide text-white/80 hover:text-white inline-flex items-center gap-1"
                    >
                      <Cloud className="w-3 h-3" />
                      Sync
                    </button>
                  ))}
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-white/20 overflow-hidden hover:border-white/40 transition-colors flex-shrink-0"
              title="Click to change profile picture"
            >
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-text-primary font-medium text-sm sm:text-base">
                  {getInitials(userName)}
                </div>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Calculator onSubmit={handleAddReps} />
            <KcalInput onSubmit={handleAddKcal} />
          </div>

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
              currentKcal={todayStats.kcal}
              goalKcal={dailyGoal.activeKcal}
              onGoalChange={(reps, kcal) =>
                setDailyGoal({ reps, activeKcal: kcal })
              }
            />
            <NowPlaying
              accessToken={spotifyToken}
              onConnect={async () => {
                const url = await getSpotifyAuthUrl();
                window.location.href = url;
              }}
            />
          </div>

          <div className="space-y-6">
            <WeeklyChart workouts={workouts} />
            <StatsCards
              totalReps={stats.totalReps}
              totalActiveKcal={stats.totalActiveKcal}
              totalWorkouts={stats.totalWorkouts}
            />
          </div>
        </div>

        <div className="mt-8">
          <AchievementsGrid
            unlockedIds={stats.unlockedAchievements}
            newAchievementIds={newAchievements}
          />
        </div>
      </div>

      {showAchievementPopup && currentAchievement && (
        <AchievementPopup
          achievement={currentAchievement}
          onClose={handleCloseAchievementPopup}
        />
      )}
    </main>
  );
}
