"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DREXEL_LOCATIONS } from "@/lib/locations";

export function PlayAccess({ children }: { children: ReactNode }) {
  const {
    user,
    profile,
    loading,
    signingIn,
    error,
    startPlay,
    retryProfile,
    saveLocation,
  } = useAuth();
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!loading && user && profile?.locationId) return children;

  if (!loading && user && profile) {
    return (
      <div className="w-full max-w-150">
        <Card aria-labelledby="access-title">
          <CardHeader>
            <CardTitle id="access-title">
              Which Drexel location are you at?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (saving) return;
                setSaving(true);
                setSaveError(null);
                try {
                  await saveLocation(location);
                } catch (cause) {
                  console.error("Could not save location", cause);
                  setSaveError(
                    "We couldn’t save your location. Please try again.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              <label htmlFor="drexel-location" className="sr-only">
                Your location
              </label>
              <select
                id="drexel-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                disabled={saving}
                className="
                  h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none
                  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50
                "
              >
                <option value="">Select a location</option>
                {DREXEL_LOCATIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {DREXEL_LOCATIONS.length === 0 && (
                <p role="alert" className="mt-4">
                  Locations haven’t been configured yet. Please check back
                  shortly.
                </p>
              )}
              {saveError && (
                <p role="alert" className="mt-4">
                  {saveError}
                </p>
              )}
              <Button
                type="submit"
                className="mt-6 h-11 w-full"
                disabled={saving || !DREXEL_LOCATIONS.includes(location)}
              >
                {saving ? "Saving…" : "Submit"}
              </Button>
              {error && (
                <p role="alert" className="mt-4">
                  {error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-150">
      <section
        className="
        p-9 border border-drexel-panel-border rounded-[20px] bg-drexel-panel shadow-[0_12px_40px_#15365b08]
        [@media(max-width:600px)]:px-5 [@media(max-width:600px)]:py-6
      "
        aria-labelledby="access-title"
      >
        {loading ? (
          <p role="status">Loading your profile…</p>
        ) : !user ? (
          <>
            <h1
              id="access-title"
              className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px] focus:outline-none"
            >
              Sign in to play
            </h1>
            <p className="my-4">Use your Google account to get started.</p>
            <button
              className="
                w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
                hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
                focus-visible:outline-drexel-focus focus-visible:outline-offset-3 leading-normal
              "
              disabled={signingIn}
              onClick={() => void startPlay()}
            >
              {signingIn ? "Signing in…" : "Sign in with Google"}
            </button>
          </>
        ) : !profile ? (
          <>
            <h1
              id="access-title"
              className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px] focus:outline-none"
            >
              We couldn’t load your profile
            </h1>
            <button
              className="
                w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
                hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
                focus-visible:outline-drexel-focus focus-visible:outline-offset-3 mt-4 leading-normal
              "
              onClick={() => void retryProfile()}
            >
              Try again
            </button>
          </>
        ) : null}
        {error && (
          <p role="alert" className="mt-4">
            {error}
          </p>
        )}
        <Link
          href="/"
          className="
          inline-flex items-center gap-2 mt-6 text-sm text-drexel-subtle whitespace-nowrap
          hover:text-drexel-brand dark:hover:text-drexel-subtle [@media(max-width:600px)]:mt-5 leading-normal
        "
        >
          Back to home
        </Link>
      </section>
    </div>
  );
}
