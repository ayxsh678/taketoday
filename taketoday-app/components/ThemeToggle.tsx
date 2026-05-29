"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-7 w-7" />;

  function cycle() {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System mode";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${label} — click to cycle`}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-500 hover:text-ink transition-colors"
    >
      <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
    </button>
  );
}
