"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function SiteProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="tt-site-theme"
    >
      {children}
    </ThemeProvider>
  );
}
