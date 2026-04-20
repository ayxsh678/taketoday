import { safeDecode, isSiteLang } from "./preferenceUtils";

export type SiteLang = "en" | "hi";

const COOKIE_KEY = "tt_lang";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const DEFAULT_LANG: SiteLang = "en";

/**
 * Returns the user's persisted language preference, defaulting to "en".
 * Safely handles malformed or legacy non-encoded cookie values.
 */
export function getLangPreference(): SiteLang {
  if (typeof document === "undefined") return DEFAULT_LANG;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`),
  );
  const val = match?.[1] ? safeDecode(match[1]) : undefined;
  return isSiteLang(val) ? val : DEFAULT_LANG;
}

/** Persists the user's language choice in a long-lived cookie. */
export function setLangPreference(lang: SiteLang): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(lang)}; max-age=${MAX_AGE}; path=/; SameSite=Lax; Secure`;
}
