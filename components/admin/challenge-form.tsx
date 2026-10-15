"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { AdminQuestion, AdminChallenge } from "@/types/admin";
import { adminFetch } from "@/lib/admin/client";
import { validChallengeDate } from "@/lib/admin/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminLoading, Badge, ErrorNotice, Modal, selectClass } from "./common";
import { QuestionLibrary } from "./question-library";
import { ChallengePreview } from "./challenge-preview";
export function ChallengeForm({ date: existingDate }: { date?: string }) {
  const router = useRouter();
  const [date, setDate] = useState(existingDate ?? "");
  const [status, setStatus] = useState("draft");
  const [questions, setQuestions] = useState<(AdminQuestion | null)[]>([
    null,
    null,
    null,
  ]);
  const [slot, setSlot] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(!!existingDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (!existingDate) return;
    adminFetch<AdminChallenge>(`challenges/${existingDate}`)
      .then(async (c) => {
        setStatus(c.status);
        setLocked(c.status === "published");
        const qs = await Promise.all(
          c.questionIds.map((id) =>
            adminFetch<AdminQuestion>(`questions/${id}`),
          ),
        );
        setQuestions([qs[0] ?? null, qs[1] ?? null, qs[2] ?? null]);
      })
      .catch((e) => {
        setError(e.message);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, [existingDate]);
  function move(index: number, delta: number) {
    const updated = [...questions];
    [updated[index], updated[index + delta]] = [
      updated[index + delta],
      updated[index],
    ];
    setQuestions(updated);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validChallengeDate(date)) {
      setError("Choose a Monday–Friday date in America/Chicago.");
      return;
    }
    if (status === "published" && questions.some((q) => !q)) {
      setError("Assign all three questions before publishing.");
      return;
    }
    setSaving(true);
    try {
      await adminFetch(
        existingDate ? `challenges/${existingDate}` : "challenges",
        {
          method: existingDate ? "PUT" : "POST",
          body: JSON.stringify({
            date,
            status,
            questionIds: questions
              .filter((q): q is AdminQuestion => !!q)
              .map((q) => q.id),
          }),
        },
      );
      toast.success(
        status === "published" ? "Challenge published" : "Draft saved",
      );
      router.push("/admin/challenges");
    } catch (e) {
      setError((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <AdminLoading />;
  return (
    <>
      <div>
        <h1 className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px]">
          {existingDate ? "Challenge details" : "Create Challenge"}
        </h1>
        <p className="mt-3 text-sm leading-normal text-drexel-description">
          Schedule three fresh questions for a weekday.
        </p>
      </div>
      {error && <ErrorNotice message={error} />}
      {locked && (
        <p className="rounded-lg border bg-muted p-4 text-sm">
          Published challenges are locked to preserve scoring and question
          uniqueness.
        </p>
      )}
      <form className="max-w-3xl space-y-6" onSubmit={save}>
        <fieldset
          disabled={saving || locked || loadFailed}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Challenge details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span>Challenge date</span>
                <Input
                  type="date"
                  required
                  disabled={!!existingDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <span className="block text-xs text-muted-foreground">
                  Monday–Friday · America/Chicago. Saved dates cannot change.
                </span>
              </label>
              <label className="space-y-2">
                <span>Status</span>
                <select
                  className={`${selectClass} w-full`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <span className="block text-xs text-muted-foreground">
                  Publishing locks content. It becomes playable on its date.
                </span>
              </label>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={i}>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge>Question {i + 1}</Badge>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`Move question ${i + 1} up`}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`Move question ${i + 1} down`}
                        disabled={i === 2}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      {q && (
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Remove question ${i + 1}`}
                          onClick={() =>
                            setQuestions(
                              questions.map((v, j) => (i === j ? null : v)),
                            )
                          }
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  </div>
                  {q ? (
                    <>
                      <p className="font-medium">{q.text}</p>
                      <p className="text-sm text-muted-foreground">
                        {q.category} ·{" "}
                        {q.type === "multiple_choice"
                          ? "Multiple Choice"
                          : q.type === "estimate"
                            ? "Estimate"
                            : "Unsupported"}{" "}
                        · {q.difficulty ?? "Medium"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose a question from the library.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSlot(i)}
                  >
                    <Plus />
                    {q ? "Replace question" : "Add Question"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {!locked && (
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : status === "published"
                  ? "Publish challenge"
                  : "Save draft"}
            </Button>
          )}
        </fieldset>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreview(true)}
          >
            Preview challenge
          </Button>
          <Button
            nativeButton={false}
            variant="ghost"
            render={<Link href="/admin/challenges" />}
          >
            Cancel
          </Button>
        </div>
      </form>
      <Modal
        open={slot !== null}
        onOpenChange={(open) => {
          if (!open) setSlot(null);
        }}
        title={`Select question ${slot === null ? "" : slot + 1}`}
      >
        <QuestionLibrary
          excluded={questions
            .filter((q): q is AdminQuestion => !!q)
            .map((q) => q.id)}
          onSelect={(q) => {
            setQuestions(questions.map((v, i) => (i === slot ? q : v)));
            setSlot(null);
          }}
        />
      </Modal>
      <ChallengePreview
        open={preview}
        onOpenChange={setPreview}
        date={date}
        questions={questions.filter((q): q is AdminQuestion => !!q)}
      />
    </>
  );
}
