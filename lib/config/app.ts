// lib/config/app.ts

import { env } from './env';

export const appConfig = {
  port: parseInt(env.PORT, 10),
  databaseUrl: env.DATABASE_URL,
  secretKey: env.SECRET_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  // Add more configuration options as needed
};
