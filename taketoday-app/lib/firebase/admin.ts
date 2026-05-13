import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let _db: ReturnType<typeof getFirestore> | undefined;

/**
 * Returns the Firestore instance, initializing firebase-admin on first call.
 *
 * Lazy on purpose — module-level initializeApp() would run during the Next.js
 * build phase (before env vars exist), causing "Invalid PEM" errors. Deferring
 * to function call time means firebase only initializes at request time.
 */
export function getDb() {
  if (_db) return _db;

  const apps = getApps();
  const app =
    apps.length > 0
      ? apps[0]!
      : (() => {
          const projectId = process.env.FIREBASE_PROJECT_ID;
          const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
          // Vercel stores multiline secrets with literal \n — restore newlines.
          const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n",
          );

          if (!projectId || !clientEmail || !privateKey) {
            throw new Error(
              "Missing Firebase env vars. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
            );
          }

          return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
        })();

  _db = getFirestore(app);
  return _db;
}
