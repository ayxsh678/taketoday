/**
 * Loads key=value pairs from .env.local into process.env.
 * Only sets keys that are not already present in the environment.
 * Strips surrounding single/double quotes from values.
 * Safe to call multiple times (no-op if file doesn't exist).
 */

import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");

export function loadEnv(envFile = ".env.local"): void {
  const fullPath = path.join(ROOT, envFile);
  if (!fsSync.existsSync(fullPath)) return;

  const lines = fsSync.readFileSync(fullPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && val && !(key in process.env)) process.env[key] = val;
  }
}
