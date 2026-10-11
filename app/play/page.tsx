import { PlayAccess } from "@/components/play-access";
import { DailyChallenge } from "@/components/daily-challenge";

export default function PlayPage() {
  return (
    <div className="min-h-svh flex flex-col text-drexel-ink font-drexel bg-drexel-canvas">
      <main className="flex-1 grid justify-items-center content-start pt-4 px-5 pb-10">
        <PlayAccess>
          <DailyChallenge />
        </PlayAccess>
      </main>
    </div>
  );
}
