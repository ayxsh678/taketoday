import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";

const nextConfig: NextConfig = {
  // firebase-admin and its transitive deps (google-auth-library → gaxios →
  // node-fetch → fetch-blob) use node: protocol imports that webpack cannot
  // handle. serverExternalPackages keeps them out of the server bundle;
  // the webpack externals function below catches any node: URI that still
  // slips through (e.g. via ESM sub-paths or nested deps).
  serverExternalPackages: [
    "firebase-admin",
    "@auth/firebase-adapter",
    "google-auth-library",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize any remaining node: protocol imports so webpack doesn't
      // attempt to bundle Node.js built-ins (node:path, node:fs, etc.).
      const existingExternals = config.externals ?? [];
      config.externals = [
        ...(Array.isArray(existingExternals)
          ? existingExternals
          : [existingExternals]),
        ({ request }: { request?: string }, callback: (err?: null, result?: string) => void) => {
          if (request?.startsWith("node:")) {
            return callback(null, `commonjs ${request.slice(5)}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default withContentlayer(nextConfig);
