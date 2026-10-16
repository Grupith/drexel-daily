import "server-only";
import {
  AggregateField,
  FieldPath,
  Timestamp,
  type Firestore,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import { AdminError } from "./auth";
import { validId } from "./data";
import { DREXEL_LOCATIONS } from "@/lib/locations";
import { getChallengeDay } from "@/lib/challenges/date";
import type {
  AdminPlayer,
  PlayersPage,
  PlayersSummary,
  PlayerDetails,
} from "@/types/players";

const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
export function toAdminPlayer(id: string, data: DocumentData): AdminPlayer {
  const completed = count(data.gamesPlayed ?? data.stats?.challengesPlayed);
  const points = count(data.totalPoints ?? data.stats?.totalPoints);
  return {
    id,
    displayName:
      typeof data.displayName === "string"
        ? data.displayName
        : "Unnamed player",
    email: typeof data.email === "string" ? data.email : "",
    photoURL:
      typeof data.photoURL === "string" && /^https:\/\//.test(data.photoURL)
        ? data.photoURL
        : null,
    locationId: typeof data.locationId === "string" ? data.locationId : null,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
    totalPoints: points,
    currentStreak: count(data.stats?.currentStreak),
    longestStreak: count(data.stats?.longestStreak),
    challengesCompleted: completed,
    averageScore: completed ? points / completed : null,
    lastPlayed:
      typeof data.lastPlayedDate === "string" ? data.lastPlayedDate : null,
  };
}
const sortFields: Record<string, string> = {
  registered: "createdAt",
  points: "stats.totalPoints",
  streak: "stats.currentStreak",
  completed: "stats.challengesPlayed",
  lastPlayed: "lastPlayedDate",
};
export async function listPlayers(
  db: Firestore,
  params: URLSearchParams,
): Promise<PlayersPage> {
  const sort = params.get("sort") ?? "registered";
  const field = Object.hasOwn(sortFields, sort) ? sortFields[sort] : undefined;
  const direction = params.get("direction") ?? "desc";
  const location = params.get("location") ?? "";
  const search = (params.get("search") ?? "").trim().toLocaleLowerCase();
  if (
    !field ||
    !["asc", "desc"].includes(direction) ||
    (location && !DREXEL_LOCATIONS.includes(location)) ||
    search.length > 100
  )
    throw new AdminError(400, "Invalid player filters.");
  let query: Query = db.collection("users");
  if (location) query = query.where("locationId", "==", location);
  query = query
    .orderBy(field, direction as "asc" | "desc")
    .orderBy(FieldPath.documentId(), direction as "asc" | "desc");
  const cursor = params.get("cursor");
  if (cursor) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(cursor, "base64url").toString());
    } catch {
      throw new AdminError(400, "Invalid page cursor.");
    }
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 2 ||
      typeof parsed[1] !== "string" ||
      (field === "createdAt"
        ? !Array.isArray(parsed[0]) ||
          parsed[0].length !== 2 ||
          !parsed[0].every(Number.isInteger)
        : !["string", "number"].includes(typeof parsed[0]))
    )
      throw new AdminError(400, "Invalid page cursor.");
    validId(parsed[1]);
    let value;
    try {
      value =
        field === "createdAt"
          ? new Timestamp(parsed[0][0], parsed[0][1])
          : parsed[0];
    } catch {
      throw new AdminError(400, "Invalid page cursor.");
    }
    query = query.startAfter(value, parsed[1]);
  }
  const maximum = search ? 100 : 26;
  const snapshot = await query.limit(maximum).get();
  const items: AdminPlayer[] = [];
  let last: (typeof snapshot.docs)[number] | undefined;
  let consumed = 0;
  for (const doc of snapshot.docs) {
    if (!search && items.length === 25) break;
    last = doc;
    consumed++;
    const player = toAdminPlayer(doc.id, doc.data());
    if (
      !search ||
      `${player.displayName}\n${player.email}`
        .toLocaleLowerCase()
        .includes(search)
    )
      items.push(player);
    if (items.length === 25) break;
  }
  const value = last?.get(field);
  return {
    items,
    searchedBatch: !!search,
    next:
      last && (consumed < snapshot.size || snapshot.size === maximum)
        ? Buffer.from(
            JSON.stringify([
              field === "createdAt"
                ? [value.seconds, value.nanoseconds]
                : value,
              last.id,
            ]),
          ).toString("base64url")
        : null,
  };
}
export async function playersSummary(db: Firestore): Promise<PlayersSummary> {
  const users = db.collection("users");
  const [registered, active, totals] = await Promise.all([
    users.count().get(),
    users.where("lastPlayedDate", "==", getChallengeDay().date).count().get(),
    users
      .aggregate({
        points: AggregateField.sum("stats.totalPoints"),
        completed: AggregateField.sum("stats.challengesPlayed"),
      })
      .get(),
  ]);
  return {
    registered: registered.data().count,
    activeToday: active.data().count,
    points: totals.data().points,
    completed: totals.data().completed,
  };
}
export async function playerDetails(
  db: Firestore,
  id: string,
): Promise<PlayerDetails> {
  const ref = db.collection("users").doc(validId(id));
  const profile = await ref.get();
  if (!profile.exists) throw new AdminError(404, "Player not found.");
  const attempts = await ref
    .collection("attempts")
    .orderBy("challengeDate", "desc")
    .limit(20)
    .get();
  return {
    player: toAdminPlayer(id, profile.data()!),
    history: attempts.docs.map((doc) => {
      const data = doc.data();
      return {
        date: data.challengeDate,
        points: count(data.pointsEarned),
        correct: count(data.correctCount),
        questions: Array.isArray(data.questionIds)
          ? data.questionIds.length
          : 0,
      };
    }),
  };
}
