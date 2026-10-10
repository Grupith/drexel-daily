import type { Timestamp } from "firebase/firestore";

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  challengesPlayed: number;
}

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  locationId: string | null;
  role: "employee" | "admin";
  createdAt: Timestamp;
  stats: UserStats;
}
