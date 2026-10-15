import type { Timestamp } from "firebase/firestore";

interface QuestionFields {
  text: string;
  category: string;
  imageUrl?: string | null;
  difficulty?: "Easy" | "Medium" | "Hard";
  explanation?: string;
  isActive: boolean;
  createdAt: Timestamp;
}
export type Question = QuestionFields & (
  | { type: "multiple_choice"; options: string[]; correctAnswerIndex: number }
  | { type: "estimate"; correctAnswer: number; unit?: string; minGuess?: number; maxGuess?: number }
);
interface PublicQuestionFields {
  id: string;
  text: string;
  category: string;
  imageUrl: string | null;
}
// Answer keys never cross this boundary before submission.
export type PublicQuestion = PublicQuestionFields & (
  | { type: "multiple_choice"; options: string[] }
  | { type: "estimate"; unit?: string; minGuess?: number; maxGuess?: number }
);

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
export type ResultQuestion =
  | (Extract<PublicQuestion, { type: "multiple_choice" }> & { correctAnswerIndex: number })
  | (Extract<PublicQuestion, { type: "estimate" }> & { correctAnswer: number });
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
