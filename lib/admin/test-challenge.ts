import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { AdminError } from "./auth";
import { validChallengeDate } from "./validation";
import { toPublicQuestion, isValidAnswer } from "@/lib/challenges/content";
import { scoreAnswers } from "@/lib/challenges/scoring";
import type {
  ChallengeResults,
  PublicQuestion,
  ResultQuestion,
} from "@/types/challenge";

export async function loadTestChallenge(db: Firestore, date: string) {
  if (!validChallengeDate(date))
    throw new AdminError(400, "Invalid challenge date.");
  const snapshot = await db.collection("challenges").doc(date).get();
  if (!snapshot.exists) throw new AdminError(404, "Challenge not found.");
  const data = snapshot.data()!;
  const ids: unknown = data.questionIds;
  if (
    data.date !== date ||
    !Array.isArray(ids) ||
    ids.length !== 3 ||
    !ids.every(
      (id) => typeof id === "string" && id.trim() && !id.includes("/"),
    ) ||
    new Set(ids).size !== 3
  )
    throw new AdminError(
      400,
      "Testing requires exactly three valid questions.",
    );
  const snapshots = await db.getAll(
    ...ids.map((id) => db.collection("questions").doc(id)),
  );
  const questions: PublicQuestion[] = [];
  const resultQuestions: ResultQuestion[] = [];
  for (const snapshot of snapshots) {
    const data = snapshot.data();
    const question = toPublicQuestion(snapshot.id, data);
    if (!question || data?.isActive !== true)
      throw new AdminError(
        400,
        "Testing requires exactly three valid, active questions.",
      );
    questions.push(question);
    resultQuestions.push(
      question.type === "estimate"
        ? { ...question, correctAnswer: data.correctAnswer as number }
        : {
            ...question,
            correctAnswerIndex: data.correctAnswerIndex as number,
          },
    );
  }
  return { date, questions, resultQuestions };
}

// Read-only scoring: no attempts, transactions, profile updates, or other writes.
export async function scoreTestChallenge(
  db: Firestore,
  date: string,
  body: unknown,
): Promise<ChallengeResults> {
  if (!body || typeof body !== "object")
    throw new AdminError(400, "Invalid submission.");
  const input = body as Record<string, unknown>;
  if (
    Object.keys(input).some(
      (key) => !["challengeDate", "questionIds", "answers"].includes(key),
    ) ||
    input.challengeDate !== date ||
    !Array.isArray(input.questionIds) ||
    input.questionIds.length !== 3 ||
    !Array.isArray(input.answers) ||
    input.answers.length !== 3
  )
    throw new AdminError(400, "Please answer all three questions.");
  const { questions, resultQuestions } = await loadTestChallenge(db, date);
  const answers = input.answers;
  const ids = input.questionIds;
  if (
    questions.some(
      (question, index) =>
        ids[index] !== question.id || !isValidAnswer(question, answers[index]),
    )
  )
    throw new AdminError(
      400,
      "Invalid answers or challenge changed. Reload and try again.",
    );
  return {
    challengeDate: date,
    questionIds: questions.map((q) => q.id),
    answers: answers as number[],
    ...scoreAnswers(
      answers as number[],
      resultQuestions.map((q) =>
        q.type === "estimate" ? q.correctAnswer : q.correctAnswerIndex,
      ),
    ),
    questions: resultQuestions,
    submittedAt: new Date().toISOString(),
  };
}
