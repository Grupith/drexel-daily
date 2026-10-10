"use client";

import { useAuth } from "@/auth/auth-context";
import { auth } from "@/firebase/config";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";

export function LandingAccountStatus() {
  const { loading, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
    {!loading && user && <p className="landing-account-status" role="status">
      <span className="landing-status-dot" aria-hidden="true" />
      <span>
        Logged in
        {user.email ? (
          <>
            {" "}
            as <strong>{user.email}</strong>
          </>
        ) : (
          ""
        )}
      </span>
    </p>}
    <nav className="landing-links" aria-label="More about Drexel Daily and your account">
      <Link href="/about">About</Link>
      {!loading && user && <>
        <Link href="/profile">Profile</Link>
        <button
          type="button"
          disabled={signingOut}
          onClick={async () => {
            if (signingOut) return;
            setSigningOut(true);
            setError(null);
            try {
              await signOut(auth);
            } catch (cause) {
              console.error("Could not sign out", cause);
              setError("We couldn’t sign you out. Please try again.");
            } finally {
              setSigningOut(false);
            }
          }}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </>}
    </nav>
    {error && <p className="landing-meta" role="alert">{error}</p>}
    </>
  );
}
