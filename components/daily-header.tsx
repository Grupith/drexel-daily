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
      <header className="daily-header">
        <Link href="/" className="daily-brand" aria-label="Drexel Daily home">
          <Image
            src="/drexel-logo-blue.svg"
            alt="Drexel"
            width={384}
            height={127}
            className="daily-logo daily-logo-blue"
            priority
          />
          <Image
            src="/drexel-logo-white.svg"
            alt="Drexel"
            width={384}
            height={127}
            className="daily-logo daily-logo-white"
            priority
          />
          <span className="pt-2">Daily</span>
        </Link>
        <div className="daily-nav-actions">
          <ThemeToggle />
          {user ? (
            <Link href="/profile" className="daily-account cursor-pointer">
              <UserRound size={16} aria-hidden="true" />
              <span>{accountLabel}</span>
            </Link>
          ) : (
            <div className="daily-account cursor-pointer">
              <UserRound size={16} aria-hidden="true" />
              <span>{accountLabel}</span>
            </div>
          )}
        </div>
      </header>
  );
}
