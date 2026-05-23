// lib/config/env.ts

import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  SECRET_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  // Add more environment variables as needed
});

export const env = envSchema.parse(process.env);

if (env.NODE_ENV === 'development') {
  console.log(`Running in development mode with PORT=${env.PORT}`);
} else if (env.NODE_ENV === 'production') {
  console.log(`Running in production mode`);
}
