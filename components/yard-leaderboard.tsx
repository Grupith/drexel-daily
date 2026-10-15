"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getYardLeaderboard } from "@/lib/yard-leaderboard-client";
import type { YardStanding } from "@/lib/yard-leaderboard";
import { cn } from "@/lib/utils";

export function YardLeaderboard({ preview = false }: { preview?: boolean }) {
  const { user, profile, loading } = useAuth();
  const [result, setResult] = useState<{ uid: string; yards?: YardStanding[]; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const uid = user?.uid;
  useEffect(() => {
    if (!uid || loading) return;
    let active = true;
    getYardLeaderboard(uid).then(
      (yards) => { if (active) setResult({ uid, yards }); },
      (cause: unknown) => {
        console.error("Could not load yard leaderboard", cause);
        if (active) setResult({ uid, error: "We couldn’t load the yard rankings. Please try again." });
      },
    );
    return () => { active = false; };
  }, [uid, loading, retry]);
  const current = result?.uid === uid ? result : null;
  return (
    <Card className={cn("w-full text-left", preview && "mt-10")}>
      <CardHeader>
        <h2 className="text-lg font-semibold leading-none">{preview ? "Yard Leaderboard" : "All-Time Rankings"}</h2>
        <p className="text-sm text-drexel-subtle">Which Drexel yard knows their stuff?</p>
      </CardHeader>
      <CardContent>
        {loading ? <p role="status">Loading yard rankings…</p> : !user ? (
          <p className="text-sm text-drexel-subtle">Sign in through Play to see the yard rankings.</p>
        ) : current?.error ? (
          <div role="alert">
            <p className="text-sm">{current.error}</p>
            <Button variant="outline" className="mt-3" onClick={() => { setResult(null); setRetry((value) => value + 1); }}>Try again</Button>
          </div>
        ) : !current?.yards ? <p role="status">Loading yard rankings…</p> : (
          <ol aria-label="Yards ranked by all-time points" className="space-y-2">
            {current.yards.slice(0, preview ? 3 : undefined).map((yard, index) => (
              <li key={yard.locationId} className={cn("flex items-center gap-3 rounded-lg border px-3 py-3 text-sm", profile?.locationId === yard.locationId && "border-drexel-action bg-drexel-action/5")}>
                <span className="w-12 shrink-0 font-semibold"><span aria-hidden="true">{["🥇", "🥈", "🥉"][index]} </span>{index + 1}.</span>
                <span className="min-w-0 flex-1 font-medium break-words">{yard.locationId}{profile?.locationId === yard.locationId && <span className="block text-xs font-normal text-drexel-subtle">Your yard</span>}</span>
                <span className="shrink-0 tabular-nums">{yard.totalPoints.toLocaleString("en-US")} <span className="text-drexel-subtle">pts</span></span>
              </li>
            ))}
          </ol>
        )}
        {preview && <Link href="/leaderboard" className="mt-5 inline-block py-2 text-sm font-semibold underline underline-offset-4">View Full Leaderboard →</Link>}
      </CardContent>
    </Card>
  );
}
