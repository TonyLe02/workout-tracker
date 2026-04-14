'use client';

// React/Next.js
import { useState } from 'react';

// Icons
import { Heart, Flame, Zap } from 'lucide-react';

interface KcalInputProps {
  onSubmit: (activeKcal: number, totalKcal: number) => void;
}

export function KcalInput({ onSubmit }: KcalInputProps) {
  const [activeKcal, setActiveKcal] = useState('');
  const [totalKcal, setTotalKcal] = useState('');

  const handleSubmit = () => {
    const active = parseInt(activeKcal, 10) || 0;
    const total = parseInt(totalKcal, 10) || 0;
    
    if (active > 0 || total > 0) {
      onSubmit(active, total);
      setActiveKcal('');
      setTotalKcal('');
    }
  };

  const isValid = (parseInt(activeKcal, 10) || 0) > 0 || (parseInt(totalKcal, 10) || 0) > 0;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-secondary" />
        <span className="text-sm text-text-secondary uppercase tracking-wider">
          Heart Rate Calories
        </span>
      </div>

      <div className="space-y-4">
        {/* Active Calories */}
        <div>
          <label className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            <Zap className="w-4 h-4 text-primary" />
            Active kcal
          </label>
          <input
            type="number"
            value={activeKcal}
            onChange={(e) => setActiveKcal(e.target.value)}
            placeholder="0"
            className="
              w-full h-14 px-4 rounded-xl
              bg-surface-hover/50 border border-border/50
              text-2xl font-mono text-text-primary text-right
              placeholder:text-muted
              focus:outline-none focus:border-border-hover
              transition-all duration-200
            "
          />
        </div>

        {/* Total Calories */}
        <div>
          <label className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            <Flame className="w-4 h-4 text-warning" />
            Total kcal (end of day)
          </label>
          <input
            type="number"
            value={totalKcal}
            onChange={(e) => setTotalKcal(e.target.value)}
            placeholder="0"
            className="
              w-full h-14 px-4 rounded-xl
              bg-surface-hover/50 border border-border/50
              text-2xl font-mono text-text-primary text-right
              placeholder:text-muted
              focus:outline-none focus:border-border-hover
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className={`
          w-full mt-4 h-12 rounded-xl font-semibold
          flex items-center justify-center gap-2
          transition-all duration-200
          ${
            !isValid
              ? 'bg-surface-hover/30 text-muted cursor-not-allowed'
              : 'bg-gradient-to-r from-secondary to-pink-500 text-white hover:opacity-90 active:scale-[0.98]'
          }
        `}
      >
        <Heart className="w-4 h-4" />
        LOG CALORIES
      </button>
    </div>
  );
}
