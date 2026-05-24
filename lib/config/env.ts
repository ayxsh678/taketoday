// lib/config/env.ts

import { z } from 'zod';

// Determine if we're in a build context where we want to be more lenient
const isBuildContext = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-development-server';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('3000'),
  // DATABASE_URL is required for runtime but can be optional during build
  DATABASE_URL: z.string().optional(),
  // SECRET_KEY is critical for security but can be optional during build
  SECRET_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  BUTTONDOWN_API_KEY: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  // NEXT_PUBLIC_SITE_URL should have a safe fallback for development/build
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_INTERNAL_SERVICE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_PYTHON_SERVICE_URL: z.string().url().optional(),
  NEXT_PUBLIC_REQUIRE_2FA: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().url().optional(),
  // Auth configuration
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  // NEXTAUTH_SECRET is important but can be optional during build
  NEXTAUTH_SECRET: z.string().optional(),
  // Admin role configuration (comma-separated email lists)
  ADMIN_SUPER_ADMINS: z.string().optional(),
  ADMIN_CONTENT_MANAGERS: z.string().optional(),
  ADMIN_EDITORS: z.string().optional(),
  ADMIN_SOCIAL_MANAGERS: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

// Parse with loose validation in build context, strict in runtime
let env: any;
if (isBuildContext) {
  // In build context, parse loosely to avoid crashes
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn('⚠️  Environment validation warnings during build:', parsed.error.format());
    // In build context, we'll use an empty object and let getEnv return fallbacks
    env = {};
  } else {
    env = parsed.data;
  }
} else {
  // Strict validation for runtime
  env = envSchema.parse(process.env);
}

export { env };

if (env.NODE_ENV === 'development') {
  console.log(`Running in development mode with PORT=${env.PORT}`);
} else if (env.NODE_ENV === 'production') {
  console.log(`Running in production mode`);
}

// Helper function to get env value with runtime validation
export function getEnv<T>(key: keyof typeof envSchema._def.shape, fallback?: T): T | undefined {
  if (isBuildContext) {
    // During build, return fallback or undefined for missing values
    const value = (env as any)[key];
    return value ?? fallback;
  }
  // During runtime, validate strictly
  const value = (env as any)[key];
  if (value === undefined && fallback === undefined) {
    // Check if this is actually required for runtime
    const requiredKeys = ['SECRET_KEY', 'NEXTAUTH_SECRET', 'DATABASE_URL'] as const;
    if (requiredKeys.includes(key as typeof requiredKeys[number])) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback;
  }
  return value ?? fallback;
}
