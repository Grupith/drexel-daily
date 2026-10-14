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
    data.type !== "multiple_choice" ||
    !nonemptyString(data.text) ||
    !nonemptyString(data.category) ||
    !Array.isArray(data.options) ||
    data.options.length !== 4 ||
    !data.options.every(nonemptyString) ||
    new Set(data.options).size !== 4 ||
    !Number.isInteger(data.correctAnswerIndex) ||
    typeof data.correctAnswerIndex !== "number" ||
    data.correctAnswerIndex < 0 ||
    data.correctAnswerIndex > 3 ||
    typeof data.isActive !== "boolean" ||
    !(
      data.imageUrl == null ||
      (typeof data.imageUrl === "string" && /^https?:\/\//.test(data.imageUrl))
    )
  )
    return null;
  // isActive controls future scheduling; deactivation must not alter a published challenge.
  return {
    id,
    text: data.text,
    category: data.category,
    type: data.type,
    options: [...data.options],
    imageUrl: data.imageUrl ?? null,
  };
}
