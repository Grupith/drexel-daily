export interface AdminPlayer {
  id: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  locationId: string | null;
  createdAt: string | null;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  challengesCompleted: number;
  averageScore: number | null;
  lastPlayed: string | null;
}
export interface PlayersPage {
  items: AdminPlayer[];
  next: string | null;
  searchedBatch: boolean;
}
export interface PlayersSummary {
  registered: number;
  activeToday: number;
  completed: number;
  points: number;
}
export interface PlayerDetails {
  player: AdminPlayer;
  history: { date: string; points: number; correct: number; questions: number }[];
}
