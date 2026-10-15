import type { Question } from "./challenge";
export type AdminQuestion = Omit<Question, "createdAt" | "isActive"> & {
    id: string;
    usage: "Unused" | "Draft" | "Published";
} & (
    | { type: "multiple_choice"; options: string[]; correctAnswerIndex: number }
    | { type: "estimate"; correctAnswer: number; unit?: string; minGuess?: number; maxGuess?: number }
);
export interface AdminChallenge {
    id: string;
    date: string;
    status: "draft" | "published";
    questionIds: string[];
    testUnavailableReason?: string | null;
}
export interface AdminPage<T> {
    items: T[];
    next: string | null;
}
