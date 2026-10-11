"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DemoQuestion = {
  id: string;
  category: string;
  prompt: string;
} & (
  | { type: "multiple-choice"; options: string[] }
  | { type: "estimate"; unit: string }
);

const questions: DemoQuestion[] = [
  {
    id: "product",
    category: "Product knowledge",
    type: "multiple-choice",
    prompt: "Which material is commonly used to frame a house?",
    options: [
      "Dimensional lumber",
      "Drywall",
      "Roofing shingles",
      "Vinyl siding",
    ],
  },
  {
    id: "estimate",
    category: "Make an estimate",
    type: "estimate",
    prompt: "About how many screws are in a 1-pound box of 3-inch deck screws?",
    unit: "screws",
  },
  {
    id: "safety",
    category: "Safety",
    type: "multiple-choice",
    prompt: "What should you do before operating a forklift?",
    options: [
      "Complete a pre-operation inspection",
      "Skip the inspection if it ran yesterday",
      "Load it beyond its rated capacity",
      "Let a passenger ride on the forks",
    ],
  },
];

export function DailyChallenge() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    function updateDate() {
      setCurrentDate(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Chicago",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date()),
      );
    }

    const initialUpdate = window.setTimeout(updateDate, 0);
    const interval = window.setInterval(updateDate, 60_000);
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = questions[questionIndex];
  const answer = answers[question.id] ?? "";
  const hasAnswer =
    question.type === "estimate"
      ? answer.trim() !== "" &&
        Number.isFinite(Number(answer)) &&
        Number(answer) >= 0 &&
        Number.isInteger(Number(answer))
      : question.options.includes(answer);
  const isLastQuestion = questionIndex === questions.length - 1;

  function moveToQuestion(index: number) {
    setQuestionIndex(index);
    heading.current?.focus();
  }

  return (
    <div className="w-full max-w-150">
      <h2 className="mb-6 text-center text-2xl font-bold leading-normal">
        Day 1 challenge
      </h2>
      <section
        className="
        p-9 border border-drexel-panel-border rounded-[20px] bg-drexel-panel shadow-[0_12px_40px_#15365b08]
        [@media(max-width:600px)]:px-5 [@media(max-width:600px)]:py-6
      "
        aria-labelledby="play-title"
      >
        {isSubmitted ? (
          <div className="text-center py-4" role="status">
            <CheckCircle2
              className="mx-auto mb-6 text-drexel-link"
              size={48}
              aria-hidden="true"
            />
            <h1
              className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px] focus:outline-none"
              id="play-title"
            >
              Answers submitted!
            </h1>
            <p className="my-4 text-drexel-subtle">
              You answered all 3 questions. Thanks for playing!
            </p>
            <p className="my-4 text-center text-drexel-subtle text-xs leading-[1.6]">
              This is a demo. Your answers have not been saved.
            </p>
            <Link
              href="/"
              className="
                w-45 max-w-full h-12.5 rounded-full bg-drexel-action text-white text-base font-semibold
                hover:bg-drexel-action-hover focus-visible:outline-2 focus-visible:outline-solid
                focus-visible:outline-drexel-focus focus-visible:outline-offset-3 mt-3 inline-flex items-center
                justify-center leading-normal
              "
            >
              Back to home
            </Link>
          </div>
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
                if (!hasAnswer) return;
                if (isLastQuestion) {
                  setIsSubmitted(true);
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
                {question.prompt}
              </h1>
              <p className="mt-3 mb-6 text-drexel-subtle text-sm leading-normal">
                {question.type === "estimate"
                  ? "Enter your best estimate."
                  : "Select one answer."}
              </p>
              {question.type === "multiple-choice" ? (
                <fieldset className="grid gap-3 min-w-0" key={question.id}>
                  <legend className="sr-only">Select one answer</legend>
                  {question.options.map((option, index) => (
                    <label
                      key={option}
                      className={cn(
                        "relative flex items-center gap-3.5 min-h-15.5 py-3.5 px-4 border border-drexel-panel-border",
                        "rounded-[12px] cursor-pointer text-[15px] leading-normal hover:bg-drexel-option-hover",
                        "hover:border-drexel-option-hover-border has-focus-visible:outline-2",
                        "has-focus-visible:outline-solid has-focus-visible:outline-drexel-focus",
                        "has-focus-visible:outline-offset-3 [@media(max-width:600px)]:p-3",
                        "[@media(max-width:600px)]:gap-2.5",
                        answer === option && [
                          "bg-drexel-selected border-drexel-selected-border text-drexel-selected-ink hover:bg-drexel-selected",
                          "hover:border-drexel-selected-border",
                        ],
                      )}
                    >
                      <input
                        className="absolute size-px opacity-0"
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answer === option}
                        onChange={() =>
                          setAnswers({ ...answers, [question.id]: option })
                        }
                        required
                      />
                      <span
                        className={cn(
                          "grid place-items-center shrink-0 size-7.5 rounded-[7px] bg-drexel-tile text-drexel-subtle",
                          "text-[13px] font-semibold leading-normal",
                          answer === option && "bg-drexel-action text-white",
                        )}
                        aria-hidden="true"
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {answer === option && (
                        <Check size={18} aria-hidden="true" />
                      )}
                    </label>
                  ))}
                </fieldset>
              ) : (
                <div key={question.id}>
                  <label
                    className="block mb-2.5 text-sm font-semibold leading-normal"
                    htmlFor="estimate-answer"
                  >
                    Your estimate
                  </label>
                  <div className="flex items-center gap-3.5">
                    <Input
                      className="
                        h-14 py-3 px-4 text-lg md:text-lg border-drexel-panel-border
                        focus-visible:border-drexel-panel-border leading-normal md:leading-[1.4285714285714286]
                      "
                      id="estimate-answer"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      required
                      placeholder="e.g. 75"
                      value={answer}
                      onChange={(event) =>
                        setAnswers({
                          ...answers,
                          [question.id]: event.target.value,
                        })
                      }
                      aria-describedby="estimate-unit"
                    />
                    <span
                      className="text-drexel-subtle text-sm leading-normal"
                      id="estimate-unit"
                    >
                      {question.unit}
                    </span>
                  </div>
                </div>
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
                  disabled={questionIndex === 0}
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
                  disabled={!hasAnswer}
                >
                  {isLastQuestion ? "Submit answers" : "Next question"}
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
        <div className="flex items-center justify-around flex-wrap gap-y-4 gap-x-6 pt-5 px-1 text-drexel-subtle">
          <div>
            <p className="flex items-center gap-1.75 text-[13px] font-semibold leading-normal">
              <CalendarDays size={14} aria-hidden="true" />
              {currentDate || "Today's challenge"}
              <span className="text-[11px] font-normal leading-normal">CT</span>
            </p>
            <p className="mt-1.25 text-xs leading-[1.6]">
              Demo challenge · {questions.length} questions
            </p>
          </div>
          <Link
            href="/"
            className="
            inline-flex items-center gap-2 text-sm text-drexel-subtle whitespace-nowrap hover:text-drexel-brand
            dark:hover:text-drexel-subtle leading-normal
          "
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      )}
    </div>
  );
}
