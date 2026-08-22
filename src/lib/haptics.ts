/**
 * Haptic feedback for a phone-in-hand app.
 *
 * Two engines, because the web has two realities:
 * - Chrome / Android expose `navigator.vibrate` and take a real pattern.
 * - iOS Safari has no vibration API at all. It does, however, play a system
 *   haptic when a `<input type="checkbox" switch>` toggles, so a hidden switch
 *   driven from inside the same tap gives iPhones a single tick (iOS 17.4+).
 *   No pattern control there — a tick is a tick.
 *
 * Every call is fire-and-forget: haptics are a nicety and must never throw into
 * a logging path.
 */

export type HapticPattern = 'tap' | 'confirm' | 'success' | 'alert';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  /** Key press, chip, small adjustment. */
  tap: 8,
  /** A set landed, calories logged. */
  confirm: 18,
  /** Goal cleared, achievement unlocked. */
  success: [26, 40, 26],
  /** Rest is over — the one you feel from across the gym. */
  alert: [90, 70, 90, 70, 180],
};

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function isAppleTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true;
  // iPads report as MacIntel with touch points.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

let appleSwitch: HTMLLabelElement | null = null;

function getAppleSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  if (appleSwitch) return appleSwitch;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;

  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  label.appendChild(input);
  document.body.appendChild(label);

  appleSwitch = label;
  return label;
}

/** How many ticks an Apple device gets for a pattern it cannot play properly. */
const APPLE_TICKS: Record<HapticPattern, number> = {
  tap: 1,
  confirm: 1,
  success: 2,
  alert: 3,
};

export function haptic(pattern: HapticPattern = 'tap'): void {
  try {
    if (canVibrate()) {
      navigator.vibrate(PATTERNS[pattern]);
      return;
    }

    if (!isAppleTouchDevice()) return;

    const target = getAppleSwitch();
    if (!target) return;

    // Spaced ticks stand in for a pattern; the first must stay inside the tap.
    for (let index = 0; index < APPLE_TICKS[pattern]; index++) {
      if (index === 0) {
        target.click();
      } else {
        window.setTimeout(() => target.click(), index * 120);
      }
    }
  } catch {
    // A refused vibration is not worth surfacing.
  }
}
