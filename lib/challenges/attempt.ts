import type { Timestamp } from "firebase-admin/firestore";
import type { ChallengeResults } from "@/types/challenge";

// Only server-created attempts are stored at this path.
export function toChallengeResults(
  data: FirebaseFirestore.DocumentData,
): ChallengeResults {
  return {
    challengeDate: data.challengeDate,
    questionIds: data.questionIds,
    answers: data.answers,
    correctCount: data.correctCount,
    pointsEarned: data.pointsEarned,
    questions: data.questions,
    submittedAt: (data.submittedAt as Timestamp).toDate().toISOString(),
  };
}
