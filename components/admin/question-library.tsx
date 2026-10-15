"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin/client";
import type { AdminPage, AdminQuestion } from "@/types/admin";
import { AdminLoading, Badge, ErrorNotice, ConfirmDialog, selectClass } from "./common";
export function QuestionLibrary({ onSelect, excluded = [] }: {
    onSelect?: (question: AdminQuestion) => void;
    excluded?: string[];
}) {
    const [page, setPage] = useState<AdminPage<AdminQuestion>>();
    const [cursor, setCursor] = useState("");
    const [previous, setPrevious] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<AdminQuestion>();
    const [busy, setBusy] = useState(false);
    const load = useCallback(async () => { try {
        const result = await adminFetch<AdminPage<AdminQuestion>>(`questions?${new URLSearchParams({ cursor, search, category, difficulty, type })}`);
        setError("");
        setPage(result);
    }
    catch (e) {
        setError((e as Error).message);
    } }, [cursor, search, category, difficulty, type]);
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => { adminFetch<AdminPage<AdminQuestion>>(`questions?${new URLSearchParams({ cursor, search, category, difficulty, type })}`, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) {
            setError("");
            setPage(result);
        } }).catch(e => { if (!controller.signal.aborted)
            setError(e.message); }); }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [cursor, search, category, difficulty, type]);
    const rows = [...(page?.items ?? [])].sort((a, b) => Number(a.usage !== "Unused") - Number(b.usage !== "Unused"));
    function resetPage() { setCursor(""); setPrevious([]); setPage(undefined); }
    async function remove() { if (!deleting)
        return; setBusy(true); try {
        await adminFetch(`questions/${deleting.id}`, { method: "DELETE" });
        toast.success("Question deleted");
        setDeleting(undefined);
        await load();
    }
    catch (e) {
        toast.error((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <div className="space-y-4">{!onSelect && <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px]">Questions</h1><p className="mt-3 text-sm leading-normal text-drexel-description">Build and manage your question library.</p></div><Button nativeButton={false} render={<Link href="/admin/questions/new"/>}><Plus />Create Question</Button></div>}<div className="flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Search question text" placeholder="Search questions…" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}/></div><Input aria-label="Category filter" className="w-44" placeholder="Filter category…" value={category} onChange={e => { setCategory(e.target.value); resetPage(); }}/><select aria-label="Question type filter" className={selectClass} value={type} onChange={e => { setType(e.target.value); resetPage(); }}><option value="">All question types</option><option value="multiple_choice">Multiple Choice</option><option value="estimate">Estimate</option></select><select aria-label="Difficulty" className={selectClass} value={difficulty} onChange={e => { setDifficulty(e.target.value); resetPage(); }}><option value="">All difficulties</option>{["Easy", "Medium", "Hard"].map(d => <option key={d}>{d}</option>)}</select></div><p className="text-xs text-muted-foreground">Search matches question text; category matches the full category name. Each search page checks up to 100 records. Use Next to continue searching. Unused matches appear first.</p>{error ? <ErrorNotice message={error} retry={load}/> : !page ? <AdminLoading /> : <><div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted/50"><tr>{["Question", "Category", "Type", "Difficulty", "Usage Status", "Actions"].map(c => <th key={c} className="p-3 font-medium">{c}</th>)}</tr></thead><tbody>{rows.map(q => <tr key={q.id} className="border-t"><td className="min-w-48 max-w-md p-3">{q.text}</td><td className="p-3">{q.category}</td><td className="p-3"><Badge tone={q.type === "multiple_choice" ? "blue" : q.type === "estimate" ? "violet" : "neutral"}>{q.type === "multiple_choice" ? "Multiple Choice" : q.type === "estimate" ? "Estimate" : "Unsupported"}</Badge></td><td className="p-3"><Badge tone={q.difficulty === "Easy" ? "green" : q.difficulty === "Hard" ? "red" : "amber"}>{q.difficulty ?? "Medium"}</Badge></td><td className="p-3"><Badge tone={q.usage === "Published" ? "blue" : q.usage === "Draft" ? "amber" : "green"}>{q.usage}</Badge></td><td className="p-3"><div className="flex gap-2">{onSelect ? <Button disabled={q.usage === "Published" || excluded.includes(q.id)} onClick={() => onSelect(q)}>Select</Button> : <><Button nativeButton={false} variant="outline" render={<Link href={`/admin/questions/${q.id}/edit`}/>}>{q.usage === "Published" ? "View" : "Edit"}</Button><Button variant="destructive" disabled={q.usage !== "Unused"} onClick={() => setDeleting(q)}>Delete</Button></>}</div></td></tr>)}{!rows.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No matching questions in this batch. Use Next if available to continue.</td></tr>}</tbody></table></div><div className="flex justify-end gap-2"><Button variant="outline" disabled={!previous.length} onClick={() => { setPage(undefined); setCursor(previous.at(-1)!); setPrevious(previous.slice(0, -1)); }}>Previous</Button><Button variant="outline" disabled={!page.next} onClick={() => { setPage(undefined); setPrevious([...previous, cursor]); setCursor(page.next!); }}>Next</Button></div></>}<ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open && !busy)
        setDeleting(undefined); }} title="Delete question?"><p className="mb-6 text-sm text-muted-foreground">This permanently deletes the unused question. Questions assigned to any challenge cannot be deleted.</p><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete question"}</Button></ConfirmDialog></div>;
}
