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
        className="
          w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
          hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
          focus-visible:outline-drexel-focus focus-visible:outline-offset-3 inline-flex items-center
          justify-center cursor-pointer leading-normal
        "
        disabled={loading || signingIn}
        aria-busy={loading || signingIn}
        onClick={() => void (needsRetry ? retryProfile() : startPlay())}
      >
        {signingIn ? "Signing in…" : needsRetry ? "Try again" : "Play"}
      </button>
      {loading && (
        <span role="status" className="sr-only">
          Getting ready to play…
        </span>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
