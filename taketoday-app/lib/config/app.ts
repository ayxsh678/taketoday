// lib/config/app.ts

import { getEnv } from './env';

export const appConfig = {
  port: parseInt((getEnv('PORT', '3000') ?? '3000'), 10),
  databaseUrl: getEnv('DATABASE_URL', '') ?? '',
  secretKey: getEnv('SECRET_KEY', '') ?? '',
  geminiApiKey: getEnv('GEMINI_API_KEY', '') ?? '',
  openaiApiKey: getEnv('OPENAI_API_KEY', '') ?? '',
  buttondownApiKey: getEnv('BUTTONDOWN_API_KEY', '') ?? '',
  cloudinaryUrl: getEnv('CLOUDINARY_URL', '') ?? '',
  siteUrl: getEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000') ?? 'http://localhost:3000',
  firebaseApiKey: getEnv('NEXT_PUBLIC_FIREBASE_API_KEY', '') ?? '',
  firebaseAppId: getEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '') ?? '',
  firebaseAuthDomain: getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', '') ?? '',
  firebaseMessagingSenderId: getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '') ?? '',
  firebaseProjectId: getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', '') ?? '',
  firebaseStorageBucket: getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', '') ?? '',
  internalServiceToken: getEnv('INTERNAL_SERVICE_TOKEN', '') ?? '',
  pythonServiceUrl:
    getEnv('PYTHON_SERVICE_URL', '') ??
    getEnv('NEXT_PUBLIC_PYTHON_SERVICE_URL', '') ??
    '',
  pythonServiceTimeout: 30000,
  vercelProjectProductionUrl: getEnv('VERCEL_PROJECT_PRODUCTION_URL', '') ?? '',
  // Auth configuration
  authGoogleId: getEnv('AUTH_GOOGLE_ID', '') ?? '',
  authGoogleSecret: getEnv('AUTH_GOOGLE_SECRET', '') ?? '',
  nextauthSecret: getEnv('NEXTAUTH_SECRET', '') ?? '',
  // Admin role configuration (comma-separated email lists)
  adminSuperAdmins: (getEnv('ADMIN_SUPER_ADMINS', '') ?? '').split(',').filter(Boolean) || [],
  adminContentManagers: (getEnv('ADMIN_CONTENT_MANAGERS', '') ?? '').split(',').filter(Boolean) || [],
  adminEditors: (getEnv('ADMIN_EDITORS', '') ?? '').split(',').filter(Boolean) || [],
  adminSocialManagers: (getEnv('ADMIN_SOCIAL_MANAGERS', '') ?? '').split(',').filter(Boolean) || [],
  adminEmails: (getEnv('ADMIN_EMAILS', '') ?? '').split(',').filter(Boolean) || [],
  isDevelopment: (getEnv('NODE_ENV', 'development') as string) === 'development',
  // Multi-provider AI keys
  groqApiKey: getEnv('GROQ_API_KEY', '') ?? '',
  openrouterApiKey: getEnv('OPENROUTER_API_KEY', '') ?? '',
  mistralApiKey: getEnv('MISTRAL_API_KEY', '') ?? '',
  // Intelligence pipeline
  serperApiKey: getEnv('SERPER_API_KEY', '') ?? '',
  polygonApiKey: getEnv('POLYGON_API_KEY', '') ?? '',
  // Multi-model AI routing
  geminiFlashModel: getEnv('GEMINI_FLASH_MODEL', 'gemini-2.0-flash') ?? 'gemini-2.0-flash',
  geminiProModel: getEnv('GEMINI_PRO_MODEL', 'gemini-1.5-pro') ?? 'gemini-1.5-pro',
  gpt55Model: getEnv('GPT55_MODEL', 'gpt-4o') ?? 'gpt-4o',
};
