import type { UserCountry } from "./getUserCountry";
import type { SiteLang } from "./langPreference";

/** Decodes a cookie value safely — returns undefined on malformed input. */
export function safeDecode(raw: string): string | undefined {
  try {
    return decodeURIComponent(raw);
  } catch {
    return undefined;
  }
}

/** Type guard: checks whether a value is a known UserCountry. */
export function isUserCountry(val: unknown): val is UserCountry {
  return val === "IN" || val === "US";
}

/** Type guard: checks whether a value is a known SiteLang. */
export function isSiteLang(val: unknown): val is SiteLang {
  return val === "en" || val === "hi";
}
