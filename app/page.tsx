import { connection } from "next/server";
import { formatCurrentChallengeDate } from "@/lib/challenges/date";
import { YardLeaderboard } from "@/components/yard-leaderboard";
import { BrandTiles } from "@/components/brand-tiles";
import { ChallengePreview } from "@/components/challenge-preview";
import { LandingAccountStatus } from "@/components/landing-account-status";

export default async function Home() {
  // Evaluate today's date per request rather than freezing it at build time.
  await connection();
  return (
    <div className="min-h-svh flex flex-col text-drexel-ink font-drexel bg-drexel-canvas">
      <main className="flex-1 grid place-items-center py-20 px-6 [@media(max-width:600px)]:py-14">
        <section
          className="
            w-full max-w-160 text-center
            motion-safe:animate-in motion-safe:fade-in-0
            motion-safe:animation-duration-[250ms] motion-safe:ease-out
          "
          aria-labelledby="challenge-title"
        >
          <BrandTiles />
          <h1
            id="challenge-title"
            className="text-[clamp(40px,7vw,60px)] font-[750] leading-[1.1] tracking-[-2px]"
          >
            Drexel Daily
          </h1>
          <p className="mt-6 mb-9 text-drexel-description text-[clamp(19px,3vw,25px)] leading-normal tracking-[-0.4px] text-balance">
            Think you know Drexel?
            <br />
            Three new questions every weekday.
            <br />
            Let&apos;s find out.
          </p>
          <ChallengePreview />
          <p className="mt-7.5 text-drexel-subtle text-sm font-medium leading-normal">
            {formatCurrentChallengeDate()}
          </p>
          <LandingAccountStatus />
          <YardLeaderboard preview />
        </section>
      </main>
    </div>
  );
}
