"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/auth/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserRound } from "lucide-react";

export function DailyHeader() {
  const { user, profile } = useAuth();
  const accountLabel = user
    ? user.displayName?.trim() || profile?.displayName?.trim() || "Account"
    : "Account";

  return (
    <header
      className="
        h-18 shrink-0 flex items-center justify-around px-10 border-b border-drexel-header-border
        bg-drexel-header [@media(max-width:600px)]:h-16 [@media(max-width:600px)]:px-5
      "
    >
      <Link
        href="/"
        className="
          inline-flex items-center gap-4 text-drexel-brand text-[19px] font-[650] tracking-[-0.6px]
          focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-drexel-focus
          focus-visible:outline-offset-5 [@media(max-width:600px)]:text-lg [@media(max-width:600px)]:gap-3
          leading-normal
        "
        aria-label="Drexel Daily home"
      >
        <Image
          src="/drexel-logo-blue.svg"
          alt="Drexel"
          width={384}
          height={127}
          className="w-28.5 h-auto shrink-0 [@media(max-width:600px)]:w-24 dark:hidden"
          priority
        />
        <Image
          src="/drexel-logo-white.svg"
          alt="Drexel"
          width={384}
          height={127}
          className="w-28.5 h-auto shrink-0 [@media(max-width:600px)]:w-24 hidden dark:block"
          priority
        />
        <span
          className="
            flex items-center pt-2 text-[30px] font-semibold leading-none tracking-[-0.8px]
            [@media(max-width:600px)]:text-[25px]
          "
        >
          Daily
        </span>
      </Link>
      <div className="flex items-center gap-4 [@media(max-width:600px)]:gap-2">
        <ThemeToggle />
        {user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2.25 text-drexel-subtle text-[13px] cursor-pointer leading-normal"
          >
            <UserRound size={16} aria-hidden="true" />
            <span>{accountLabel}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2.25 text-drexel-subtle text-[13px] cursor-pointer leading-normal">
            <UserRound size={16} aria-hidden="true" />
            <span>{accountLabel}</span>
          </div>
        )}
      </div>
    </header>
  );
}
