import { PlayAccess } from "@/components/play-access";
import { DailyChallenge } from "@/components/daily-challenge";

export default function PlayPage() {
  return (
    <div className="daily-page play-page">
      <main className="daily-main">
        <PlayAccess>
          <DailyChallenge />
        </PlayAccess>
      </main>
    </div>
  );
}
