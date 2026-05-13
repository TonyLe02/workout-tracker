'use client';

// React/Next.js
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

// External libraries
import { format, subDays } from 'date-fns';
import type { User } from '@supabase/supabase-js';

// Store/State management
import { useWorkoutStore } from '@/store/workout-store';

// Components
import { AchievementsGrid, AchievementPopup } from '@/components/Achievements';
import { Calculator } from '@/components/Calculator';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { DailyGoals } from '@/components/DailyGoals';
import { EmptyStateHero } from '@/components/EmptyStateHero';
import { HeatmapCard } from '@/components/HeatmapCard';
import { KcalInput } from '@/components/KcalInput';
import { KeyboardHelp } from '@/components/KeyboardHelp';
import { LevelCard } from '@/components/LevelCard';
import { MobileQuickAdd } from '@/components/MobileQuickAdd';
import { NowPlaying } from '@/components/NowPlaying';
import { PersonalBests } from '@/components/PersonalBests';
import { StatsCards } from '@/components/StatsCards';
import { StickyMobileHeader } from '@/components/StickyMobileHeader';
import { Toaster, showToast } from '@/components/Toaster';
import { TodayLog } from '@/components/TodayLog';
import { TopTracks } from '@/components/TopTracks';
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
import { XP_PER_REP } from '@/types/workout';
import type { DailyGoal, WorkoutEntry } from '@/types/workout';

// Icons
import { Cloud, CloudCheck, Download, Dumbbell, Loader2, LogOut, Pencil, Upload } from 'lucide-react';

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

function getGreeting(repsHit: boolean, kcalHit: boolean) {
  if (repsHit && kcalHit) {
    const phrases = ['Crushing it', 'Beast mode', 'Killing it', 'On fire'];
    return phrases[new Date().getDate() % phrases.length];
  }
  if (repsHit) return 'Strong work';
  if (kcalHit) return 'Burning bright';

  const hour = new Date().getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Working late';
}

function previousBestPerDay(
  workouts: WorkoutEntry[],
  excludeDate: string
): { bestReps: number; bestKcal: number } {
  const grouped: Record<string, WorkoutEntry[]> = {};

  for (const workout of workouts) {
    if (workout.date === excludeDate) continue;
    if (!grouped[workout.date]) grouped[workout.date] = [];
    grouped[workout.date].push(workout);
  }

  let bestReps = 0;
  let bestKcal = 0;

  for (const date of Object.keys(grouped)) {
    const entries = grouped[date];
    const reps = entries.reduce((sum, entry) => sum + entry.reps, 0);
    const latestActive = entries
      .filter((entry) => entry.activeKcal > 0)
      .sort((leftEntry, rightEntry) => rightEntry.timestamp - leftEntry.timestamp)[0]
      ?.activeKcal ?? 0;
    const latestTotal = entries
      .filter((entry) => entry.totalKcal > 0)
      .sort((leftEntry, rightEntry) => rightEntry.timestamp - leftEntry.timestamp)[0]
      ?.totalKcal ?? 0;
    const kcal = Math.max(latestActive, latestTotal);

    if (reps > bestReps) bestReps = reps;
    if (kcal > bestKcal) bestKcal = kcal;
  }

  return { bestReps, bestKcal };
}

function celebratePRIfNew(
  metric: 'reps' | 'kcal',
  value: number,
  today: string
): boolean {
  const storageKey = `pr_celebrated_${metric}`;
  const lastDate = localStorage.getItem(storageKey);
  if (lastDate === today) return false;

  localStorage.setItem(storageKey, today);
  const label = metric === 'reps' ? 'reps' : 'kcal';

  showToast({
    tone: 'celebrate',
    message: `New personal best!`,
    detail: `${value.toLocaleString()} ${label} today — your best day ever.`,
    durationMs: 6000,
  });

  return true;
}

function average7DayPerDay(
  workouts: WorkoutEntry[],
  today: Date
): { reps: number; kcal: number } {
  let repsSum = 0;
  let kcalSum = 0;

  for (let i = 0; i < 7; i++) {
    const target = new Date(today);
    target.setDate(target.getDate() - i);
    const dateStr = format(target, 'yyyy-MM-dd');
    const dayWorkouts = workouts.filter((w) => w.date === dateStr);
    repsSum += dayWorkouts.reduce((sum, w) => sum + w.reps, 0);
    const latestActive = dayWorkouts
      .filter((w) => w.activeKcal > 0)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.activeKcal ?? 0;
    const latestTotal = dayWorkouts
      .filter((w) => w.totalKcal > 0)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.totalKcal ?? 0;
    kcalSum += Math.max(latestActive, latestTotal);
  }

  return { reps: repsSum / 7, kcal: kcalSum / 7 };
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
  const importInputRef = useRef<HTMLInputElement>(null);
  const calculatorSentinelRef = useRef<HTMLDivElement>(null);
  const hasHydratedRemoteDataRef = useRef(false);
  const isManualSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const [prConfettiTrigger, setPrConfettiTrigger] = useState(0);

  const {
    workouts,
    stats,
    dailyGoal,
    newAchievements,
    addWorkout,
    clearNewAchievements,
    deleteWorkout,
    editWorkout,
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
    if (!mounted) return;

    const todayStats = getTodayStats();
    const baseTitle = 'Workout Tracker | Level Up Your Fitness';

    const segments: string[] = [];
    if (todayStats.reps > 0) segments.push(`${todayStats.reps.toLocaleString()} reps`);
    if (todayStats.kcal > 0) segments.push(`${todayStats.kcal.toLocaleString()} kcal`);

    if (segments.length === 0) {
      document.title = baseTitle;
      return;
    }

    const repsHit = dailyGoal.reps > 0 && todayStats.reps >= dailyGoal.reps;
    const kcalHit = dailyGoal.activeKcal > 0 && todayStats.kcal >= dailyGoal.activeKcal;
    const prefix = repsHit && kcalHit ? '🏆 ' : repsHit || kcalHit ? '⭐ ' : '💪 ';

    document.title = `${prefix}${segments.join(' · ')} · Workout Tracker`;
  }, [mounted, workouts, getTodayStats, dailyGoal]);

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
    const snapshot = useWorkoutStore.getState().workouts;
    const isFirstEver = snapshot.length === 0;
    const { bestReps } = previousBestPerDay(snapshot, today);
    const previousRepsToday = snapshot
      .filter((entry) => entry.date === today)
      .reduce((sum, entry) => sum + entry.reps, 0);

    const entry = addWorkout({
      date: today,
      reps,
      activeKcal: 0,
      totalKcal: 0,
    });

    const xpEarned = Math.round(reps * XP_PER_REP);
    showToast({
      message: `Added ${reps.toLocaleString()} reps`,
      detail: `+${xpEarned.toLocaleString()} XP`,
      action: {
        label: 'Undo',
        onClick: () => deleteWorkout(entry.id),
      },
    });

    const newRepsToday = previousRepsToday + reps;
    if (bestReps > 0 && previousRepsToday <= bestReps && newRepsToday > bestReps) {
      if (celebratePRIfNew('reps', newRepsToday, today)) {
        setPrConfettiTrigger((value) => value + 1);
      }
    }

    if (isFirstEver) {
      setPrConfettiTrigger((value) => value + 1);
      showToast({
        tone: 'celebrate',
        message: 'First workout logged!',
        detail: 'Welcome to the grind. Keep it rolling.',
        durationMs: 6000,
      });
    }
  };

  const handleAddKcal = (activeKcal: number, totalKcal: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const snapshot = useWorkoutStore.getState().workouts;
    const isFirstEver = snapshot.length === 0;
    const { bestKcal } = previousBestPerDay(snapshot, today);
    const previousTodayStats = getTodayStats();
    const previousKcalToday = previousTodayStats.kcal;

    const entry = addWorkout({
      date: today,
      reps: 0,
      activeKcal,
      totalKcal,
    });

    const parts: string[] = [];
    if (activeKcal > 0) parts.push(`${activeKcal.toLocaleString()} active`);
    if (totalKcal > 0) parts.push(`${totalKcal.toLocaleString()} total`);
    const detail = parts.length > 0 ? `${parts.join(' · ')} kcal` : undefined;

    showToast({
      message: 'Logged calories',
      detail,
      action: {
        label: 'Undo',
        onClick: () => deleteWorkout(entry.id),
      },
    });

    const newKcalToday = Math.max(activeKcal, totalKcal, previousKcalToday);
    if (bestKcal > 0 && previousKcalToday <= bestKcal && newKcalToday > bestKcal) {
      if (celebratePRIfNew('kcal', newKcalToday, today)) {
        setPrConfettiTrigger((value) => value + 1);
      }
    }

    if (isFirstEver) {
      setPrConfettiTrigger((value) => value + 1);
      showToast({
        tone: 'celebrate',
        message: 'First workout logged!',
        detail: 'Welcome to the grind. Keep it rolling.',
        durationMs: 6000,
      });
    }
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

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        schema?: string;
        userName?: string | null;
        dailyGoal?: DailyGoal;
        workouts?: WorkoutEntry[];
      };

      if (!Array.isArray(parsed.workouts)) {
        throw new Error('Missing workouts array');
      }

      const sanitizedWorkouts: WorkoutEntry[] = parsed.workouts
        .filter(
          (entry): entry is WorkoutEntry =>
            entry !== null &&
            typeof entry === 'object' &&
            typeof entry.id === 'string' &&
            typeof entry.date === 'string' &&
            typeof entry.timestamp === 'number' &&
            typeof entry.reps === 'number' &&
            typeof entry.activeKcal === 'number' &&
            typeof entry.totalKcal === 'number'
        );

      const currentState = useWorkoutStore.getState();
      const mergedWorkouts = mergeWorkouts(currentState.workouts, sanitizedWorkouts);
      const importedAdded = mergedWorkouts.length - currentState.workouts.length;

      const nextGoal: DailyGoal = parsed.dailyGoal &&
        typeof parsed.dailyGoal.reps === 'number' &&
        typeof parsed.dailyGoal.activeKcal === 'number'
        ? parsed.dailyGoal
        : currentState.dailyGoal;

      hydrateData({ workouts: mergedWorkouts, dailyGoal: nextGoal });

      if (typeof parsed.userName === 'string' && parsed.userName.trim() && !userName.trim()) {
        const trimmed = parsed.userName.trim();
        setUserName(trimmed);
        localStorage.setItem('user_name', trimmed);
      }

      showToast({
        message: 'Data imported',
        detail:
          importedAdded > 0
            ? `${importedAdded.toLocaleString()} new ${importedAdded === 1 ? 'entry' : 'entries'} merged`
            : 'No new entries — everything was already present',
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      showToast({
        tone: 'info',
        message: 'Import failed',
        detail: 'That file does not look like a valid backup.',
      });
    }
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      schema: 'workout-tracker.v1',
      userName: userName.trim() || null,
      dailyGoal,
      workouts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout-tracker-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      message: 'Data exported',
      detail: `${workouts.length.toLocaleString()} entries saved to JSON`,
    });
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
  const repsGoalHit = todayStats.reps >= dailyGoal.reps && dailyGoal.reps > 0;
  const kcalGoalHit = todayStats.kcal >= dailyGoal.activeKcal && dailyGoal.activeKcal > 0;

  const sevenDayAverages = average7DayPerDay(workouts, new Date());

  const yesterdayStats = (() => {
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayWorkouts = workouts.filter((w) => w.date === yesterdayStr);
    const reps = yesterdayWorkouts.reduce((sum, w) => sum + w.reps, 0);
    const latestActive = yesterdayWorkouts
      .filter((w) => w.activeKcal > 0)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.activeKcal ?? 0;
    const latestTotal = yesterdayWorkouts
      .filter((w) => w.totalKcal > 0)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.totalKcal ?? 0;
    return { reps, kcal: Math.max(latestActive, latestTotal) };
  })();

  const lastRepsEntry = (() => {
    let latest: WorkoutEntry | null = null;
    for (const entry of workouts) {
      if (entry.reps <= 0) continue;
      if (!latest || entry.timestamp > latest.timestamp) latest = entry;
    }
    return latest
      ? { reps: latest.reps, timestamp: latest.timestamp }
      : null;
  })();

  return (
    <main className="min-h-screen bg-background">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/background.jpg)' }}
      />
      <div className="fixed inset-0 bg-background/50 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 pt-8 pb-28 sm:pb-8">
        <header className="flex items-center justify-between mb-8 gap-3 sm:gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={importInputRef}
            onChange={handleImportFile}
            accept="application/json"
            className="hidden"
          />

          <div className="flex flex-col leading-tight min-w-0">
            <h1 className="font-display text-lg sm:text-3xl font-semibold tracking-tight text-white leading-tight inline-flex items-baseline flex-wrap gap-x-1.5">
              <span className="hidden sm:inline">{getGreeting(repsGoalHit, kcalGoalHit)},</span>
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
                  className="bg-transparent border-b border-green-400/50 outline-none font-semibold text-green-400"
                  size={Math.max(userName.length, 4)}
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="group inline-flex items-baseline gap-1.5 text-green-400 hover:text-green-300 transition-colors"
                  title="Click to edit your name"
                >
                  <span>{userName}</span>
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 self-center text-green-400/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-tight mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{format(new Date(), 'EEEE, MMMM d')}</span>
              {(todayStats.reps > 0 || todayStats.kcal > 0) && (
                <span className="sm:hidden inline-flex items-center gap-1.5 text-text-primary/90">
                  <span className="opacity-50">·</span>
                  {todayStats.reps > 0 && (
                    <span className="font-mono">{todayStats.reps.toLocaleString()} reps</span>
                  )}
                  {todayStats.reps > 0 && todayStats.kcal > 0 && (
                    <span className="opacity-50">·</span>
                  )}
                  {todayStats.kcal > 0 && (
                    <span className="font-mono">{todayStats.kcal.toLocaleString()} kcal</span>
                  )}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
              {syncStatus !== 'local' &&
                (syncStatus === 'syncing' ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-white/5 border border-white/10 text-[11px] uppercase tracking-wide text-text-secondary">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing
                  </span>
                ) : syncStatus === 'synced' ? (
                  <button
                    onClick={handleManualRefetch}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors text-[11px] uppercase tracking-wide text-green-400"
                    title="Click to refresh data from cloud"
                  >
                    <CloudCheck className="w-3 h-3" />
                    Synced
                  </button>
                ) : (
                  <button
                    onClick={handleManualRefetch}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-[11px] uppercase tracking-wide text-red-400"
                    title="Click to retry sync"
                  >
                    Sync error
                  </button>
                ))}

              {isSupabaseConfigured &&
                (authUser ? (
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-white/5 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 transition-colors text-[11px] uppercase tracking-wide text-white/70"
                    title="Sign out of Google sync"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[11px] uppercase tracking-wide text-white/80 hover:text-white"
                  >
                    <Cloud className="w-3 h-3" />
                    Sync
                  </button>
                ))}

              <button
                onClick={handleExportData}
                disabled={workouts.length === 0}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[11px] uppercase tracking-wide text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Download your data as JSON"
              >
                <Download className="w-3 h-3" />
                Export
              </button>

              <button
                onClick={handleImportClick}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[11px] uppercase tracking-wide text-white/80 hover:text-white"
                title="Import data from JSON backup"
              >
                <Upload className="w-3 h-3" />
                Import
              </button>
            </div>

            <div className="flex sm:hidden items-center gap-1">
              {syncStatus === 'syncing' && (
                <span
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                  title="Syncing"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-text-secondary" />
                </span>
              )}
              {syncStatus === 'synced' && (
                <button
                  onClick={handleManualRefetch}
                  className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors flex items-center justify-center"
                  title="Click to refresh data from cloud"
                >
                  <CloudCheck className="w-3.5 h-3.5 text-green-400" />
                </button>
              )}
              {syncStatus === 'error' && (
                <button
                  onClick={handleManualRefetch}
                  className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                  title="Sync error - click to retry"
                >
                  <Cloud className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
              {isSupabaseConfigured &&
                (authUser ? (
                  <button
                    onClick={handleSignOut}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 transition-colors flex items-center justify-center text-white/70 hover:text-red-400"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white/80 hover:text-white"
                    title="Sync with Google"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                  </button>
                ))}

              <button
                onClick={handleExportData}
                disabled={workouts.length === 0}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Export data as JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleImportClick}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white/80 hover:text-white"
                title="Import data from JSON backup"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 overflow-hidden hover:border-white/40 transition-colors flex-shrink-0"
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

        {workouts.length === 0 && <EmptyStateHero name={userName} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div ref={calculatorSentinelRef}>
              <Calculator onSubmit={handleAddReps} lastEntry={lastRepsEntry} />
            </div>
            <KcalInput onSubmit={handleAddKcal} />
            <TodayLog workouts={workouts} onDelete={deleteWorkout} onEdit={editWorkout} />
          </div>

          <div className="space-y-6">
            <LevelCard
              level={stats.level}
              totalXP={stats.totalXP}
              isLevelUp={isLevelUp}
            />
            <WeeklyChart workouts={workouts} />
            <PersonalBests workouts={workouts} />
            <StatsCards
              totalReps={stats.totalReps}
              totalActiveKcal={stats.totalActiveKcal}
              totalWorkouts={stats.totalWorkouts}
              workouts={workouts}
            />
          </div>

          <div className="space-y-6">
            <DailyGoals
              currentReps={todayStats.reps}
              goalReps={dailyGoal.reps}
              currentKcal={todayStats.kcal}
              goalKcal={dailyGoal.activeKcal}
              avgReps={sevenDayAverages.reps}
              avgKcal={sevenDayAverages.kcal}
              yesterdayReps={yesterdayStats.reps}
              yesterdayKcal={yesterdayStats.kcal}
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
            <TopTracks
              accessToken={spotifyToken}
              onConnect={async () => {
                const url = await getSpotifyAuthUrl();
                window.location.href = url;
              }}
            />
          </div>
        </div>

        <div className="mt-8">
          <HeatmapCard workouts={workouts} dailyGoal={dailyGoal} />
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

      <div className="pointer-events-none fixed inset-0 z-50">
        <ConfettiBurst trigger={prConfettiTrigger} spread={260} count={32} />
      </div>

      <MobileQuickAdd target={calculatorSentinelRef} onAdd={handleAddReps} />
      <StickyMobileHeader
        name={userName}
        initials={getInitials(userName)}
        profileImage={profileImage}
        level={stats.level}
        todayReps={todayStats.reps}
        todayKcal={todayStats.kcal}
        goalReps={dailyGoal.reps}
        goalKcal={dailyGoal.activeKcal}
      />
      <KeyboardHelp />
      <Toaster />
    </main>
  );
}
