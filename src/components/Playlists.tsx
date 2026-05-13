'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { ChevronDown, ChevronUp, ListMusic, Music, Play, RefreshCw } from 'lucide-react';

import {
  getUserPlaylists,
  playPlaylist,
  type SpotifyPlaylist,
} from '@/lib/spotify';

interface PlaylistsProps {
  accessToken: string | null;
  onConnect: () => void;
}

const COLLAPSED_LIMIT = 6;

export function Playlists({ accessToken, onConnect }: PlaylistsProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    setNeedsReauth(false);

    getUserPlaylists(accessToken, 30).then((result) => {
      if (cancelled) return;
      if (result === null) {
        setNeedsReauth(true);
        setPlaylists([]);
      } else {
        setPlaylists(result);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handlePlay = async (playlist: SpotifyPlaylist) => {
    if (!accessToken || playingId) return;
    setPlayingId(playlist.id);
    setStatusMessage(null);
    const result = await playPlaylist(accessToken, playlist.uri);
    setPlayingId(null);
    if (!result.ok) {
      setStatusMessage(
        result.reason === 'no_device'
          ? 'Open Spotify on a device first, then try again.'
          : result.reason === 'forbidden'
          ? 'Playback requires Spotify Premium.'
          : result.reason === 'unauthorized'
          ? 'Reconnect Spotify to play playlists.'
          : 'Could not start playback.'
      );
      window.setTimeout(() => setStatusMessage(null), 4000);
    }
  };

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
            <div className="text-white font-medium">Your Playlists</div>
            <p className="text-[10px] text-text-secondary/60 mt-1">
              Play any of your Spotify playlists in one tap
            </p>
          </div>
        </button>
      </div>
    );
  }

  const visible = expanded ? playlists : playlists.slice(0, COLLAPSED_LIMIT);
  const canExpand = playlists.length > COLLAPSED_LIMIT;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 sm:w-5 sm:h-5 text-[#1DB954]" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            Your Playlists
          </span>
        </div>
        {playlists.length > 0 && (
          <span className="text-[11px] text-text-secondary/70 uppercase tracking-wider">
            {playlists.length}
          </span>
        )}
      </div>

      {needsReauth ? (
        <button
          onClick={onConnect}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          <RefreshCw className="w-4 h-4 text-[#1DB954]" />
          <div className="text-xs text-text-secondary">
            Reconnect Spotify to grant playlist access
          </div>
        </button>
      ) : loading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
            <Music className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="text-sm text-text-secondary">
            No playlists found on your account.
          </div>
        </div>
      ) : (
        <>
          <ul className="space-y-1.5">
            {visible.map((playlist) => {
              const isPlaying = playingId === playlist.id;
              return (
                <li key={playlist.id}>
                  <button
                    type="button"
                    onClick={() => handlePlay(playlist)}
                    disabled={playingId !== null}
                    className="group w-full flex items-center gap-3 p-1.5 -mx-1.5 rounded-lg hover:bg-white/5 transition-colors text-left disabled:opacity-60 disabled:cursor-wait"
                    title={`Play ${playlist.name} on Spotify`}
                  >
                    <div className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0">
                      {playlist.coverArt ? (
                        <Image
                          src={playlist.coverArt}
                          alt={playlist.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <ListMusic className="w-4 h-4 text-text-secondary" />
                        </div>
                      )}
                      <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          isPlaying
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Play className="w-4 h-4 text-white" fill="currentColor" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {playlist.name}
                      </div>
                      <div className="text-xs text-text-secondary truncate">
                        {playlist.trackCount.toLocaleString()}{' '}
                        {playlist.trackCount === 1 ? 'track' : 'tracks'}
                        {playlist.ownerName ? ` · ${playlist.ownerName}` : ''}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 text-[11px] uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show all {playlists.length}
                </>
              )}
            </button>
          )}
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
