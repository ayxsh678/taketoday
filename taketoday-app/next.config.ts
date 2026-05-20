import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
};

export default withContentlayer(nextConfig);
