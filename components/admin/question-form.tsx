"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { validateQuestion } from "@/lib/admin/validation";
import { adminFetch } from "@/lib/admin/client";
import type { AdminQuestion } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminLoading, ErrorNotice, selectClass } from "./common";
const blank = { type: "multiple_choice", correctAnswer: "", unit: "", minGuess: "", maxGuess: "", text: "", category: "", difficulty: "Medium", options: ["", "", "", ""], correctAnswerIndex: 0, imageUrl: "", explanation: "" };
export function QuestionForm({ id }: {
    id?: string;
}) {
    const router = useRouter();
    const [data, setData] = useState(blank);
    const [loading, setLoading] = useState(!!id);
    const [error, setError] = useState("");
    const [loadFailed, setLoadFailed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [locked, setLocked] = useState(false);
    useEffect(() => { if (!id)
        return; adminFetch<AdminQuestion>(`questions/${id}`).then(q => { setData({ ...blank, type: q.type, text: q.text, category: q.category, difficulty: q.difficulty ?? "Medium", ...(q.type === "estimate" ? { correctAnswer: String(q.correctAnswer), unit: q.unit ?? "", minGuess: q.minGuess === undefined ? "" : String(q.minGuess), maxGuess: q.maxGuess === undefined ? "" : String(q.maxGuess) } : { options: q.options, correctAnswerIndex: q.correctAnswerIndex }), imageUrl: q.imageUrl ?? "", explanation: q.explanation ?? "" }); setLocked(q.usage === "Published"); }).catch(e => { setError(e.message); setLoadFailed(true); }).finally(() => setLoading(false)); }, [id]);
    async function save(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(""); try {
        const payload = validateQuestion({ ...data, ...(data.type === "estimate" ? { correctAnswer: data.correctAnswer.trim() === "" ? undefined : Number(data.correctAnswer), minGuess: data.minGuess.trim() === "" ? undefined : Number(data.minGuess), maxGuess: data.maxGuess.trim() === "" ? undefined : Number(data.maxGuess) } : {}) });
        await adminFetch(id ? `questions/${id}` : "questions", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
        toast.success(id ? "Question updated" : "Question created");
        router.push("/admin/questions");
    }
    catch (e) {
        setError((e as Error).message);
        toast.error((e as Error).message);
    }
    finally {
        setSaving(false);
    } }
    async function upload(file?: File) {
        if (!file)
            return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
            toast.error("Use a PNG, JPEG, or WebP image up to 5 MB.");
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.set("image", file);
            const result = await adminFetch<{
                imageUrl: string;
            }>("images", { method: "POST", body: form });
            setData(current => ({ ...current, imageUrl: result.imageUrl }));
            toast.success("Image uploaded");
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setUploading(false);
        }
    }
    if (loading)
        return <AdminLoading />;
    return <><div><h1 className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px]">{id ? "Question details" : "Create Question"}</h1><p className="mt-3 text-sm leading-normal text-drexel-description">Choose a question type and its correct answer.</p></div>{error && <ErrorNotice message={error}/>}{locked && <p className="rounded-lg border bg-muted p-4 text-sm">This question belongs to a published challenge and is locked to preserve scoring.</p>}<form onSubmit={save} className="max-w-3xl space-y-6"><fieldset disabled={saving || uploading || locked || loadFailed} className="space-y-6"><Card><CardHeader><CardTitle>Question details</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><label htmlFor="question-type">Question Type</label><Select name="type" required value={data.type} disabled={saving || uploading || locked || loadFailed} onValueChange={value => { if (value === "multiple_choice" || value === "estimate") setData({ ...data, type: value }); }}><SelectTrigger id="question-type" className="w-full" aria-describedby="question-type-help"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="multiple_choice">Multiple Choice</SelectItem><SelectItem value="estimate">Estimate</SelectItem></SelectContent></Select><p id="question-type-help" className="text-xs text-muted-foreground">Choose multiple choice or an exact numerical estimate.</p></div><label className="block space-y-2"><span>Question text</span><textarea required maxLength={2000} value={data.text} onChange={e => setData({ ...data, text: e.target.value })} className="min-h-24 w-full rounded-lg border bg-background p-3"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span>Category</span><Input required maxLength={100} value={data.category} onChange={e => setData({ ...data, category: e.target.value })} placeholder="e.g. Safety"/></label><label className="space-y-2"><span>Difficulty</span><select className={`${selectClass} w-full`} value={data.difficulty} onChange={e => setData({ ...data, difficulty: e.target.value })}>{["Easy", "Medium", "Hard"].map(v => <option key={v}>{v}</option>)}</select></label></div><label className="block space-y-2"><span>Image URL <span className="text-muted-foreground">(optional)</span></span><Input type="url" maxLength={2000} placeholder="https://…" value={data.imageUrl} onChange={e => setData({ ...data, imageUrl: e.target.value })}/><span className="block text-xs text-muted-foreground">Use an existing HTTPS image URL or upload below.</span></label><label className="block space-y-2"><span>Upload image (optional)</span><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { void upload(e.target.files?.[0]); }}/><span className="block text-xs text-muted-foreground">{uploading ? "Uploading…" : "PNG, JPEG, or WebP · maximum 5 MB"}</span></label><label className="block space-y-2"><span>Explanation <span className="text-muted-foreground">(optional)</span></span><textarea maxLength={5000} className="min-h-24 w-full rounded-lg border bg-background p-3" value={data.explanation} onChange={e => setData({ ...data, explanation: e.target.value })}/></label></CardContent></Card>{data.type === "estimate" ? <Card><CardHeader><CardTitle>Estimate answer</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span>Correct Answer</span><Input type="number" step="any" required value={data.correctAnswer} onChange={e => setData({ ...data, correctAnswer: e.target.value })}/></label><label className="space-y-2"><span>Unit (optional)</span><Input maxLength={100} placeholder="e.g. employees" value={data.unit} onChange={e => setData({ ...data, unit: e.target.value })}/></label><label className="space-y-2"><span>Minimum Guess (optional)</span><Input type="number" step="any" value={data.minGuess} onChange={e => setData({ ...data, minGuess: e.target.value })}/></label><label className="space-y-2"><span>Maximum Guess (optional)</span><Input type="number" step="any" value={data.maxGuess} onChange={e => setData({ ...data, maxGuess: e.target.value })}/></label><p className="text-sm text-muted-foreground sm:col-span-2">Only an exact numerical answer earns credit.</p></CardContent></Card> : <Card><CardHeader><CardTitle>Answer options</CardTitle><p className="text-sm text-muted-foreground">Select the radio button beside the correct answer.</p></CardHeader><CardContent className="space-y-3">{data.options.map((option, index) => <div key={index} className="flex items-center gap-3"><input type="radio" name="correct" aria-label={`Answer ${String.fromCharCode(65 + index)} is correct`} checked={data.correctAnswerIndex === index} onChange={() => setData({ ...data, correctAnswerIndex: index })} className="size-5 accent-primary"/><label className="flex flex-1 items-center gap-3"><span>{String.fromCharCode(65 + index)}</span><Input required maxLength={500} value={option} onChange={e => setData({ ...data, options: data.options.map((v, i) => i === index ? e.target.value : v) })}/></label></div>)}</CardContent></Card>}{!locked && <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save question"}</Button>}</fieldset><Button nativeButton={false} variant="outline" render={<Link href="/admin/questions"/>}>{locked ? "Back to questions" : "Cancel"}</Button></form></>;
}
