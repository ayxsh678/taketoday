import type { Region } from "@/types/article";

/** Country codes that map to a known Region. GLOBAL is not a user country. */
export type UserCountry = Exclude<Region, "GLOBAL">;

const KNOWN: readonly UserCountry[] = ["IN", "US"];
const DEFAULT: UserCountry = "IN";

/**
 * Infers the user's country from navigator.language.
 *
 * navigator.language is a BCP 47 tag like "en-IN", "en-US", "hi-IN".
 * We extract the region subtag (the part after the last "-") and match it
 * against the known set. Anything unrecognised falls back to "IN".
 *
 * Safe to call during SSR — returns DEFAULT when navigator is unavailable.
 */
export function getUserCountry(): UserCountry {
  if (typeof navigator === "undefined") return DEFAULT;
  const tag = navigator.language ?? "";
  const country = tag.split("-").pop()?.toUpperCase() ?? "";
  return KNOWN.includes(country as UserCountry) ? (country as UserCountry) : DEFAULT;
}
