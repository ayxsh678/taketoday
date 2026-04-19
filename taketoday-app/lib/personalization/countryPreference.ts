import type { UserCountry } from "./getUserCountry";

const COOKIE_KEY = "tt_country";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Reads the manually-set country preference from a cookie.
 * Returns null when no preference is set (fall back to auto-detection).
 */
export function getCountryPreference(): UserCountry | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`),
  );
  const val = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return val === "IN" || val === "US" ? val : null;
}

/** Persists the user's country choice in a long-lived cookie. */
export function setCountryPreference(country: UserCountry): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(country)}; max-age=${MAX_AGE}; path=/; SameSite=Lax; Secure`;
}

/** Clears the manual override — auto-detection resumes. */
export function clearCountryPreference(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=; max-age=0; path=/; SameSite=Lax; Secure`;
}
