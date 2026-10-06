import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserRound } from "lucide-react";
import { ChallengePreview } from "@/components/challenge-preview";

export default function Home() {
  return (
    <div className="daily-page">
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
      <main className="daily-main">
        <div className="challenge-landing">
          <p className="challenge-helper">3 new questions, posted daily</p>
          <section className="challenge-card" aria-labelledby="challenge-title">
            <div className="challenge-tiles" aria-hidden="true">
              <span>D</span>
              <span>D</span>
              <span>1</span>
            </div>
            <h1 id="challenge-title">Day 1 Challenge</h1>
            <p>
              A little Drexel know-how.
              <br />A fresh challenge every day.
            </p>
            <ChallengePreview />
          </section>
        </div>
      </main>
    </div>
  );
}
