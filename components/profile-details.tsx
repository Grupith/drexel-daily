"use client";

import { BrandTiles } from "@/components/brand-tiles";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";

export function ProfileDetails() {
  const { user, profile, loading, error, retryProfile } = useAuth();
  const photoURL = user?.photoURL || profile?.photoURL;
  const [failedPhotoURL, setFailedPhotoURL] = useState<string | null>(null);

  return (
    <div className="w-full max-w-130">
      <Link
        href="/"
        className="
        inline-flex min-h-11 items-center gap-2 text-sm text-drexel-subtle whitespace-nowrap
        hover:text-drexel-brand dark:hover:text-drexel-subtle focus-visible:outline-2
        focus-visible:outline-solid focus-visible:outline-drexel-focus focus-visible:outline-offset-4
        leading-normal
      "
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to home
      </Link>
      <section
        className="mt-7 text-center [@media(max-width:600px)]:mt-5"
        aria-labelledby="profile-title"
      >
        <BrandTiles />

        {loading ? (
          <div role="status">
            <span className="sr-only">Loading your profile…</span>
            <div
              aria-hidden="true"
              className="**:data-[slot=skeleton]:motion-reduce:animate-none"
            >
              <div className="flex flex-col items-center gap-3.5">
                <Skeleton className="size-14 shrink-0 rounded-full" />
                <div className="min-w-0 max-w-full">
                  <Skeleton className="mx-auto h-7 w-44 max-w-full" />
                  <Skeleton className="mx-auto mt-1 h-5.25 w-60 max-w-full" />
                </div>
              </div>
              <div className="mt-6">
                <Skeleton className="mx-auto h-5.25 w-28 max-w-full" />
                <Skeleton className="mx-auto mt-1 h-6 w-36 max-w-full" />
              </div>
              <Skeleton className="mx-auto mt-8 h-6.75 w-32 max-w-full" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="rounded-md border border-drexel-divider px-3 py-5"
                  >
                    <Skeleton className="mx-auto h-5.25 w-28 max-w-full" />
                    <Skeleton className="mx-auto mt-2 h-[38.4px] w-12 max-w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="mx-auto mt-8 h-12.5 w-45 max-w-full rounded-full" />
            </div>
          </div>
        ) : !user ? (
          <>
            <p className="my-4">Sign in to view your profile.</p>
            <Link
              href="/play"
              className="
                w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
                hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
                focus-visible:outline-drexel-focus focus-visible:outline-offset-3 inline-flex items-center
                justify-center leading-normal
              "
            >
              Go to sign in
            </Link>
          </>
        ) : !profile ? (
          <>
            <p className="my-4" role="alert">
              {error || "We couldn't load your profile. Please try again."}
            </p>
            <button
              className="
              w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
              hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
              focus-visible:outline-drexel-focus focus-visible:outline-offset-3 leading-normal
            "
              onClick={() => void retryProfile()}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3.5">
              <div
                className="
                  flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground
                "
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
                <p className="text-drexel-description text-sm mt-1 wrap-break-word leading-normal">
                  {user.email || profile.email || "No email available"}
                </p>
              </div>
            </div>
            <dl className="mt-6">
              <dt className="text-sm opacity-75">Drexel location</dt>
              <dd className="mt-1 font-medium">
                {profile.locationId || "Not selected yet"}
              </dd>
            </dl>
            <h2 className="mt-8 text-lg font-[650] leading-normal">
              Your progress
            </h2>
            <dl className="grid grid-cols-2 gap-3 mt-4">
              {[
                ["Current streak", profile.stats.currentStreak],
                ["Longest streak", profile.stats.longestStreak],
                ["Total points", profile.stats.totalPoints],
                ["Challenges played", profile.stats.challengesPlayed],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="py-5 px-3 border border-drexel-divider rounded-md"
                >
                  <dt className="text-sm opacity-75">{label}</dt>
                  <dd className="mt-2 text-[32px] font-[750] leading-[1.2] tracking-[-1px]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/play"
              className="
                w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
                hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
                focus-visible:outline-drexel-focus focus-visible:outline-offset-3 mt-8 inline-flex items-center
                justify-center leading-normal
              "
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
      <div className="flex justify-between items-center gap-4 mt-9 pt-6 border-t border-drexel-divider">
        <div>
          <h2 className="text-sm font-semibold leading-normal">Appearance</h2>
          <p className="mt-1 text-drexel-description text-[13px] leading-normal">
            Switch between light and dark mode.
          </p>
        </div>
        <ThemeToggle className="size-11 shrink-0 rounded-full border border-drexel-divider focus-visible:border-drexel-divider" />
      </div>
    </div>
  );
}
