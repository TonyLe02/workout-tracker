/**
 * Small synthesized cues for the rest timer. Synthesized rather than shipped as
 * audio files so the app stays asset-free and the cue can be built from a
 * gesture without a network round trip.
 */

type WindowWithAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    const scope = window as WindowWithAudio;
    const Constructor = scope.AudioContext ?? scope.webkitAudioContext;
    if (!Constructor) return null;
    try {
      audioContext = new Constructor();
    } catch {
      return null;
    }
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  return audioContext;
}

/**
 * Browsers only allow audio to start from a user gesture. Call this from the tap
 * that starts a timer so the cue at zero is allowed to play.
 */
export function primeAudio(): void {
  getAudioContext();
}

interface BlipOptions {
  frequency: number;
  startOffset: number;
  durationMs: number;
  gain: number;
}

function blip(context: AudioContext, options: BlipOptions): void {
  const oscillator = context.createOscillator();
  const amplifier = context.createGain();
  const startAt = context.currentTime + options.startOffset / 1000;
  const endAt = startAt + options.durationMs / 1000;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(options.frequency, startAt);

  // Ramped envelope: a square-edged gain change clicks audibly.
  amplifier.gain.setValueAtTime(0.0001, startAt);
  amplifier.gain.exponentialRampToValueAtTime(options.gain, startAt + 0.012);
  amplifier.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(amplifier);
  amplifier.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.02);
}

/** Three rising blips: rest is over, go. */
export function playRestOverChime(): void {
  const context = getAudioContext();
  if (!context) return;

  blip(context, { frequency: 660, startOffset: 0, durationMs: 110, gain: 0.16 });
  blip(context, { frequency: 880, startOffset: 150, durationMs: 110, gain: 0.16 });
  blip(context, { frequency: 1320, startOffset: 300, durationMs: 220, gain: 0.2 });
}

/** Quiet tick for the final seconds of a countdown. */
export function playCountdownTick(): void {
  const context = getAudioContext();
  if (!context) return;

  blip(context, { frequency: 520, startOffset: 0, durationMs: 60, gain: 0.06 });
}

