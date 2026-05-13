import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";

const nextConfig: NextConfig = {
  // firebase-admin pulls in node:path via fetch-blob → google-auth-library,
  // which webpack cannot bundle. Externalizing keeps it as a native Node.js
  // import and prevents "module not found: node:path" build errors.
  serverExternalPackages: ["firebase-admin"],
};

export default withContentlayer(nextConfig);
