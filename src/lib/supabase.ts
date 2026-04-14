import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

import type { DailyGoal, WorkoutEntry } from '@/types/workout';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export interface RemoteProfile {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  daily_goal_reps: number | null;
  daily_goal_active_kcal: number | null;
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      supabaseUrl!,
      supabaseAnonKey!
    );
  }

  return supabaseClient;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => {
    subscription.unsubscribe();
  };
}

export async function signInWithGoogle() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOutFromSupabase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function fetchProfile(userId: string): Promise<RemoteProfile | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, name, avatar_url, daily_goal_reps, daily_goal_active_kcal')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertProfile(
  userId: string,
  input: {
    name: string;
    avatarUrl: string | null;
    dailyGoal: DailyGoal;
  }
) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: userId,
      name: input.name,
      avatar_url: input.avatarUrl,
      daily_goal_reps: input.dailyGoal.reps,
      daily_goal_active_kcal: input.dailyGoal.activeKcal,
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    throw error;
  }
}

export async function fetchWorkouts(userId: string): Promise<WorkoutEntry[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  type WorkoutRow = {
    id: string;
    date: string;
    reps: number;
    active_kcal: number;
    total_kcal: number;
    exercise_type: string | null;
    timestamp: number;
  };

  const { data, error } = await supabase
    .from('workouts')
    .select('id, date, reps, active_kcal, total_kcal, exercise_type, timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as WorkoutRow[]).map((workout) => ({
    id: workout.id,
    date: workout.date,
    reps: workout.reps,
    activeKcal: workout.active_kcal,
    totalKcal: workout.total_kcal,
    exerciseType: workout.exercise_type ?? undefined,
    timestamp: workout.timestamp,
  }));
}

export async function upsertWorkouts(userId: string, workouts: WorkoutEntry[]) {
  const supabase = getSupabaseClient();

  if (!supabase || workouts.length === 0) {
    return;
  }

  const { error } = await supabase.from('workouts').upsert(
    workouts.map((workout) => ({
      id: workout.id,
      user_id: userId,
      date: workout.date,
      reps: workout.reps,
      active_kcal: workout.activeKcal,
      total_kcal: workout.totalKcal,
      exercise_type: workout.exerciseType ?? null,
      timestamp: workout.timestamp,
    })),
    {
      onConflict: 'id',
    }
  );

  if (error) {
    throw error;
  }
}
