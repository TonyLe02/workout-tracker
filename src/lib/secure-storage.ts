/**
 * Secure Storage Utility
 *
 * Encrypts sensitive data before storing in localStorage using AES-GCM.
 * The encryption key is stored in sessionStorage (clears on tab close).
 * This provides defense-in-depth against casual snooping and storage scraping.
 */

const KEY_STORAGE_NAME = 'secure_storage_key';
const ALGORITHM = 'AES-GCM';

let cachedKey: CryptoKey | null = null;

async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey;
  }

  // Try to restore key from sessionStorage
  const storedKey = sessionStorage.getItem(KEY_STORAGE_NAME);

  if (storedKey) {
    const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
    cachedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );
    return cachedKey;
  }

  // Generate new key
  cachedKey = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Export and store in sessionStorage
  const exportedKey = await crypto.subtle.exportKey('raw', cachedKey);
  const keyBytes = new Uint8Array(exportedKey);
  const keyString = btoa(Array.from(keyBytes, (b) => String.fromCharCode(b)).join(''));
  sessionStorage.setItem(KEY_STORAGE_NAME, keyString);

  return cachedKey;
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    const cryptoKey = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(value);

    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      cryptoKey,
      encoded
    );

    // Store IV + encrypted data as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    const base64 = btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(''));
    localStorage.setItem(key, base64);
  } catch (error) {
    console.error('Secure storage write failed:', error);
  }
}

export async function secureGet(key: string): Promise<string | null> {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const cryptoKey = await getOrCreateKey();
    const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      cryptoKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed - likely key mismatch from new session
    // Clear the stale encrypted data
    localStorage.removeItem(key);
    return null;
  }
}

export function secureRemove(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Clear all secure storage (both encrypted data and session key)
 */
export function secureClearAll(): void {
  sessionStorage.removeItem(KEY_STORAGE_NAME);
  cachedKey = null;
}
