"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";
import { DREXEL_LOCATIONS } from "@/lib/locations";
import type { AdminPlayer, PlayerDetails, PlayersPage, PlayersSummary } from "@/types/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ErrorNotice, selectClass, challengeDate } from "./common";
import { adminTheme } from "./theme";

const number = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
function Avatar({ player }: { player: AdminPlayer }) {
  const [failed, setFailed] = useState(false);
  return player.photoURL && !failed ?
    // Google profile URLs are supplied by the existing user profile.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={player.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="size-10 shrink-0 rounded-full object-cover" /> :
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-drexel-avatar text-drexel-avatar-ink" aria-hidden="true">{player.displayName.charAt(0).toUpperCase()}</span>;
}
export function Players() {
  const [summary, setSummary] = useState<PlayersSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ search: "", location: "", sort: "registered", direction: "desc" });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [page, setPage] = useState<PlayersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<AdminPlayer | null>(null);
  const [details, setDetails] = useState<PlayerDetails | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailRevision, setDetailRevision] = useState(0);
  useEffect(() => {
    let active = true;
    adminFetch<PlayersSummary>("players/summary").then(data => { if (active) { setSummary(data); setSummaryError(""); } }).catch(e => { if (active) setSummaryError(e.message); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(filters);
    const cursor = cursors[cursors.length - 1];
    if (cursor) params.set("cursor", cursor);
    adminFetch<PlayersPage>(`players?${params}`).then(data => { if (active) setPage(data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, cursors, revision]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    adminFetch<PlayerDetails>(`players/${encodeURIComponent(selected.id)}`).then(data => { if (active) setDetails(data); }).catch(e => { if (active) setDetailError(e.message); });
    return () => { active = false; };
  }, [selected, detailRevision]);
  function changeFilters(next: typeof filters) { setFilters(next); setCursors([null]); setLoading(true); setError(""); }
  function navigate(next: (string | null)[]) { setCursors(next); setLoading(true); setError(""); }
  const player = details?.player ?? selected;
  return <>
    <div><h1 className="text-3xl font-bold tracking-tight">Players</h1><p className="mt-3 text-sm text-drexel-description">Registered players, performance, and recent challenge history.</p></div>
    {summaryError && <ErrorNotice message={summaryError} retry={() => setRevision(v => v + 1)} />}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {([ ["Total registered players", summary?.registered], ["Players active today", summary?.activeToday], ["Total challenges completed", summary?.completed], ["Total points earned", summary?.points] ] as const).map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm text-drexel-description">{label}</CardTitle></CardHeader><CardContent>{value === undefined ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-semibold tabular-nums">{number(value)}</p>}</CardContent></Card>)}
    </div>
    <Card><CardHeader><CardTitle>Player directory</CardTitle>
      <form onSubmit={e => { e.preventDefault(); changeFilters({ ...filters, search: search.trim() }); }} className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 text-sm">Name or email<Input value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder="Search players…" className="mt-1" /></label>
        <Button type="submit" variant="outline">Search</Button>
        <label className="text-sm">Location<select className={`${selectClass} mt-1 block w-full`} value={filters.location} onChange={e => changeFilters({ ...filters, location: e.target.value })}><option value="">All locations</option>{DREXEL_LOCATIONS.map(location => <option key={location}>{location}</option>)}</select></label>
        <label className="text-sm">Sort by<select className={`${selectClass} mt-1 block w-full`} value={filters.sort} onChange={e => changeFilters({ ...filters, sort: e.target.value })}>{[["registered", "Registration date"], ["points", "Total points"], ["streak", "Current streak"], ["completed", "Challenges completed"], ["lastPlayed", "Last played (participants)"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm">Order<select className={`${selectClass} mt-1 block w-full`} value={filters.direction} onChange={e => changeFilters({ ...filters, direction: e.target.value })}><option value="desc">Highest / newest first</option><option value="asc">Lowest / oldest first</option></select></label>
      </form>
      <p className="mt-3 text-xs text-drexel-description">Streaks show stored values; the current submission system does not update them. Last played sorting includes players with a recorded play date.</p>
      {filters.search && <p className="text-xs text-drexel-description">Search checks up to 100 players per batch. Continue to check more matches; each page shows up to 25 players.</p>}
    </CardHeader><CardContent>
      {error ? <ErrorNotice message={error} retry={() => { setLoading(true); setError(""); setRevision(v => v + 1); }} /> : <>
        <div className="overflow-x-auto"><Table className="w-full text-left text-sm"><caption className="sr-only">Registered players</caption><TableHeader className="border-b text-xs text-drexel-description"><TableRow>{["Player", "Email", "Location", "Total points", "Current streak", "Challenges completed", "Last played"].map(title => <TableHead key={title} className="whitespace-nowrap px-3 py-3 font-medium">{title}</TableHead>)}</TableRow></TableHeader><TableBody>
          {loading ? Array.from({ length: 5 }, (_, row) => <TableRow key={row}>{Array.from({ length: 7 }, (_, col) => <TableCell key={col} className="p-3"><Skeleton className="h-8 w-full min-w-20" /></TableCell>)}</TableRow>) : page?.items.map(p => <TableRow key={p.id} className="border-b last:border-0 hover:bg-muted/50"><TableCell className="px-3 py-4"><button onClick={() => { setSelected(p); setDetails(null); setDetailError(""); }} className="flex items-center gap-3 text-left font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"><Avatar key={p.id} player={p} /><span className="min-w-28">{p.displayName}</span></button></TableCell><TableCell className="px-3 py-4">{p.email || "—"}</TableCell><TableCell className="px-3 py-4">{p.locationId || "Unassigned"}</TableCell>{[p.totalPoints, p.currentStreak, p.challengesCompleted].map((value, i) => <TableCell key={i} className="px-3 py-4 tabular-nums">{number(value)}</TableCell>)}<TableCell className="whitespace-nowrap px-3 py-4">{p.lastPlayed ? challengeDate(p.lastPlayed) : "Never"}</TableCell></TableRow>)}
        </TableBody></Table></div>
        {!loading && !page?.items.length && <p role="status" className="py-12 text-center text-drexel-description">{filters.search && page?.next ? "No matches in this batch. Continue searching the next batch." : "No players found."}</p>}
        <div className="mt-5 flex items-center justify-between gap-3"><p aria-live="polite" className="text-xs text-drexel-description">Page {cursors.length} · up to 25 players</p><div className="flex gap-2"><Button variant="outline" disabled={loading || cursors.length === 1} onClick={() => navigate(cursors.slice(0, -1))}>Previous</Button><Button variant="outline" disabled={loading || !page?.next} onClick={() => navigate([...cursors, page!.next])}>{filters.search ? "Continue search" : "Next"}</Button></div></div>
      </>}
    </CardContent></Card>
    <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><SheetContent style={adminTheme} className="w-full overflow-y-auto bg-background font-drexel sm:max-w-xl"><SheetHeader className="pr-14"><SheetTitle>Player details</SheetTitle><SheetDescription>Account information and the 20 most recent completed challenges.</SheetDescription></SheetHeader>
      {player && <div className="space-y-6 px-4 pb-8"><div className="flex items-center gap-3"><Avatar key={player.id} player={player} /><div><h2 className="text-lg font-semibold">{player.displayName}</h2><p className="break-all text-muted-foreground">{player.email || "No email"}</p></div></div>
        <dl className="grid grid-cols-2 gap-4">{[["Assigned location", player.locationId || "Unassigned"], ["Account created", player.createdAt ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", dateStyle: "medium" }).format(new Date(player.createdAt)) : "Unavailable"]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1">{value}</dd></div>)}</dl>
        <h3 className="font-semibold">Player statistics</h3><dl className="grid grid-cols-2 gap-4">{[["Total points", number(player.totalPoints)], ["Current streak (stored)", number(player.currentStreak)], ["Longest streak (stored)", number(player.longestStreak)], ["Challenges completed", number(player.challengesCompleted)], ["Average score", player.averageScore === null ? "—" : `${number(player.averageScore)} points / challenge`], ["Last played", player.lastPlayed ? challengeDate(player.lastPlayed) : "Never"]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>
        <h3 className="font-semibold">Recent challenge history</h3>
        {detailError ? <ErrorNotice message={detailError} retry={() => { setDetailError(""); setDetailRevision(v => v + 1); }} /> : !details ? <Skeleton className="h-40 w-full" /> : !details.history.length ? <p className="text-muted-foreground">No completed challenges.</p> : <ul className="divide-y">{details.history.map(entry => <li key={entry.date} className="flex flex-wrap justify-between gap-2 py-3"><span>{challengeDate(entry.date)}</span><span className="tabular-nums">{number(entry.points)} points · {entry.correct}/{entry.questions} correct</span></li>)}</ul>}
      </div>}
    </SheetContent></Sheet>
  </>;
}
