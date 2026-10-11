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
  const showAccount = !loading && Boolean(user);

  return (
    <>
    <p
      className={`landing-account-status${showAccount ? "" : " landing-account-hidden"}`}
      role="status"
      aria-hidden={!showAccount}
    >
      <span className="landing-status-dot" aria-hidden="true" />
      <span>
        Logged in
        {user?.email ? (
          <>
            {" "}
            as <strong title={user.email}>{user.email}</strong>
          </>
        ) : (
          ""
        )}
      </span>
    </p>
    <nav className="landing-links" aria-label="More about Drexel Daily and your account">
        <Link
          href="/profile"
          className={showAccount ? undefined : "landing-account-hidden"}
          aria-hidden={!showAccount}
          tabIndex={showAccount ? undefined : -1}
        >Profile</Link>
        <Link href="/about">About</Link>
        <button
          type="button"
          className={showAccount ? undefined : "landing-account-hidden"}
          aria-hidden={!showAccount}
          tabIndex={showAccount ? undefined : -1}
          disabled={!showAccount || signingOut}
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
    </nav>
    {error && <p className="landing-meta" role="alert">{error}</p>}
    </>
  );
}
