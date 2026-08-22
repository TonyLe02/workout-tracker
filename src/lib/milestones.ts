// Types/Interfaces
import type { Achievement, UserStats } from '@/types/workout';
import { XP_PER_ACTIVE_KCAL, XP_PER_LEVEL, XP_PER_REP } from '@/types/workout';

/**
 * Achievements only declare `requirement: (stats) => boolean`, so nothing in the
 * data tells us how close an unlock is. Rather than duplicating 100 thresholds
 * by hand (and letting them drift), we recover each threshold from the
 * requirement itself: feed it synthetic stats, find which metric flips it, then
 * binary-search the smallest value that satisfies it.
 *
 * Every threshold is verified against the real requirement before it is used,
 * so an achievement we cannot measure simply reports no progress instead of
 * reporting a wrong one.
 */

export type MilestoneMetric =
  | 'totalReps'
  | 'totalActiveKcal'
  | 'totalXP'
  | 'level'
  | 'totalWorkouts';

const METRIC_ORDER: MilestoneMetric[] = [
  'totalReps',
  'totalActiveKcal',
  'totalXP',
  'level',
  'totalWorkouts',
];

const METRIC_UNITS: Record<MilestoneMetric, { singular: string; plural: string }> = {
  totalReps: { singular: 'rep', plural: 'reps' },
  totalActiveKcal: { singular: 'kcal', plural: 'kcal' },
  totalXP: { singular: 'XP', plural: 'XP' },
  level: { singular: 'level', plural: 'levels' },
  totalWorkouts: { singular: 'session', plural: 'sessions' },
};

export interface MilestoneComponent {
  metric: MilestoneMetric;
  target: number;
}

export interface MilestoneProgress {
  metric: MilestoneMetric;
  current: number;
  target: number;
  remaining: number;
  /** 0–1, clamped. */
  ratio: number;
  /** e.g. "1,880 reps to go" */
  remainingLabel: string;
  /** e.g. "3,120 / 5,000 reps" */
  countLabel: string;
}

const PROBE_CEILING = 1_000_000_000;

const EMPTY_STATS: UserStats = {
  totalXP: 0,
  level: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalReps: 0,
  totalActiveKcal: 0,
  totalWorkouts: 0,
  unlockedAchievements: [],
  lastWorkoutDate: null,
};

function statsWith(metric: MilestoneMetric, value: number): UserStats {
  return { ...EMPTY_STATS, [metric]: value };
}

/** Smallest value of `metric` that satisfies the requirement, or null. */
function resolveTarget(achievement: Achievement, metric: MilestoneMetric): number | null {
  const satisfied = (value: number) => {
    try {
      return achievement.requirement(statsWith(metric, value));
    } catch {
      return false;
    }
  };

  // Requirements that are already true at zero, or never true, are not driven
  // by this metric alone.
  if (satisfied(0)) return null;
  if (!satisfied(PROBE_CEILING)) return null;

  let unsatisfied = 0;
  let satisfiedAt = PROBE_CEILING;

  while (satisfiedAt - unsatisfied > 1) {
    const middle = Math.floor((unsatisfied + satisfiedAt) / 2);
    if (satisfied(middle)) {
      satisfiedAt = middle;
    } else {
      unsatisfied = middle;
    }
  }

  // Verify the boundary is a real threshold before trusting it.
  if (!satisfied(satisfiedAt) || satisfied(satisfiedAt - 1)) return null;

  return satisfiedAt;
}

const milestoneCache = new Map<string, MilestoneComponent[]>();

function milestoneFor(achievement: Achievement): MilestoneComponent[] {
  const cached = milestoneCache.get(achievement.id);
  if (cached) return cached;

  const components: MilestoneComponent[] = [];

  for (const metric of METRIC_ORDER) {
    const target = resolveTarget(achievement, metric);
    if (target !== null) {
      components.push({ metric, target });
    }
  }

  milestoneCache.set(achievement.id, components);
  return components;
}

function formatUnit(metric: MilestoneMetric, value: number): string {
  const unit = METRIC_UNITS[metric];
  return value === 1 ? unit.singular : unit.plural;
}

function currentValue(stats: UserStats, metric: MilestoneMetric): number {
  return Math.max(0, stats[metric]);
}

/**
 * How close `stats` is to unlocking `achievement`, or null when the achievement
 * is not measurable from a single metric.
 */
export function getMilestoneProgress(
  achievement: Achievement,
  stats: UserStats
): MilestoneProgress | null {
  const components = milestoneFor(achievement);
  if (components.length === 0) return null;

  // Multiple measurable metrics means any one of them can unlock it, so the
  // closest one is the honest answer.
  let best: MilestoneProgress | null = null;

  for (const component of components) {
    const current = currentValue(stats, component.metric);
    const ratio = component.target > 0 ? Math.min(1, current / component.target) : 1;

    if (best && ratio <= best.ratio) continue;

    const remaining = Math.max(0, component.target - current);

    best = {
      metric: component.metric,
      current,
      target: component.target,
      remaining,
      ratio,
      remainingLabel: `${remaining.toLocaleString()} ${formatUnit(
        component.metric,
        remaining
      )} to go`,
      countLabel: `${current.toLocaleString()} / ${component.target.toLocaleString()} ${formatUnit(
        component.metric,
        component.target
      )}`,
    };
  }

  return best;
}

export interface NextMilestone {
  achievement: Achievement;
  progress: MilestoneProgress;
}

/** Total XP required to sit at a given level, per the level curve. */
function xpAtLevel(level: number): number {
  const steps = Math.max(0, level - 1);
  return (XP_PER_LEVEL * steps * (steps + 1)) / 2;
}

/**
 * Remaining work expressed in XP, the one currency every metric shares.
 *
 * Percentages alone rank badly across metrics: a fresh account reads 10% of the
 * way to level 10 and 0% of the way to its first session, so pure ratio order
 * buries the achievement that is genuinely one tap away.
 */
function effortRemaining(progress: MilestoneProgress, stats: UserStats): number {
  switch (progress.metric) {
    case 'totalReps':
      return progress.remaining * XP_PER_REP;
    case 'totalActiveKcal':
      return progress.remaining * XP_PER_ACTIVE_KCAL;
    case 'totalXP':
      return progress.remaining;
    case 'level':
      return Math.max(0, xpAtLevel(progress.target) - stats.totalXP);
    case 'totalWorkouts': {
      // A session is worth roughly what this person's sessions are worth.
      const perSession =
        stats.totalWorkouts > 0 ? stats.totalReps / stats.totalWorkouts : 0;
      return progress.remaining * Math.max(100, perSession);
    }
  }
}

/**
 * The locked achievements closest to unlocking, nearest first.
 */
export function getNextMilestones(
  achievements: Achievement[],
  stats: UserStats,
  unlockedIds: string[],
  limit = 3
): NextMilestone[] {
  const unlocked = new Set(unlockedIds);
  const candidates: { entry: NextMilestone; effort: number }[] = [];

  for (const achievement of achievements) {
    if (unlocked.has(achievement.id)) continue;
    const progress = getMilestoneProgress(achievement, stats);
    if (!progress) continue;
    candidates.push({
      entry: { achievement, progress },
      effort: effortRemaining(progress, stats),
    });
  }

  candidates.sort((left, right) => {
    if (left.effort !== right.effort) return left.effort - right.effort;
    return right.entry.progress.ratio - left.entry.progress.ratio;
  });

  return candidates.slice(0, limit).map((candidate) => candidate.entry);
}
