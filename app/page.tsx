import { BrandTiles } from "@/components/brand-tiles";
import { ChallengePreview } from "@/components/challenge-preview";
import { LandingAccountStatus } from "@/components/landing-account-status";

export default function Home() {
  return (
    <div className="min-h-svh flex flex-col text-drexel-ink font-drexel bg-drexel-canvas">
      <main className="flex-1 grid place-items-center py-20 px-6 [@media(max-width:600px)]:py-14">
        <section
          className="
            w-full max-w-160 text-center
            motion-safe:*:animate-landing-fade-in
            motion-safe:[&>:nth-child(2)]:[animation-delay:100ms]
            motion-safe:[&>:nth-child(3)]:[animation-delay:200ms]
            motion-safe:[&>:nth-child(4)]:[animation-delay:300ms]
            motion-safe:[&>:nth-child(n+5)]:[animation-delay:500ms]
            motion-safe:[&>:nth-child(n+5)]:animation-duration-[1100ms]
            motion-safe:focus-within:*:animate-none!
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
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <LandingAccountStatus />
        </section>
      </main>
    </div>
  );
}
