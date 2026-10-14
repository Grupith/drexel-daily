import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function getAdminServices() {
  const app =
    getApps().find((app) => app.name === "drexel-daily-server") ??
    initializeApp(
      {
        credential: applicationDefault(),
        projectId:
          process.env.FIREBASE_PROJECT_ID ??
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      },
      "drexel-daily-server",
    );
  return { auth: getAuth(app), db: getFirestore(app) };
}
