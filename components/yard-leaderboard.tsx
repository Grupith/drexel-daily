"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getYardLeaderboard } from "@/lib/yard-leaderboard-client";
import type { YardStanding } from "@/lib/yard-leaderboard";
import { cn } from "@/lib/utils";

const podiumStyles = [
  "border-amber-400 bg-linear-to-br from-amber-100 via-amber-200 to-amber-300 text-amber-950 dark:border-yellow-400 dark:from-yellow-800 dark:via-yellow-700 dark:to-yellow-600 dark:text-yellow-50",
  "border-slate-300 bg-linear-to-br from-slate-100 to-slate-200 text-slate-900 dark:border-slate-400/60 dark:from-slate-700 dark:to-slate-600 dark:text-slate-100",
  "border-orange-300 bg-linear-to-br from-orange-100 to-orange-200 text-orange-950 dark:border-orange-400/60 dark:from-orange-950 dark:to-orange-800 dark:text-orange-100",
];

export function YardLeaderboard({ preview = false }: { preview?: boolean }) {
  const { user, loading } = useAuth();
  const [result, setResult] = useState<{
    uid: string;
    yards?: YardStanding[];
    error?: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const uid = user?.uid;
  useEffect(() => {
    if (!uid || loading) return;
    let active = true;
    getYardLeaderboard(uid).then(
      (yards) => {
        if (active) setResult({ uid, yards });
      },
      (cause: unknown) => {
        console.error("Could not load yard leaderboard", cause);
        if (active)
          setResult({
            uid,
            error: "We couldn’t load the yard rankings. Please try again.",
          });
      },
    );
    return () => {
      active = false;
    };
  }, [uid, loading, retry]);
  const current = result?.uid === uid ? result : null;
  return (
    <Card
      className={cn(
        "w-full border-drexel-panel-border bg-drexel-panel text-left text-drexel-ink",
        preview && "mt-10",
      )}
    >
      <CardHeader>
        <h2 className="text-lg font-semibold leading-none">
          {preview ? "Yard Leaderboard" : "All-Time Rankings"}
        </h2>
        <p className="text-sm text-drexel-subtle">
          Which Drexel yard knows their stuff?
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p role="status">Loading yard rankings…</p>
        ) : !user ? (
          <p className="text-sm text-drexel-subtle">
            Sign in through Play to see the yard rankings.
          </p>
        ) : current?.error ? (
          <div role="alert">
            <p className="text-sm">{current.error}</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                setResult(null);
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </Button>
          </div>
        ) : !current?.yards ? (
          <p role="status">Loading yard rankings…</p>
        ) : (
          <ol
            aria-label="Yards ranked by all-time points"
            className="space-y-2"
          >
            {current.yards
              .slice(0, preview ? 3 : undefined)
              .map((yard, index) => (
                <li
                  key={yard.locationId}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm",
                    index < 3
                      ? cn("shadow-sm", podiumStyles[index])
                      : "border-drexel-panel-border",
                    index === 0 &&
                      "py-5 text-base shadow-lg shadow-amber-500/20 dark:shadow-yellow-500/15",
                  )}
                >
                  <span className="w-12 shrink-0 font-semibold">
                    <span aria-hidden="true">{["🥇", "🥈", "🥉"][index]} </span>
                    {index + 1}.
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 font-medium wrap-break-word",
                      index === 0 && "font-bold",
                    )}
                  >
                    {yard.locationId}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      index === 0 && "font-bold",
                    )}
                  >
                    {yard.totalPoints.toLocaleString("en-US")}{" "}
                    <span
                      className={
                        index < 3 ? "opacity-80" : "text-drexel-subtle"
                      }
                    >
                      pts
                    </span>
                  </span>
                </li>
              ))}
          </ol>
        )}
        {preview && (
          <Link
            href="/leaderboard"
            className="mt-5 inline-block py-2 text-sm font-semibold text-drexel-link underline underline-offset-4"
          >
            View Full Leaderboard →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
