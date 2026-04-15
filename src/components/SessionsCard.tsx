'use client';

// Icons
import { Calendar, WeightTilde } from 'lucide-react';

interface SessionsCardProps {
  totalSessions: number;
  totalReps: number;
}

export function SessionsCard({ totalSessions, totalReps }: SessionsCardProps) {
  const avgRepsPerSession = totalSessions > 0 
    ? Math.round(totalReps / totalSessions) 
    : 0;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        {/* Total Sessions */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Sessions</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-primary">
                {totalSessions}
              </span>
              <span className="text-text-secondary">logged</span>
            </div>
          </div>
        </div>

        {/* Avg Reps */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-text-secondary text-sm justify-end">
            <WeightTilde className="w-4 h-4" />
            Avg reps/session
          </div>
          <div className="text-2xl font-bold text-white">
            {avgRepsPerSession}
          </div>
        </div>
      </div>
    </div>
  );
}
