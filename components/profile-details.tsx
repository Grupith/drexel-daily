"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileDetails() {
  const { user, profile, loading, error, retryProfile } = useAuth();
  const photoURL = user?.photoURL || profile?.photoURL;
  const [failedPhotoURL, setFailedPhotoURL] = useState<string | null>(null);

  return (
    <div className="play-layout">
      <Link href="/" className="play-home">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to home
      </Link>
      <section className="play-card" aria-labelledby="profile-title">
        <h1 id="profile-title">Account</h1>
        {loading ? (
          <div role="status">
            <span className="sr-only">Loading your profile…</span>
            <div aria-hidden="true">
              <div className="mt-6 flex items-center gap-4">
                <Skeleton className="size-14 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-7 w-44 max-w-full" />
                  <Skeleton className="mt-1 h-6 w-60 max-w-full" />
                </div>
              </div>
              <div className="mt-6 border-t border-current/15 pt-5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-1 h-6 w-36" />
              </div>
              <Skeleton className="mt-8 h-7 w-32" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-current/15 p-4"
                  >
                    <Skeleton className="h-5 w-28 max-w-full" />
                    <Skeleton className="mt-2 h-8 w-12" />
                  </div>
                ))}
              </div>
              <Skeleton className="mt-8 h-12.5 w-45 max-w-full rounded-full" />
            </div>
          </div>
        ) : !user ? (
          <>
            <p className="my-4">Sign in to view your profile.</p>
            <Link
              href="/play"
              className="play-button inline-flex items-center justify-center"
            >
              Go to sign in
            </Link>
          </>
        ) : !profile ? (
          <>
            <p className="my-4" role="alert">
              {error || "We couldn't load your profile. Please try again."}
            </p>
            <button className="play-button" onClick={() => void retryProfile()}>
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-hidden="true"
              >
                {photoURL && photoURL !== failedPhotoURL ? (
                  <Image
                    src={photoURL}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="size-14 rounded-full object-cover"
                    onError={() => setFailedPhotoURL(photoURL)}
                  />
                ) : (
                  <UserRound size={28} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold wrap-break-word">
                  {user.displayName?.trim() ||
                    profile.displayName?.trim() ||
                    "Drexel team member"}
                </p>
                <p className="mt-1 wrap-break-word">
                  {user.email || profile.email || "No email available"}
                </p>
              </div>
            </div>
            <dl className="mt-6 border-t border-current/15 pt-5">
              <dt className="text-sm opacity-75">Drexel location</dt>
              <dd className="mt-1 font-medium">
                {profile.locationId || "Not selected yet"}
              </dd>
            </dl>
            <h2 className="mt-8 text-lg font-semibold">Your progress</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Current streak", profile.stats.currentStreak],
                ["Longest streak", profile.stats.longestStreak],
                ["Total points", profile.stats.totalPoints],
                ["Challenges played", profile.stats.challengesPlayed],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-current/15 p-4"
                >
                  <dt className="text-sm opacity-75">{label}</dt>
                  <dd className="mt-2 text-2xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/play"
              className="play-button mt-8 inline-flex items-center justify-center"
            >
              Play today
            </Link>
          </>
        )}
        {!loading && !user && error && (
          <p className="mt-4" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
