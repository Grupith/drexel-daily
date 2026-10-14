import type { Timestamp } from "firebase/firestore";

export interface Question {
  text: string;
  category: string;
  type: "multiple_choice";
  options: string[];
  correctAnswerIndex: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: Timestamp;
}

// Only explicitly approved presentation fields cross the API boundary.
export type PublicQuestion = Pick<Question, "text" | "category" | "type" | "options"> & {
  id: string;
  imageUrl: string | null;
};

export interface DailyChallenge {
  date: string;
  questionIds: [string, string, string];
  status: "draft" | "published";
  createdAt: Timestamp;
}

export type DailyChallengeResponse =
  | { status: "completed"; date: string; results: ChallengeResults }
  | { status: "available"; date: string; questions: PublicQuestion[] }
  | { status: "weekend" | "unavailable" | "error"; date: string; message: string };

export interface ChallengeSubmission {
  challengeDate: string;
  questionIds: string[];
  answers: number[];
}
export type ResultQuestion = PublicQuestion & { correctAnswerIndex: number };
export interface ChallengeAttempt {
  challengeDate: string;
  questionIds: string[];
  answers: number[];
  correctCount: number;
  pointsEarned: number;
  questions: ResultQuestion[];
  submittedAt: Timestamp;
}
export type ChallengeResults = Omit<ChallengeAttempt, "submittedAt"> & { submittedAt: string };
export type SubmissionResponse =
  | { status: "completed"; results: ChallengeResults }
  | { status: "error"; message: string };
