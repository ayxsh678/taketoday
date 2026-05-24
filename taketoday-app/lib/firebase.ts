import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { appConfig } from "@lib/config/app";

const firebaseConfig = {
    apiKey: appConfig.firebaseApiKey,
    authDomain: appConfig.firebaseAuthDomain,
    projectId: appConfig.firebaseProjectId,
    storageBucket: appConfig.firebaseStorageBucket,
    messagingSenderId: appConfig.firebaseMessagingSenderId,
    appId: appConfig.firebaseAppId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app;