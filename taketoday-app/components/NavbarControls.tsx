"use client";

/**
 * TakeToday — NavbarControls
 *
 * Client-only interactive controls in the navbar:
 *   - Language switcher: EN / HI (persisted in cookie)
 *   - Country selector: Auto / IN / US (persisted in cookie)
 *
 * Extracted from Navbar so the rest of the nav stays a server component.
 * Preferences are read on mount from cookies to avoid SSR mismatch.
 */

import { useEffect, useState } from "react";
import {
  getLangPreference,
  setLangPreference,
  type SiteLang,
} from "@/lib/personalization/langPreference";
import {
  getCountryPreference,
  setCountryPreference,
  clearCountryPreference,
} from "@/lib/personalization/countryPreference";
import type { UserCountry } from "@/lib/personalization/getUserCountry";

type CountryOption = UserCountry | "auto";

const LANG_LABELS: Record<SiteLang, string> = { en: "EN", hi: "HI" };
const COUNTRY_LABELS: Record<CountryOption, string> = {
  auto: "Auto",
  IN: "IN",
  US: "US",
};

export function NavbarControls() {
  const [lang, setLang] = useState<SiteLang>("en");
  const [country, setCountry] = useState<CountryOption>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLang(getLangPreference());
    const pref = getCountryPreference();
    setCountry(pref ?? "auto");
    setMounted(true);
  }, []);

  function handleLang(next: SiteLang) {
    setLangPreference(next);
    setLang(next);
  }

  function handleCountry(next: CountryOption) {
    if (next === "auto") {
      clearCountryPreference();
    } else {
      setCountryPreference(next);
    }
    setCountry(next);
  }

  // Suppress until hydrated to avoid flash of wrong state.
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 text-[11px] font-mono tracking-wide">
      {/* Language switcher */}
      <div
        role="group"
        aria-label="Language"
        className="flex items-center rounded-full border border-ink-200 overflow-hidden"
      >
        {(["en", "hi"] as SiteLang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => handleLang(l)}
            aria-pressed={lang === l}
            className={
              lang === l
                ? "px-2.5 py-1 bg-ink text-paper"
                : "px-2.5 py-1 text-ink-600 hover:text-ink transition-colors"
            }
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      <span aria-hidden className="text-ink-300 mx-0.5">·</span>

      {/* Country selector */}
      <div
        role="group"
        aria-label="Country"
        className="flex items-center rounded-full border border-ink-200 overflow-hidden"
      >
        {(["auto", "IN", "US"] as CountryOption[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleCountry(c)}
            aria-pressed={country === c}
            className={
              country === c
                ? "px-2.5 py-1 bg-ink text-paper"
                : "px-2.5 py-1 text-ink-600 hover:text-ink transition-colors"
            }
          >
            {COUNTRY_LABELS[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
