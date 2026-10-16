"use client";

import { collection, getDocsFromServer } from "firebase/firestore";
import { db } from "@/firebase/config";
import { rankYards, type YardStanding } from "@/lib/yard-leaderboard";

// Deduplicate in-flight requests (including Strict Mode effect replays), but
// fetch fresh stored totals whenever a leaderboard view is visited again.
let cached: { uid: string; request: Promise<YardStanding[]> } | undefined;

export function getYardLeaderboard(uid: string): Promise<YardStanding[]> {
  if (cached?.uid === uid) return cached.request;
  const request = getDocsFromServer(collection(db, "locations")).then((snapshot) =>
    rankYards(new Map(snapshot.docs.map((doc) => [doc.id, doc.data().totalPoints]))),
  );
  cached = { uid, request };
  const clearRequest = () => {
    if (cached?.request === request) cached = undefined;
  };
  void request.then(clearRequest, clearRequest);
  return request;
}
