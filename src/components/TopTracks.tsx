'use client';

// React/Next.js
import Image from 'next/image';
import { useEffect, useState } from 'react';

// Icons
import { ListMusic, Music, Play, RefreshCw } from 'lucide-react';

// Utils/Helpers
import {
  getTopTracks,
  playTrack,
  type SpotifyTopTimeRange,
  type SpotifyTopTrack,
} from '@/lib/spotify';

interface TopTracksProps {
  accessToken: string | null;
  onConnect: () => void;
}

const RANGE_LABELS: Record<SpotifyTopTimeRange, string> = {
  short_term: '4W',
  medium_term: '6M',
  long_term: 'ALL',
};

export function TopTracks({ accessToken, onConnect }: TopTracksProps) {
  const [timeRange, setTimeRange] = useState<SpotifyTopTimeRange>('short_term');
  const [tracks, setTracks] = useState<SpotifyTopTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePlay = async (track: SpotifyTopTrack) => {
    if (!accessToken || playingId) return;
    setPlayingId(track.id);
    setStatusMessage(null);
    const result = await playTrack(accessToken, track.uri);
    setPlayingId(null);
    if (!result.ok) {
      setStatusMessage(
        result.reason === 'no_device'
          ? 'Open Spotify on a device first, then try again.'
          : result.reason === 'forbidden'
          ? 'Playback requires Spotify Premium.'
          : result.reason === 'unauthorized'
          ? 'Reconnect Spotify to play tracks.'
          : 'Could not start playback.'
      );
      window.setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    setNeedsReauth(false);

    getTopTracks(accessToken, timeRange, 5).then((result) => {
      if (cancelled) return;
      if (result === null) {
        setNeedsReauth(true);
        setTracks([]);
      } else {
        setTracks(result);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, timeRange]);

  if (!accessToken) {
    return (
      <div className="glass rounded-2xl p-4">
        <button
          onClick={onConnect}
          className="w-full flex items-center gap-3 hover:bg-white/5 transition-colors rounded-lg p-1 -m-1"
        >
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
            <ListMusic className="w-6 h-6 text-[#1DB954]" />
          </div>
          <div className="text-left flex-1">
            <div className="text-sm text-text-secondary">Connect</div>
            <div className="text-white font-medium">Top Tracks</div>
            <p className="text-[10px] text-text-secondary/60 mt-1">
              See your most-played tracks on Spotify
            </p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 sm:w-5 sm:h-5 text-[#1DB954]" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            Top Tracks
          </span>
        </div>
        <div className="flex gap-1 bg-surface-hover/50 rounded-lg p-1">
          {(['short_term', 'medium_term', 'long_term'] as SpotifyTopTimeRange[]).map(
            (range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 text-xs rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-white/10 text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {RANGE_LABELS[range]}
              </button>
            )
          )}
        </div>
      </div>

      {needsReauth ? (
        <button
          onClick={onConnect}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          <RefreshCw className="w-4 h-4 text-[#1DB954]" />
          <div className="text-xs text-text-secondary">
            Reconnect Spotify to grant top‑tracks access
          </div>
        </button>
      ) : loading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-11 rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
            <Music className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="text-sm text-text-secondary">
            Not enough listening history yet.
          </div>
        </div>
      ) : (
        <>
          <ol className="space-y-1.5">
            {tracks.map((track, idx) => {
              const isPlaying = playingId === track.id;
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => handlePlay(track)}
                    disabled={playingId !== null}
                    className="group w-full flex items-center gap-3 p-1.5 -mx-1.5 rounded-lg hover:bg-white/5 transition-colors text-left disabled:opacity-60 disabled:cursor-wait"
                    title={`Play ${track.name} on Spotify`}
                  >
                    <div className="w-5 text-xs text-text-secondary/70 font-mono text-right">
                      {idx + 1}
                    </div>
                    <div className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0">
                      {track.albumArt ? (
                        <Image
                          src={track.albumArt}
                          alt={track.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <Music className="w-4 h-4 text-text-secondary" />
                        </div>
                      )}
                      <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          isPlaying
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Play
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {track.name}
                      </div>
                      <div className="text-xs text-text-secondary truncate">
                        {track.artist}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
          {statusMessage && (
            <div className="mt-3 text-xs text-text-secondary/80 px-1">
              {statusMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}
