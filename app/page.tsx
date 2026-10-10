import { ChallengePreview } from "@/components/challenge-preview";
import { LandingAccountStatus } from "@/components/landing-account-status";

export default function Home() {
  return (
    <div className="daily-page landing-page">
      <main className="landing-main">
        <section
          className="challenge-landing"
          aria-labelledby="challenge-title"
        >
          <div className="challenge-tiles" aria-hidden="true">
            <span>D</span>
            <span>B</span>
            <span>S</span>
          </div>
          <h1 id="challenge-title">Drexel Daily</h1>
          <p className="landing-description">
            Three questions. A little Drexel know-how.
            <br />A fresh challenge every weekday.
          </p>
          <ChallengePreview />
          <p className="landing-meta">
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
