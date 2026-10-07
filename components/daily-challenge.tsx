"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
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
    id: "product", category: "Product knowledge", type: "multiple-choice",
    prompt: "Which material is commonly used to frame a house?",
    options: ["Dimensional lumber", "Drywall", "Roofing shingles", "Vinyl siding"],
  },
  {
    id: "estimate", category: "Make an estimate", type: "estimate",
    prompt: "About how many screws are in a 1-pound box of 3-inch deck screws?",
    unit: "screws",
  },
  {
    id: "safety", category: "Safety", type: "multiple-choice",
    prompt: "What should you do before operating a forklift?",
    options: ["Complete a pre-operation inspection", "Skip the inspection if it ran yesterday", "Load it beyond its rated capacity", "Let a passenger ride on the forks"],
  },
];

export function DailyChallenge() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = questions[questionIndex];
  const answer = answers[question.id] ?? "";
  const hasAnswer = question.type === "estimate"
    ? answer.trim() !== "" && Number.isFinite(Number(answer)) && Number(answer) >= 0 && Number.isInteger(Number(answer))
    : question.options.includes(answer);
  const isLastQuestion = questionIndex === questions.length - 1;

  function moveToQuestion(index: number) {
    setQuestionIndex(index);
    heading.current?.focus();
  }

  return (
    <div className="play-layout">
      <Link href="/" className="play-home"><ArrowLeft size={16} aria-hidden="true" /> Back to home</Link>
      <section className="play-card" aria-labelledby="play-title">
        {isSubmitted ? (
          <div className="play-complete" role="status">
            <CheckCircle2 className="play-complete-icon" size={48} aria-hidden="true" />
            <p className="play-eyebrow">Day 1 Challenge</p>
            <h1 id="play-title">Answers submitted!</h1>
            <p>You answered all 3 questions. Thanks for playing!</p>
            <p className="play-demo-note">This is a demo. Your answers have not been saved.</p>
            <Link href="/" className="play-button inline-flex items-center justify-center">Back to home</Link>
          </div>
        ) : (
          <>
            <div className="play-meta"><span>Day 1 Challenge</span><span>Question {questionIndex + 1} of {questions.length}</span></div>
            <div className="play-progress" role="progressbar" aria-label="Question progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={questionIndex + 1}>
              {questions.map((item, index) => <span key={item.id} className={index <= questionIndex ? "is-active" : ""} />)}
            </div>
            <form onSubmit={(event) => {
              event.preventDefault();
              if (!hasAnswer) return;
              if (isLastQuestion) {
                setIsSubmitted(true);
              } else {
                moveToQuestion(questionIndex + 1);
              }
            }}>
              <p className="play-eyebrow">{question.category}</p>
              <h1 id="play-title" ref={heading} tabIndex={-1}> {question.prompt}</h1>
              <p className="play-instruction">{question.type === "estimate" ? "Enter your best estimate." : "Select one answer."}</p>
              {question.type === "multiple-choice" ? (
                <fieldset className="play-options" key={question.id}>
                  <legend className="sr-only">Select one answer</legend>
                  {question.options.map((option, index) => (
                    <label key={option} className={`play-option ${answer === option ? "is-selected" : ""}`}>
                      <input type="radio" name={question.id} value={option} checked={answer === option} onChange={() => setAnswers({ ...answers, [question.id]: option })} required />
                      <span className="play-option-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                      <span className="play-option-text">{option}</span>
                      {answer === option && <Check size={18} aria-hidden="true" />}
                    </label>
                  ))}
                </fieldset>
              ) : (
                <div className="play-estimate" key={question.id}>
                  <label htmlFor="estimate-answer">Your estimate</label>
                  <div className="play-estimate-input">
                    <Input id="estimate-answer" type="number" inputMode="numeric" min={0} step={1} required placeholder="e.g. 75" value={answer} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} aria-describedby="estimate-unit" />
                    <span id="estimate-unit">{question.unit}</span>
                  </div>
                </div>
              )}
              <div className="play-footer">
                <Button type="button" variant="ghost" className="play-back" disabled={questionIndex === 0} onClick={() => moveToQuestion(questionIndex - 1)}><ArrowLeft aria-hidden="true" /> Back</Button>
                <Button type="submit" className="play-button play-next" disabled={!hasAnswer}>{isLastQuestion ? "Submit answers" : "Next question"}{isLastQuestion ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}</Button>
              </div>
            </form>
          </>
        )}
      </section>
      {!isSubmitted && <p className="play-demo-note">Demo challenge · 3 questions · Just a couple of minutes</p>}
    </div>
  );
}
