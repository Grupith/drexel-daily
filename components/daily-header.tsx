import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserRound } from "lucide-react";

export function DailyHeader() {
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
          <div className="daily-account cursor-pointer">
            <UserRound size={16} aria-hidden="true" />
            <span>Account</span>
          </div>
        </div>
      </header>
  );
}
