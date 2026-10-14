import { Timestamp } from "firebase-admin/firestore";
import { getAdminServices } from "@/firebase/admin";
import { getChallengeDay } from "@/lib/challenges/date";
import {
  getPublishedQuestionIds,
  toPublicQuestion,
} from "@/lib/challenges/content";
import { scoreAnswers } from "@/lib/challenges/scoring";
import { toChallengeResults } from "@/lib/challenges/attempt";
import type {
  ChallengeAttempt,
  ResultQuestion,
  SubmissionResponse,
} from "@/types/challenge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
class SubmissionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function POST(request: Request) {
  const respond = (body: SubmissionResponse, status = 200) =>
    Response.json(body, {
      status,
      headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
    });
  try {
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token)
      throw new SubmissionError(
        401,
        "Please sign in to submit your challenge.",
      );
    const { auth, db } = getAdminServices();
    const identity = await auth
      .verifyIdToken(token, true)
      .catch((cause: unknown) => {
        const code = (cause as { code?: string }).code;
        if (
          code &&
          [
            "auth/argument-error",
            "auth/invalid-id-token",
            "auth/id-token-expired",
            "auth/id-token-revoked",
            "auth/user-disabled",
            "auth/user-not-found",
          ].includes(code)
        )
          throw new SubmissionError(
            401,
            "Your sign-in has expired. Please sign in again.",
          );
        throw cause;
      });
    const { date, isWeekday } = getChallengeDay();
    if (!isWeekday)
      throw new SubmissionError(
        403,
        "Challenges are available Monday through Friday.",
      );
    const body: unknown = await request.json().catch(() => {
      throw new SubmissionError(400, "Invalid submission.");
    });
    if (!body || typeof body !== "object")
      throw new SubmissionError(400, "Invalid submission.");
    const input = body as Record<string, unknown>;
    if (
      Object.keys(input).some(
        (key) => !["challengeDate", "questionIds", "answers"].includes(key),
      ) ||
      input.challengeDate !== date ||
      !Array.isArray(input.questionIds) ||
      !Array.isArray(input.answers) ||
      input.answers.length !== 3 ||
      !input.answers.every(
        (answer) => Number.isInteger(answer) && answer >= 0 && answer < 4,
      )
    )
      throw new SubmissionError(
        400,
        "Please answer all three questions for today's challenge. Refresh if the challenge date has changed.",
      );
    const questionIds = input.questionIds as unknown[];
    const answers = input.answers as number[];
    const userRef = db.collection("users").doc(identity.uid);
    const attemptRef = userRef.collection("attempts").doc(date);
    const outcome = await db.runTransaction(async (transaction) => {
      const previous = await transaction.get(attemptRef);
      if (previous.exists)
        return {
          duplicate: true,
          results: toChallengeResults(previous.data()!),
        };
      const challenge = await transaction.get(
        db.collection("challenges").doc(date),
      );
      const ids = getPublishedQuestionIds(challenge.data(), date);
      if (!ids)
        throw new SubmissionError(
          404,
          "Today's challenge isn't available yet.",
        );
      if (
        questionIds.length !== 3 ||
        ids.some((id, index) => id !== questionIds[index])
      )
        throw new SubmissionError(
          400,
          "The challenge has changed. Please refresh before submitting.",
        );
      const documents = await transaction.getAll(
        ...ids.map((id) => db.collection("questions").doc(id)),
      );
      const questions: ResultQuestion[] = ids.map((id) => {
        const data = documents.find((document) => document.id === id)?.data();
        const question = toPublicQuestion(id, data);
        if (!question)
          throw new SubmissionError(
            503,
            "Today's challenge is temporarily unavailable. Please try again later.",
          );
        return {
          ...question,
          correctAnswerIndex: data!.correctAnswerIndex as number,
        };
      });
      const user = await transaction.get(userRef);
      if (!user.exists)
        throw new SubmissionError(
          409,
          "Please refresh to finish loading your profile before submitting.",
        );
      // Recheck on transaction retries, including retries crossing Central midnight.
      if (getChallengeDay().date !== date)
        throw new SubmissionError(
          409,
          "A new challenge day has started. Please refresh.",
        );
      const score = scoreAnswers(
        answers,
        questions.map((question) => question.correctAnswerIndex),
      );
      const attempt = {
        challengeDate: date,
        questionIds: ids,
        answers,
        ...score,
        questions,
        submittedAt: Timestamp.now(),
      } satisfies Omit<ChallengeAttempt, "submittedAt"> & {
        submittedAt: Timestamp;
      };
      const profile = user.data()!;
      const count = (value: unknown) =>
        typeof value === "number" && Number.isFinite(value) && value >= 0
          ? value
          : 0;
      const totalPoints =
        count(profile.totalPoints ?? profile.stats?.totalPoints) +
        score.pointsEarned;
      const gamesPlayed =
        count(profile.gamesPlayed ?? profile.stats?.challengesPlayed) + 1;
      transaction.create(attemptRef, attempt);
      transaction.update(userRef, {
        totalPoints,
        gamesPlayed,
        totalCorrect: count(profile.totalCorrect) + score.correctCount,
        lastPlayedDate: date,
        "stats.totalPoints": totalPoints,
        "stats.challengesPlayed": gamesPlayed,
      });
      return { duplicate: false, results: toChallengeResults(attempt) };
    });
    return respond(
      { status: "completed", results: outcome.results },
      outcome.duplicate ? 409 : 201,
    );
  } catch (cause) {
    if (cause instanceof SubmissionError)
      return respond({ status: "error", message: cause.message }, cause.status);
    console.error("Challenge submission failed", cause);
    return respond(
      {
        status: "error",
        message:
          "We couldn't submit your answers. Please try again. Refresh to check whether your submission was saved.",
      },
      500,
    );
  }
}
