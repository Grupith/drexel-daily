"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin/client";
import { getChallengeDay } from "@/lib/challenges/date";
import type { AdminPage, AdminChallenge, AdminQuestion } from "@/types/admin";
import { AdminLoading, Badge, ErrorNotice, ConfirmDialog, challengeDate } from "./common";
import { ChallengePreview } from "./challenge-preview";
export function ChallengeList() {
    const [page, setPage] = useState<AdminPage<AdminChallenge>>();
    const [cursor, setCursor] = useState("");
    const [previous, setPrevious] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<AdminChallenge>();
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState<{
        date: string;
        questions: AdminQuestion[];
    }>();
    const load = useCallback(async () => { try {
        const result = await adminFetch<AdminPage<AdminChallenge>>(`challenges?cursor=${encodeURIComponent(cursor)}`);
        setError("");
        setPage(result);
    }
    catch (e) {
        setError((e as Error).message);
    } }, [cursor]);
    useEffect(() => { const controller = new AbortController(); adminFetch<AdminPage<AdminChallenge>>(`challenges?cursor=${encodeURIComponent(cursor)}`, { signal: controller.signal }).then(result => { setError(""); setPage(result); }).catch(e => { if (!controller.signal.aborted)
        setError(e.message); }); return () => controller.abort(); }, [cursor]);
    async function remove() { if (!deleting)
        return; setBusy(true); try {
        await adminFetch(`challenges/${deleting.id}`, { method: "DELETE" });
        setDeleting(undefined);
        toast.success("Draft deleted");
        await load();
    }
    catch (e) {
        toast.error((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function showPreview(c: AdminChallenge) { setBusy(true); try {
        setPreview({ date: c.date, questions: await Promise.all(c.questionIds.map(id => adminFetch<AdminQuestion>(`questions/${id}`))) });
    }
    catch (e) {
        toast.error((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    const today = getChallengeDay().date;
    return <><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px]">Challenges</h1><p className="mt-3 text-sm leading-normal text-drexel-description">Plan upcoming weekdays and review published content.</p></div><Button nativeButton={false} render={<Link href="/admin/challenges/new"/>}><Plus />Create Challenge</Button></div>{error ? <ErrorNotice message={error} retry={load}/> : !page ? <AdminLoading /> : <><div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted/50"><tr>{["Date", "Number of Questions", "Status", "Actions"].map(c => <th key={c} className="p-3 font-medium">{c}</th>)}</tr></thead><tbody>{page.items.map(c => <tr key={c.id} className="border-t"><td className="whitespace-nowrap p-3">{challengeDate(c.date)} <span className="ml-2">{c.date > today ? <Badge tone="violet">Upcoming</Badge> : c.date === today ? <Badge tone="blue">Today</Badge> : null}</span></td><td className="p-3">{c.questionIds.length} / 3</td><td className="p-3"><Badge tone={c.status === "published" ? "blue" : "amber"}>{c.status === "published" ? "Published" : "Draft"}</Badge></td><td className="p-3"><div className="flex gap-2"><Button nativeButton={false} variant="outline" render={<Link href={`/admin/challenges/${c.id}/edit`}/>}>{c.status === "draft" ? "Edit" : "View"}</Button><Button variant="outline" disabled={busy} onClick={() => showPreview(c)}>Preview</Button>{c.testUnavailableReason ? <div><Button variant="outline" disabled aria-describedby={`test-reason-${c.id}`}>Test</Button><p id={`test-reason-${c.id}`} className="mt-1 max-w-48 text-xs text-muted-foreground">{c.testUnavailableReason}</p></div> : <Button nativeButton={false} variant="outline" render={<Link href={`/admin/challenges/${c.id}/test`} />}>Test</Button>}{c.status === "draft" && <Button variant="destructive" disabled={busy} onClick={() => setDeleting(c)}>Delete</Button>}</div></td></tr>)}{!page.items.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No challenges yet. Create your first draft.</td></tr>}</tbody></table></div><div className="flex justify-end gap-2"><Button variant="outline" disabled={!previous.length} onClick={() => { setPage(undefined); setCursor(previous.at(-1)!); setPrevious(previous.slice(0, -1)); }}>Previous</Button><Button variant="outline" disabled={!page.next} onClick={() => { setPage(undefined); setPrevious([...previous, cursor]); setCursor(page.next!); }}>Next</Button></div></>}<ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open && !busy)
        setDeleting(undefined); }} title="Delete draft challenge?"><p className="mb-6 text-sm text-muted-foreground">This removes the draft. Its questions remain in the library.</p><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete draft"}</Button></ConfirmDialog><ChallengePreview open={!!preview} onOpenChange={open => { if (!open)
        setPreview(undefined); }} date={preview?.date ?? ""} questions={preview?.questions ?? []}/></>;
}
