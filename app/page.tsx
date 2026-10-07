import { DailyHeader } from "@/components/daily-header";
import { ChallengePreview } from "@/components/challenge-preview";

export default function Home() {
  return (
    <div className="daily-page">
      <DailyHeader />
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
