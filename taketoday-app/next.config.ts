import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";
import { withSentryConfig } from "@sentry/nextjs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withSentryConfig(withContentlayer(nextConfig), {
  // Sentry org + project set via SENTRY_ORG and SENTRY_PROJECT env vars
  silent: true,
  // Upload source maps only in CI/production
  disableLogger: true,
  // Automatically instrument Next.js server components and API routes
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
  // Avoid bundling Sentry into Edge Runtime unnecessarily
  tunnelRoute: "/monitoring",
});
