import { defineConfig } from "prisma/config";
import { loadEnvFile } from "node:process";

try { loadEnvFile(".env.local"); } catch {}
try { loadEnvFile(".env"); } catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
