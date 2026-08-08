const STORAGE_KEY = 'hermes-token';

/**
 * The single-user admin token.
 *
 * Held in localStorage rather than a cookie because the API is called cross-path from the SPA and
 * the token is entered by hand once. It is not a session credential with a lifetime — rotating it
 * server-side simply invalidates every browser that has it.
 */
export function getAdminToken(): string | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  return globalThis.localStorage.getItem(STORAGE_KEY);
}

export function setAdminToken(token: string): void {
  globalThis.localStorage?.setItem(STORAGE_KEY, token.trim());
}

export function clearAdminToken(): void {
  globalThis.localStorage?.removeItem(STORAGE_KEY);
}
