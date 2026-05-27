import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Capture 20% of sessions for session replay
  replaysSessionSampleRate: 0.2,

  // Always capture replays on errors
  replaysOnErrorSampleRate: 1.0,

  // Only send to Sentry in production
  enabled: process.env.NODE_ENV === "production",

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
});
