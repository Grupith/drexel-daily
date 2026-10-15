import Link from "next/link";
import { requireAdmin, AdminError } from "@/lib/admin/auth";
import { loadTestChallenge } from "@/lib/admin/test-challenge";
import { DailyChallenge } from "@/components/daily-challenge";
import { Button } from "@/components/ui/button";
export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { db } = await requireAdmin();
  const { date } = await params;
  let challenge;
  try { challenge = await loadTestChallenge(db, date); }
  catch (error) {
    if (!(error instanceof AdminError)) throw error;
    return <div className="space-y-4"><p role="alert">{error.message}</p><Link href="/admin/challenges">Back to Challenges</Link></div>;
  }
  return <div className="mx-auto flex w-full flex-col items-center gap-6">
    <div className="flex w-full max-w-150 flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
      <div><p className="text-sm font-semibold">Admin Test Mode</p><p className="mt-1 text-sm text-muted-foreground">Test this challenge without recording your results.</p></div>
      <Button nativeButton={false} variant="outline" render={<Link href="/admin/challenges" />}>Back to Challenges</Button>
    </div>
    <DailyChallenge key={date} testChallenge={{ status: "available", date, questions: challenge.questions }} />
  </div>;
}
