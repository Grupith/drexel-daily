"use client";
import Image from "next/image";
import type { AdminQuestion } from "@/types/admin";
import { Modal, Badge, challengeDate } from "./common";
export function ChallengePreview({ open, onOpenChange, date, questions }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: string;
    questions: AdminQuestion[];
}) {
    return <Modal open={open} onOpenChange={onOpenChange} title="Challenge preview"><p className="mb-5 text-sm text-muted-foreground">{date ? challengeDate(date) : "Choose a date"} · America/Chicago · Admin preview</p><div className="space-y-6">{questions.map((q, i) => <section key={q.id} className="space-y-3 rounded-lg border p-4"><Badge>Question {i + 1} · {q.category}</Badge><h2 className="font-semibold">{q.text}</h2>{q.imageUrl && <Image src={q.imageUrl} alt="Question image" width={640} height={400} unoptimized className="max-h-80 w-full rounded-lg object-contain"/>}{q.type === "estimate" ? <p className="rounded-lg border border-primary bg-primary/10 p-3 text-sm">Correct Answer: <strong>{q.correctAnswer} {q.unit}</strong>{q.minGuess !== undefined && <span className="block">Minimum Guess: {q.minGuess}</span>}{q.maxGuess !== undefined && <span className="block">Maximum Guess: {q.maxGuess}</span>}</p> : <ol className="space-y-2">{q.options.map((option, index) => <li key={index} className={`rounded-lg border p-3 text-sm ${index === q.correctAnswerIndex ? "border-primary bg-primary/10" : ""}`}>{String.fromCharCode(65 + index)}. {option} {index === q.correctAnswerIndex && <strong> — Correct answer</strong>}</li>)}</ol>}{q.explanation && <p className="text-sm text-muted-foreground">{q.explanation}</p>}</section>)}{!questions.length && <p className="text-muted-foreground">No questions assigned yet.</p>}</div></Modal>;
}
