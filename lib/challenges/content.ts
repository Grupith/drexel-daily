import type { PublicQuestion } from "../../types/challenge";

function nonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function getPublishedQuestionIds(
  data: Record<string, unknown> | undefined,
  date: string,
): string[] | null {
  if (
    !data ||
    data.status !== "published" ||
    data.date !== date ||
    !Array.isArray(data.questionIds) ||
    data.questionIds.length !== 3 ||
    !data.questionIds.every((id) => nonemptyString(id) && !id.includes("/")) ||
    new Set(data.questionIds).size !== 3
  )
    return null;
  return data.questionIds;
}

export function toPublicQuestion(
  id: string,
  data: Record<string, unknown> | undefined,
): PublicQuestion | null {
  if (
    !data ||
    !nonemptyString(data.text) ||
    !nonemptyString(data.category) ||
    typeof data.isActive !== "boolean" ||
    !(
      data.imageUrl == null ||
      (typeof data.imageUrl === "string" && /^https?:\/\//.test(data.imageUrl))
    )
  )
    return null;
  const shared = { id, text: data.text, category: data.category, imageUrl: data.imageUrl ?? null };
  if (data.type === "estimate") {
    if (typeof data.correctAnswer !== "number" || !Number.isFinite(data.correctAnswer) ||
      (data.unit !== undefined && (typeof data.unit !== "string" || data.unit.length > 100)) ||
      (data.minGuess !== undefined && (typeof data.minGuess !== "number" || !Number.isFinite(data.minGuess) || data.correctAnswer < data.minGuess)) ||
      (data.maxGuess !== undefined && (typeof data.maxGuess !== "number" || !Number.isFinite(data.maxGuess) || data.correctAnswer > data.maxGuess)) ||
      (typeof data.minGuess === "number" && typeof data.maxGuess === "number" && data.minGuess > data.maxGuess)) return null;
    return { ...shared, type: "estimate", ...(typeof data.unit === "string" ? { unit: data.unit } : {}), ...(typeof data.minGuess === "number" ? { minGuess: data.minGuess } : {}), ...(typeof data.maxGuess === "number" ? { maxGuess: data.maxGuess } : {}) };
  }
  if (data.type !== "multiple_choice" || !Array.isArray(data.options) || data.options.length !== 4 || !data.options.every(nonemptyString) || new Set(data.options).size !== 4 || typeof data.correctAnswerIndex !== "number" || !Number.isInteger(data.correctAnswerIndex) || data.correctAnswerIndex < 0 || data.correctAnswerIndex > 3) return null;
  return { ...shared, type: "multiple_choice", options: [...data.options] };
}

export function isValidAnswer(question: PublicQuestion, answer: unknown): answer is number {
  if (typeof answer !== "number" || !Number.isFinite(answer)) return false;
  return question.type === "multiple_choice"
    ? Number.isInteger(answer) && answer >= 0 && answer < 4
    : (question.minGuess === undefined || answer >= question.minGuess) && (question.maxGuess === undefined || answer <= question.maxGuess);
}
