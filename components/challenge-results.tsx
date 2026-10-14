"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChallengeResults } from "@/types/challenge";

export function ChallengeResultsView({
  results,
  headingRef,
}: {
  results: ChallengeResults | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  if (!results) return null;
  const isFriday =
    new Date(`${results.challengeDate}T12:00:00Z`).getUTCDay() === 5;
  return (
    <div className="py-4">
      <div className="text-center">
        <CheckCircle2
          className="mx-auto mb-6 text-drexel-link"
          size={48}
          aria-hidden="true"
        />
        <h1
          id="play-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px] focus:outline-none"
        >
          Today’s challenge complete!
        </h1>
        <p className="mt-5 text-3xl font-bold">
          {results.correctCount}/3 correct
        </p>
        <p className="mt-2 text-xl font-semibold text-drexel-link">
          +{results.pointsEarned} Points
        </p>
        <p className="my-4 text-drexel-subtle">
          {isFriday
            ? "Enjoy your weekend! Come back Monday for three new questions."
            : "Thanks for playing! Come back tomorrow for three new questions."}
        </p>
      </div>
      <div className="mt-8 grid gap-6">
        {results.questions.map((question, questionIndex) => {
          const selected = results.answers[questionIndex];
          const correct = selected === question.correctAnswerIndex;
          return (
            <section
              key={question.id}
              className="border-t border-drexel-panel-border pt-6"
              aria-labelledby={`review-${question.id}`}
            >
              <p
                className={cn(
                  "mb-3 flex items-center gap-2 text-sm font-semibold",
                  correct
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300",
                )}
              >
                {correct ? (
                  <CheckCircle2 size={18} aria-hidden="true" />
                ) : (
                  <XCircle size={18} aria-hidden="true" />
                )}{" "}
                Question {questionIndex + 1} ·{" "}
                {correct ? "Correct" : "Incorrect"}
              </p>
              <h2
                id={`review-${question.id}`}
                className="text-xl font-bold leading-normal"
              >
                {question.text}
              </h2>
              {question.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={question.imageUrl}
                  alt="Image for this question"
                  className="my-4 max-h-80 w-full rounded-xl object-contain"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              )}
              <ul className="mt-4 grid gap-3">
                {question.options.map((option, index) => (
                  <li
                    key={index}
                    className={cn(
                      "rounded-xl border border-drexel-panel-border p-4 text-sm leading-normal",
                      index === question.correctAnswerIndex &&
                        "border-green-600 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200",
                      index === selected &&
                        !correct &&
                        "border-red-600 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200",
                    )}
                  >
                    <span className="font-semibold">
                      {String.fromCharCode(65 + index)}.{" "}
                    </span>
                    {option}
                    {index === selected && (
                      <span className="block mt-1 font-semibold">
                        Your answer{correct ? " · Correct" : " · Incorrect"}
                      </span>
                    )}
                    {index === question.correctAnswerIndex &&
                      index !== selected && (
                        <span className="block mt-1 font-semibold">
                          Correct answer
                        </span>
                      )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <Link
        href="/"
        className="mx-auto mt-8 flex h-12.5 w-45 max-w-full items-center justify-center rounded-full bg-drexel-action text-base font-semibold text-white hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-drexel-focus focus-visible:outline-offset-3"
      >
        Back to home
      </Link>
    </div>
  );
}
