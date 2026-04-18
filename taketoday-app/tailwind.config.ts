import type { Config } from "tailwindcss";

/**
 * TakeToday — Tailwind configuration
 * Extends the default theme with the TakeToday design system tokens
 * defined in design-system.md. Nothing here is decorative — every token
 * maps to a component rule in the spec.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-instrument)", "ui-serif", "Georgia"],
        mono: ["var(--font-jetbrains)", "ui-monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0A0A",
          900: "#111111",
          700: "#1F1F1F",
          500: "#6B6B6B",
          400: "#9A9A9A",
          300: "#C9C7C1",
          200: "#E5E3DD",
          100: "#EFEDE6",
        },
        paper: "#FAFAF7",
        accent: "#C8553D",
      },
      letterSpacing: {
        tightest: "-0.04em",
        "tighter-2": "-0.03em",
      },
      maxWidth: {
        prose: "68ch",
        container: "1400px",
      },
      fontSize: {
        "display-xl": ["168px", { lineHeight: "0.88", letterSpacing: "-0.04em" }],
        "display-lg": ["96px", { lineHeight: "0.90", letterSpacing: "-0.03em" }],
        "display-md": ["72px", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(.2,.7,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
