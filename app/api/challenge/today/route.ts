import { toChallengeResults } from "@/lib/challenges/attempt";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminServices } from "@/firebase/admin";
import { getChallengeDay } from "@/lib/challenges/date";
import {
  getPublishedQuestionIds,
  toPublicQuestion,
} from "@/lib/challenges/content";
import type { DailyChallengeResponse, PublicQuestion } from "@/types/challenge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { date, isWeekday } = getChallengeDay();
  function respond(body: DailyChallengeResponse, status = 200) {
    return Response.json(body, {
      status,
      headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
    });
  }
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token)
    return respond(
      { status: "error", date, message: "Please sign in to play." },
      401,
    );

  try {
    const { auth, db } = getAdminServices();
    let identity: DecodedIdToken;
    try {
      identity = await auth.verifyIdToken(token, true);
    } catch (cause) {
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
      ) {
        return respond(
          {
            status: "error",
            date,
            message: "Your sign-in has expired. Please sign in again.",
          },
          401,
        );
      }
      throw cause;
    }
    if (!isWeekday)
      return respond({
        status: "weekend",
        date,
        message:
          "Challenges are available Monday through Friday. Come back on Monday!",
      });
    const attempt = await db
      .collection("users")
      .doc(identity.uid)
      .collection("attempts")
      .doc(date)
      .get();
    if (attempt.exists)
      return respond({
        status: "completed",
        date,
        results: toChallengeResults(attempt.data()!),
      });
    const challenge = await db.collection("challenges").doc(date).get();
    const ids = getPublishedQuestionIds(challenge.data(), date);
    if (!ids)
      return respond({
        status: "unavailable",
        date,
        message:
          "Today's challenge isn't available yet. Please check back later.",
      });
    const snapshots = await db.getAll(
      ...ids.map((id) => db.collection("questions").doc(id)),
    );
    const questions = ids.map((id) =>
      toPublicQuestion(
        id,
        snapshots.find((snapshot) => snapshot.id === id)?.data(),
      ),
    );
    if (questions.some((question) => !question)) {
      console.error("Published challenge has missing or invalid questions", {
        date,
      });
      return respond({
        status: "unavailable",
        date,
        message:
          "Today's challenge is temporarily unavailable. Please check back later.",
      });
    }
    return respond({
      status: "available",
      date,
      questions: questions as PublicQuestion[],
    });
  } catch (cause) {
    console.error("Could not load today's challenge", cause);
    return respond(
      {
        status: "error",
        date,
        message: "We couldn't load your challenge. Please try again.",
      },
      500,
    );
  }
}
