// Centralized application configuration
// Loads configuration from environment variables with fallback values

export const appConfig = {
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || "",

  // Environment flag
  isDevelopment: process.env.NODE_ENV === "development",

  // Python service configuration
  pythonServiceUrl: process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || "",
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || "",
  pythonServiceTimeout: parseInt(process.env.NEXT_PUBLIC_PYTHON_SERVICE_TIMEOUT || "10000", 10),

  // Firebase configuration
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",

  // Add other configuration fields as needed
};
