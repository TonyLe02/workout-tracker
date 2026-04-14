const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';

// Dynamic redirect URI based on environment
const getRedirectUri = () => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/callback`;
};
const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  trackUrl: string;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing: boolean;
  progress_ms: number;
  item?: {
    name: string;
    artists: SpotifyArtist[];
    album: {
      name: string;
      images: SpotifyImage[];
    };
    duration_ms: number;
    external_urls: {
      spotify: string;
    };
  };
}

interface SpotifyTokenResponse {
  access_token?: string;
}
interface SpotifyPlayerState {
  is_playing: boolean;
}

// Generate random string for PKCE
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Generate code challenge for PKCE
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return btoa(String.fromCharCode.apply(null, bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function getSpotifyAuthUrl(): Promise<string> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store verifier for token exchange
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export function getCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

export async function exchangeCodeForToken(code: string): Promise<string | null> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) return null;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    });

    const data = (await response.json()) as SpotifyTokenResponse;
    localStorage.removeItem('spotify_code_verifier');
    
    if (data.access_token) {
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

export async function getCurrentlyPlaying(accessToken: string): Promise<SpotifyTrack | null> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204 || response.status === 401) {
      return null;
    }

    const data = (await response.json()) as SpotifyCurrentlyPlayingResponse;

    if (!data || !data.item) {
      return null;
    }

    return {
      name: data.item.name,
      artist: data.item.artists.map((artist) => artist.name).join(', '),
      album: data.item.album.name,
      albumArt: data.item.album.images[0]?.url || '',
      isPlaying: data.is_playing,
      progress: data.progress_ms,
      duration: data.item.duration_ms,
      trackUrl: data.item.external_urls.spotify,
    };
  } catch (error) {
    console.error('Error fetching currently playing:', error);
    return null;
  }
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function playPause(accessToken: string): Promise<boolean> {
  try {
    // First get current state
    const stateRes = await fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (stateRes.status === 204) return false;
    const state = (await stateRes.json()) as SpotifyPlayerState;
    
    const endpoint = state.is_playing ? 'pause' : 'play';
    await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return true;
  } catch (error) {
    console.error('Error toggling playback:', error);
    return false;
  }
}

export async function skipToNext(accessToken: string): Promise<boolean> {
  try {
    await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return true;
  } catch (error) {
    console.error('Error skipping track:', error);
    return false;
  }
}

export async function skipToPrevious(accessToken: string): Promise<boolean> {
  try {
    await fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return true;
  } catch (error) {
    console.error('Error going to previous track:', error);
    return false;
  }
}
