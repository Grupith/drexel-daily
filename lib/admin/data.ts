import "server-only";
import { loadTestChallenge } from "./test-challenge";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getAdminServices } from "@/firebase/admin";
import { AdminError } from "./auth";
import { validateQuestion, validChallengeDate } from "./validation";
import { toPublicQuestion } from "@/lib/challenges/content";
export function collectionName(kind: string) {
    if (kind !== "questions" && kind !== "challenges")
        throw new AdminError(404, "Not found.");
    return kind;
}
export function validId(id: string) { if (!id || id.includes("/") || id.length > 200)
    throw new AdminError(400, "Invalid document ID."); return id; }
export async function questionUsage(id: string) {
    const { db } = getAdminServices();
    const references = db.collection("challenges").where("questionIds", "array-contains", id);
    const published = await references.where("status", "==", "published").limit(1).get();
    if (!published.empty)
        return "Published";
    return (await references.limit(1).get()).empty ? "Unused" : "Draft";
}
export async function listAdmin(kind: string, params: URLSearchParams) {
    const { db } = getAdminServices();
    const search = (params.get("search") ?? "").trim().toLowerCase();
    const category = (params.get("category") ?? "").trim().toLowerCase();
    const difficulty = params.get("difficulty") ?? "";
    const type = params.get("type") ?? "";
    const filtered = kind === "questions" && !!(search || category || difficulty || type);
    const limit = filtered ? 100 : 25;
    let query = db.collection(collectionName(kind)).orderBy(FieldPath.documentId(), kind === "challenges" ? "desc" : "asc").limit(limit);
    const cursor = params.get("cursor");
    if (cursor)
        query = query.startAfter(validId(cursor));
    const result = await query.get();
    const matches = [];
    let last = "";
    let scanned = 0;
    for (const doc of result.docs) {
        scanned++;
        last = doc.id;
        const data = doc.data();
        if (filtered && (!String(data.text).toLowerCase().includes(search) || (category && String(data.category).toLowerCase() !== category) || (difficulty && (data.difficulty ?? "Medium") !== difficulty) || (type && data.type !== type)))
            continue;
        matches.push(doc);
        if (matches.length === 25)
            break;
    }
    const items = await Promise.all(matches.map(async (doc) => { const data = doc.data();
        let testUnavailableReason: string | null = null;
        if (kind === "challenges") {
            try { await loadTestChallenge(db, doc.id); }
            catch (error) {
                if (!(error instanceof AdminError)) throw error;
                testUnavailableReason = error.message;
            }
        }
        return kind === "questions" ? { id: doc.id, text: data.text, category: data.category, type: data.type, difficulty: data.difficulty ?? "Medium", ...(data.type === "estimate" ? { correctAnswer: data.correctAnswer, ...(data.unit !== undefined ? { unit: data.unit } : {}), ...(data.minGuess !== undefined ? { minGuess: data.minGuess } : {}), ...(data.maxGuess !== undefined ? { maxGuess: data.maxGuess } : {}) } : { options: data.options, correctAnswerIndex: data.correctAnswerIndex }), imageUrl: data.imageUrl ?? null, explanation: data.explanation ?? "", usage: await questionUsage(doc.id) } : { id: doc.id, date: data.date, status: data.status, questionIds: data.questionIds ?? [], testUnavailableReason }; }));
    return { items, next: last && (scanned < result.size || result.size === limit) ? last : null };
}
export async function mutateAdmin(kind: string, id: string, input: Record<string, unknown> | null, create = false) {
    const { db } = getAdminServices();
    const ref = db.collection(collectionName(kind)).doc(validId(id));
    return db.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (create && current.exists)
            throw new AdminError(409, "A challenge already exists for this date.");
        if (!create && !current.exists)
            throw new AdminError(404, "Document not found.");
        if (kind === "questions") {
            const references = db.collection("challenges").where("questionIds", "array-contains", id);
            if (!input && !(await tx.get(references.limit(1))).empty)
                throw new AdminError(409, "This question is assigned to a challenge. Remove draft assignments before deleting it.");
            if (!(await tx.get(references.where("status", "==", "published").limit(1))).empty)
                throw new AdminError(409, "Published challenge questions are locked to preserve scoring. Create a new question instead.");
            if (!input) {
                tx.delete(ref);
                return;
            }
            let data;
            try {
                data = validateQuestion(input);
            }
            catch (e) {
                throw new AdminError(400, (e as Error).message);
            }
            const obsolete = data.type === "estimate" ? ["options", "correctAnswerIndex"] : ["correctAnswer", "unit", "minGuess", "maxGuess"];
            const removed = Object.fromEntries([...obsolete, ...(data.type === "estimate" ? ["unit", "minGuess", "maxGuess"].filter(key => !(key in data)) : [])].map(key => [key, FieldValue.delete()]));
            tx.set(ref, { ...removed, ...data, ...(create ? { createdAt: FieldValue.serverTimestamp() } : {}), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        else {
            if (current.data()?.status === "published")
                throw new AdminError(409, "Published challenges are locked and cannot be edited or deleted.");
            if (!(await tx.get(db.collectionGroup("attempts").where("challengeDate", "==", id).limit(1))).empty)
                throw new AdminError(409, "Challenges with submissions cannot be changed or deleted.");
            if (!input) {
                tx.delete(ref);
                return;
            }
            if (!validChallengeDate(id))
                throw new AdminError(400, "Choose a valid Monday–Friday date in America/Chicago.");
            if (!["draft", "published"].includes(String(input.status)) || !Array.isArray(input.questionIds) || input.questionIds.length > 3 || !input.questionIds.every(v => typeof v === "string" && v && !v.includes("/")) || new Set(input.questionIds).size !== input.questionIds.length)
                throw new AdminError(400, "Select up to three different questions and a valid status.");
            const ids = input.questionIds as string[];
            if (input.status === "published" && ids.length !== 3)
                throw new AdminError(400, "Publishing requires exactly three questions.");
            const questions = ids.length ? await tx.getAll(...ids.map(q => db.collection("questions").doc(q))) : [];
            for (const question of questions) {
                if (!question.exists || !toPublicQuestion(question.id, question.data()) || question.data()?.isActive !== true)
                    throw new AdminError(400, "All selected questions must exist and have valid answers.");
                const usages = await tx.get(db.collection("challenges").where("questionIds", "array-contains", question.id).where("status", "==", "published").limit(1));
                if (!usages.empty)
                    throw new AdminError(409, "A selected question already belongs to a published challenge.");
            }
            // Question writes serialize concurrent publishing/editing/deletion without duplicate usage records.
            for (const question of questions)
                tx.update(question.ref, { updatedAt: FieldValue.serverTimestamp() });
            tx.set(ref, { date: id, status: input.status, questionIds: ids, ...(create ? { createdAt: FieldValue.serverTimestamp() } : {}), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
    });
}
