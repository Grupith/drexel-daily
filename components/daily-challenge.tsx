"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidAnswer } from "@/lib/challenges/content";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/auth-context";
import { PlaySkeleton } from "@/components/play-skeleton";
import { ChallengeResultsView } from "@/components/challenge-results";
import type {
  ChallengeSubmission,
  DailyChallengeResponse,
  SubmissionResponse,
} from "@/types/challenge";

function numericalAnswer(value: number | string | undefined): number {
  return typeof value === "string" ? (value.trim() === "" ? NaN : Number(value)) : value ?? NaN;
}

export function DailyChallenge({ testChallenge }: { testChallenge?: Extract<DailyChallengeResponse, { status: "available" }> } = {}) {
  const testMode = !!testChallenge;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { user } = useAuth();
  const [response, setResponse] = useState<DailyChallengeResponse | null>(testChallenge ?? null);
  const isSubmitted = response?.status === "completed";
  const [retry, setRetry] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const currentDate = response?.date
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${response.date}T12:00:00Z`))
    : "";

  useEffect(() => {
    if (testChallenge) return;
    const controller = new AbortController();
    async function loadChallenge() {
      try {
        if (!user) throw new Error("Please sign in to play.");
        const token = await user.getIdToken();
        if (controller.signal.aborted) return;
        const result = await fetch("/api/challenge/today", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        const data: DailyChallengeResponse = await result.json();
        if (!result.ok && data.status !== "error")
          throw new Error("Could not load challenge.");
        if (!controller.signal.aborted) setResponse(data);
      } catch {
        if (!controller.signal.aborted)
          setResponse({
            status: "error",
            date: "",
            message: "We couldn’t load your challenge. Please try again.",
          });
      }
    }
    void loadChallenge();
    return () => controller.abort();
  }, [user, retry, testChallenge]);
  const heading = useRef<HTMLHeadingElement>(null);
  const shouldFocusHeading = useRef(false);

  useEffect(() => {
    if (shouldFocusHeading.current) {
      heading.current?.focus();
      shouldFocusHeading.current = false;
    }
  }, [questionIndex, isSubmitted]);

  const questions = response?.status === "available" ? response.questions : [];
  const question = questions[questionIndex];
  const answer = question ? answers[question.id] : undefined;
  const hasAnswer = !!question && isValidAnswer(question, numericalAnswer(answer));
  const isLastQuestion = questionIndex === questions.length - 1;

  function moveToQuestion(index: number) {
    shouldFocusHeading.current = true;
    setQuestionIndex(index);
  }

  async function submitAnswers() {
    if (submitting.current || !user || response?.status !== "available") return;
    if (questions.some((item) => !isValidAnswer(item, numericalAnswer(answers[item.id])))) {
      setSubmissionError(
        "Please answer all three questions before submitting.",
      );
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const token = await user.getIdToken();
      const submission: ChallengeSubmission = {
        challengeDate: response.date,
        questionIds: questions.map((item) => item.id),
        answers: questions.map((item) => numericalAnswer(answers[item.id])),
      };
      const result = await fetch(testMode ? `/api/admin/challenges/${response.date}/test` : "/api/challenge/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      });
      const data: SubmissionResponse = await result.json();
      if ((result.ok || result.status === 409) && data.status === "completed") {
        shouldFocusHeading.current = true;
        setResponse({
          status: "completed",
          date: data.results.challengeDate,
          results: data.results,
        });
      } else {
        setSubmissionError(
          data.status === "error"
            ? data.message
            : "We couldn't submit your answers. Please try again.",
        );
      }
    } catch {
      setSubmissionError(
        testMode ? "Test scoring failed. Please try again." : "We couldn’t confirm your submission. Please try again, or refresh to check whether your answers were saved.",
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  if (!response) return <PlaySkeleton />;
  if (
    response.status !== "completed" &&
    (response.status !== "available" || !question)
  ) {
    return (
      <div className="w-full max-w-150">
        <section className="p-9 border border-drexel-panel-border rounded-[20px] bg-drexel-panel [@media(max-width:600px)]:px-5 [@media(max-width:600px)]:py-6">
          <h1 className="text-2xl font-bold">Today’s challenge</h1>
          <p
            className="my-4 text-drexel-subtle"
            role={response.status === "error" ? "alert" : "status"}
          >
            {response.status === "available"
              ? "Today's challenge isn't available yet."
              : response.message}
          </p>
          {response.status !== "weekend" && (
            <Button
              onClick={() => {
                setResponse(null);
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </Button>
          )}
          <Link href="/" className="block mt-6 text-sm text-drexel-subtle">
            {testMode ? "Back to Challenges" : "Back to home"}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-150">
      <h2 className="mb-6 text-center text-2xl font-bold leading-normal">
        {testMode ? "Test challenge" : "Today’s challenge"}
      </h2>
      <section
        className="
        p-9 border border-drexel-panel-border rounded-[20px] bg-drexel-panel shadow-[0_12px_40px_#15365b08]
        [@media(max-width:600px)]:px-5 [@media(max-width:600px)]:py-6
      "
        aria-labelledby="play-title"
      >
        {isSubmitted ? (
          <ChallengeResultsView
            results={response.status === "completed" ? response.results : null}
            testMode={testMode}
            onTestAgain={() => {
              setAnswers({}); setQuestionIndex(0); setSubmissionError(null);
              setImageError(null); setIsSubmitting(false); submitting.current = false;
              shouldFocusHeading.current = true; setResponse(testChallenge!);
            }}
            headingRef={heading}
          />
        ) : (
          <>
            <div className="flex justify-end gap-3 text-[13px] font-semibold text-drexel-subtle leading-normal">
              <span>
                Question {questionIndex + 1} of {questions.length}
              </span>
            </div>
            <div
              className="flex gap-2 mt-4 mb-8"
              role="progressbar"
              aria-label="Question progress"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={questionIndex + 1}
            >
              {questions.map((item, index) => (
                <span
                  key={item.id}
                  className={cn(
                    "flex-1 h-1.25 rounded-full bg-drexel-tile dark:text-drexel-subtle",
                    index <= questionIndex &&
                      "bg-drexel-action dark:text-white",
                  )}
                />
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!hasAnswer || submitting.current) return;
                if (isLastQuestion) {
                  void submitAnswers();
                } else {
                  moveToQuestion(questionIndex + 1);
                }
              }}
            >
              <p className="mb-3 text-drexel-link text-xs font-bold tracking-[1px] uppercase leading-normal">
                {question.category}
              </p>
              <h1
                className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px] focus:outline-none"
                id="play-title"
                ref={heading}
                tabIndex={-1}
              >
                {" "}
                {question.text}
              </h1>
              <p className="mt-3 mb-6 text-drexel-subtle text-sm leading-normal">
                {question.type === "estimate" ? "Enter your estimate. Only an exact numerical answer earns credit." : "Use Tab to move between answers and Space to select. Press Enter on your selected answer to continue."}
              </p>
              {question.imageUrl &&
                (imageError === question.id ? (
                  <p role="status" className="mb-6 text-sm text-drexel-subtle">
                    The question image couldn’t load. Please try refreshing the
                    page.
                  </p>
                ) : (
                  // Console-managed URLs can use any image host; no Next.js host allowlist required.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={question.imageUrl}
                    alt="Image for this question"
                    onError={() => setImageError(question.id)}
                    className="mb-6 max-h-80 w-full rounded-xl object-contain"
                  />
                ))}
              {question.type === "estimate" ? <div className="space-y-2" key={question.id}><label htmlFor="estimate-answer" className="text-sm font-semibold">Your estimate</label><div className="flex items-center gap-3"><Input id="estimate-answer" type="number" step="any" required min={question.minGuess} max={question.maxGuess} disabled={isSubmitting} value={answer ?? ""} placeholder="Enter your estimate…" className="h-14 text-base" onChange={event => { const value = event.target.value; setAnswers(current => ({ ...current, [question.id]: value })); }}/>{question.unit && <span className="text-sm text-drexel-subtle">{question.unit}</span>}</div>{(question.minGuess !== undefined || question.maxGuess !== undefined) && <p className="text-xs text-drexel-subtle">{question.minGuess !== undefined && `Minimum: ${question.minGuess}`}{question.minGuess !== undefined && question.maxGuess !== undefined && " · "}{question.maxGuess !== undefined && `Maximum: ${question.maxGuess}`}</p>}</div> : <fieldset className="grid gap-3 min-w-0" key={question.id}>
                <legend className="sr-only">Select one answer</legend>
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={isSubmitting}
                    aria-pressed={answer === index}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: index,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (event.repeat) {
                        event.preventDefault();
                        return;
                      }
                      if (answer === index) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    className={cn(
                      "relative flex items-center gap-3.5 min-h-15.5 py-3.5 px-4 border border-drexel-panel-border",
                      "rounded-[12px] cursor-pointer text-left text-[15px] leading-normal hover:bg-drexel-option-hover",
                      "hover:border-drexel-option-hover-border focus-visible:outline-2",
                      "focus-visible:outline-solid focus-visible:outline-drexel-focus",
                      "focus-visible:outline-offset-3 [@media(max-width:600px)]:p-3",
                      "[@media(max-width:600px)]:gap-2.5",
                      answer === index && [
                        "bg-drexel-selected border-drexel-selected-border text-drexel-selected-ink hover:bg-drexel-selected",
                        "hover:border-drexel-selected-border",
                      ],
                    )}
                  >
                    <span
                      className={cn(
                        "grid place-items-center shrink-0 size-7.5 rounded-[7px] bg-drexel-tile text-drexel-subtle",
                        "text-[13px] font-semibold leading-normal",
                        answer === index && "bg-drexel-action text-white",
                      )}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {answer === index && <Check size={18} aria-hidden="true" />}
                  </button>
                ))}
              </fieldset>}
              {submissionError && (
                <p
                  role="alert"
                  className="mt-4 text-sm text-red-700 dark:text-red-300"
                >
                  {submissionError}
                </p>
              )}
              <div
                className="
                flex items-center justify-between gap-3 mt-8 pt-6 border-t border-drexel-header-border
                dark:border-drexel-panel-border
              "
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 cursor-pointer text-inherit hover:text-inherit"
                  disabled={questionIndex === 0 || isSubmitting}
                  onClick={() => moveToQuestion(questionIndex - 1)}
                >
                  <ArrowLeft aria-hidden="true" /> Back
                </Button>
                <Button
                  type="submit"
                  className="
                    max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
                    hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
                    focus-visible:outline-drexel-focus focus-visible:outline-offset-3 w-auto px-6 gap-2.5 cursor-pointer
                    [@media(max-width:600px)]:px-4.5 [@media(max-width:600px)]:text-sm leading-[1.4285714285714286]
                  "
                  disabled={!hasAnswer || isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting…"
                    : isLastQuestion
                      ? "Submit answers"
                      : "Next question"}
                  {isLastQuestion ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <ArrowRight aria-hidden="true" />
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </section>
      {!isSubmitted && (
        <div className="flex items-center justify-around flex-wrap gap-y-4 gap-x-6 pt-8 px-1 text-drexel-subtle">
          <div>
            <p className="flex items-center gap-1.75 text-[13px] font-semibold leading-normal">
              <CalendarDays size={14} aria-hidden="true" />
              {currentDate || "Today's challenge"}
              <span className="text-[11px] font-normal leading-normal">CT</span>
            </p>
            <p className="mt-1.25 text-xs leading-[1.6]">
              Daily challenge · {questions.length} questions
            </p>
          </div>
          <Link
            href={testMode ? "/admin/challenges" : "/"}
            className="
            inline-flex items-center gap-2 text-sm text-drexel-subtle whitespace-nowrap hover:text-drexel-brand
            dark:hover:text-drexel-subtle leading-normal
          "
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {testMode ? "Back to Challenges" : "Back to home"}
          </Link>
        </div>
      )}
    </div>
  );
}
