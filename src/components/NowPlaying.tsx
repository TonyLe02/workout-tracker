'use client';

// React/Next.js
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// Utils/Helpers
import {
  getCurrentlyPlaying,
  formatTime,
  playPause,
  skipToNext,
  skipToPrevious,
  type SpotifyTrack,
} from '@/lib/spotify';

// Icons
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface NowPlayingProps {
  accessToken: string | null;
  onConnect: () => void;
}

export function NowPlaying({ accessToken, onConnect }: NowPlayingProps) {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);

  const fetchTrack = useCallback(async () => {
    if (!accessToken) return;
    const currentTrack = await getCurrentlyPlaying(accessToken);
    setTrack(currentTrack);
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchTrack();
      // Poll every 5 seconds
      const interval = setInterval(fetchTrack, 5000);
      return () => clearInterval(interval);
    }
  }, [accessToken, fetchTrack]);

  // Not connected
  if (!accessToken) {
    return (
      <div className="glass rounded-2xl p-4">
        <button
          onClick={onConnect}
          className="w-full flex items-center gap-3 hover:bg-white/5 transition-colors rounded-lg p-1 -m-1"
        >
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
            <Music className="w-6 h-6 text-[#1DB954]" />
          </div>
          <div className="text-left flex-1">
            <div className="text-sm text-text-secondary">Connect</div>
            <div className="text-white font-medium">Spotify</div>
            <p className="text-[10px] text-text-secondary/60 mt-1">
              Requires whitelist access (limited to 5 users)
            </p>
          </div>
        </button>
      </div>
    );
  }

  // No track playing
  if (!track) {
    return (
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
          <Music className="w-6 h-6 text-text-secondary" />
        </div>
        <div>
          <div className="text-sm text-text-secondary">Spotify</div>
          <div className="text-white font-medium">Not playing</div>
        </div>
      </div>
    );
  }

  const progressPercent = (track.progress / track.duration) * 100;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {/* Album Art */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          {track.albumArt ? (
            <Image
              src={track.albumArt}
              alt={track.album}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <Music className="w-6 h-6 text-text-secondary" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#1DB954] font-medium">
            {track.isPlaying ? 'NOW PLAYING' : 'PAUSED'}
          </div>
          <div className="text-white font-medium truncate">{track.name}</div>
          <div className="text-sm text-text-secondary truncate">{track.artist}</div>
        </div>

      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          onClick={async (e) => {
            e.preventDefault();
            await skipToPrevious(accessToken!);
            setTimeout(fetchTrack, 300);
          }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <SkipBack className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={async (e) => {
            e.preventDefault();
            await playPause(accessToken!);
            setTimeout(fetchTrack, 300);
          }}
          className="p-3 rounded-full bg-white text-black hover:scale-105 transition-transform"
        >
          {track.isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          )}
        </button>
        <button
          onClick={async (e) => {
            e.preventDefault();
            await skipToNext(accessToken!);
            setTimeout(fetchTrack, 300);
          }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <SkipForward className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1DB954] rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          <span>{formatTime(track.progress)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>
    </div>
  );
}
