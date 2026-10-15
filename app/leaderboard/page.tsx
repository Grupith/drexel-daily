import type { Metadata } from "next";
import Link from "next/link";
import { YardLeaderboard } from "@/components/yard-leaderboard";

export const metadata: Metadata = { title: "Yard Leaderboard | Drexel Daily" };

export default function LeaderboardPage() {
  return (
    <div className="min-h-svh bg-drexel-canvas font-drexel text-drexel-ink">
      <main className="mx-auto w-full max-w-160 px-6 py-10">
        <Link
          href="/"
          className="inline-block py-2 text-sm underline underline-offset-4"
        >
          ← Drexel Daily
        </Link>
        <h1 className="mt-5 mb-6 text-3xl font-bold tracking-tight">
          Yard Leaderboard
        </h1>
        <YardLeaderboard />
      </main>
    </div>
  );
}
