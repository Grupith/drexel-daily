"use client";

import { useAuth } from "@/auth/auth-context";
import { auth } from "@/firebase/config";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function LandingAccountStatus() {
  const { loading, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showAccount = !loading && Boolean(user);

  return (
    <>
      <p
        className={cn(
          "flex items-center justify-center gap-2.25 mt-3.5 text-drexel-status text-[13px] leading-[1.6] h-5.25",
          !showAccount && "invisible",
        )}
        role="status"
        aria-hidden={!showAccount}
      >
        <span
          className="shrink-0 size-2 rounded-full bg-drexel-status-dot shadow-[0_0_0_3px_var(--drexel-status-halo)]"
          aria-hidden="true"
        />
        <span className="min-w-0 truncate">
          Logged in
          {user?.email ? (
            <>
              {" "}
              as{" "}
              <strong className="font-semibold" title={user.email}>
                {user.email}
              </strong>
            </>
          ) : (
            ""
          )}
        </span>
      </p>
      <nav
        className="
      grid grid-cols-[repeat(3,minmax(0,90px))] justify-center items-center gap-2.5 mt-5.5
      text-drexel-subtle text-[13px] leading-normal
    "
        aria-label="More about Drexel Daily and your account"
      >
        <Link
          href="/profile"
          className={cn(
            "py-2 cursor-pointer hover:underline underline-offset-4 focus-visible:outline-2",
            "focus-visible:outline-solid focus-visible:outline-drexel-focus focus-visible:outline-offset-4",
            "focus-visible:rounded-xs",
            !showAccount && "invisible",
          )}
          aria-hidden={!showAccount}
          tabIndex={showAccount ? undefined : -1}
        >
          Profile
        </Link>
        <Link
          href="/about"
          className="
          py-2 cursor-pointer hover:underline underline-offset-4 focus-visible:outline-2
          focus-visible:outline-solid focus-visible:outline-drexel-focus focus-visible:outline-offset-4
          focus-visible:rounded-xs
        "
        >
          About
        </Link>
        <button
          type="button"
          className={cn(
            "py-2 cursor-pointer hover:underline underline-offset-4 focus-visible:outline-2",
            "focus-visible:outline-solid focus-visible:outline-drexel-focus focus-visible:outline-offset-4",
            "focus-visible:rounded-xs disabled:cursor-wait disabled:opacity-60",
            !showAccount && "invisible",
          )}
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
      {error && (
        <p
          className="mt-7.5 text-drexel-subtle text-sm font-medium leading-normal"
          role="alert"
        >
          {error}
        </p>
      )}
    </>
  );
}
