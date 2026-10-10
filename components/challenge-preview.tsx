"use client";

import { useAuth } from "@/auth/auth-context";

export function ChallengePreview() {
  const { loading, signingIn, error, user, profile, startPlay, retryProfile } =
    useAuth();
  const needsRetry = user && !profile && error;
  return (
    <div>
      <button
        type="button"
        className="play-button inline-flex items-center justify-center cursor-pointer"
        disabled={loading || signingIn}
        onClick={() => void (needsRetry ? retryProfile() : startPlay())}
      >
        {loading
          ? "Loading…"
          : signingIn
            ? "Signing in…"
            : needsRetry
              ? "Try again"
              : "Play"}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
