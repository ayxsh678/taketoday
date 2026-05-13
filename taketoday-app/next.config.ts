import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
};

export default withContentlayer(nextConfig);
