"use client";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { rankYards, type YardStanding } from "@/lib/yard-leaderboard";

// Share one request between views and Strict Mode mounts. Refresh on navigation
// after five minutes; no listeners, timers, polling, or initialization writes.
let cached: { uid: string; expires: number; request: Promise<YardStanding[]> } | undefined;

export function getYardLeaderboard(uid: string): Promise<YardStanding[]> {
  if (cached?.uid === uid && cached.expires > Date.now()) return cached.request;
  const request = getDocs(collection(db, "locations")).then((snapshot) =>
    rankYards(new Map(snapshot.docs.map((doc) => [doc.id, doc.data().totalPoints]))),
  );
  cached = { uid, expires: Date.now() + 5 * 60_000, request };
  void request.catch(() => {
    if (cached?.request === request) cached = undefined;
  });
  return request;
}
