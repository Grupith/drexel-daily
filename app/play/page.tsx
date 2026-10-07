import { DailyHeader } from "@/components/daily-header";
import { DailyChallenge } from "@/components/daily-challenge";

export default function PlayPage() {
  return (
    <div className="daily-page">
      <DailyHeader />
      <main className="daily-main">
        <DailyChallenge />
      </main>
    </div>
  );
}
