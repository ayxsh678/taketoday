export type SiteLang = "en" | "hi";

const COOKIE_KEY = "tt_lang";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const DEFAULT_LANG: SiteLang = "en";

/** Returns the user's persisted language preference, defaulting to "en". */
export function getLangPreference(): SiteLang {
  if (typeof document === "undefined") return DEFAULT_LANG;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`),
  );
  const val = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return val === "en" || val === "hi" ? val : DEFAULT_LANG;
}

/** Persists the user's language choice in a long-lived cookie. */
export function setLangPreference(lang: SiteLang): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(lang)}; max-age=${MAX_AGE}; path=/; SameSite=Lax; Secure`;
}
