import { z } from "zod";
const shared = {
    text: z.string().trim().min(1).max(2000),
    category: z.string().trim().min(1).max(100),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
    imageUrl: z.string().max(2000).startsWith("https://").nullable().optional(),
    explanation: z.string().trim().max(5000).default(""),
};
export const questionSchema = z.discriminatedUnion("type", [
    z.object({ ...shared, type: z.literal("multiple_choice"), options: z.array(z.string().trim().min(1).max(500)).length(4).refine(v => new Set(v).size === 4, "Provide four distinct answers."), correctAnswerIndex: z.number().int().min(0).max(3) }),
    z.object({ ...shared, type: z.literal("estimate"), correctAnswer: z.number().finite(), unit: z.string().trim().max(100).optional(), minGuess: z.number().finite().optional(), maxGuess: z.number().finite().optional() }),
]).superRefine((data, ctx) => {
    if (data.type !== "estimate") return;
    if (data.minGuess !== undefined && data.maxGuess !== undefined && data.minGuess > data.maxGuess)
        ctx.addIssue({ code: "custom", message: "Minimum guess must not exceed maximum guess." });
    if ((data.minGuess !== undefined && data.correctAnswer < data.minGuess) || (data.maxGuess !== undefined && data.correctAnswer > data.maxGuess))
        ctx.addIssue({ code: "custom", message: "Correct answer must fall within the allowed range." });
});
export function validateQuestion(input: Record<string, unknown>) {
    if (input.type !== undefined && input.type !== "multiple_choice" && input.type !== "estimate")
        throw new Error("Unsupported question type.");
    const result = questionSchema.safeParse({ ...input, type: input.type ?? "multiple_choice", imageUrl: input.imageUrl || null });
    if (!result.success) throw new Error(result.error.issues.map(issue => issue.message).join(" "));
    if (result.data.type === "estimate") {
        if (result.data.unit === undefined) delete result.data.unit;
        if (result.data.minGuess === undefined) delete result.data.minGuess;
        if (result.data.maxGuess === undefined) delete result.data.maxGuess;
    }
    return { ...result.data, imageUrl: result.data.imageUrl ?? null, isActive: true };
}
export function validChallengeDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        return false;
    const value = new Date(date + "T12:00:00Z");
    return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === date && ![0, 6].includes(value.getUTCDay());
}
