"use client";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { adminTheme } from "./theme";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function AdminLoading() { return <div className="space-y-4" aria-label="Loading"><Skeleton className="h-10 w-60"/><Skeleton className="h-48 w-full"/></div>; }
export function Badge({ children, tone = "neutral" }: {
    children: React.ReactNode;
    tone?: "neutral" | "blue" | "violet" | "green" | "amber" | "red";
}) {
    return <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", {
        neutral: "border-border bg-muted text-muted-foreground",
        blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
        violet: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
        green: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
        amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
        red: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
    }[tone])}>{children}</span>;
}
export function Modal({ open, onOpenChange, title, children }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
}) {
    return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50"/><Dialog.Popup style={adminTheme} className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-6 font-drexel text-foreground shadow-lg **:data-[slot=button]:min-h-10 **:data-[slot=button]:rounded-full **:data-[slot=button]:px-4 **:data-[slot=input]:h-10"><div className="mb-4 flex items-center justify-between gap-4"><Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title><Dialog.Close render={<Button variant="ghost"/>}>Close</Dialog.Close></div>{children}</Dialog.Popup></Dialog.Portal></Dialog.Root>;
}
export function ErrorNotice({ message, retry }: {
    message: string;
    retry?: () => void;
}) { return <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{message} {retry && <Button variant="outline" onClick={retry}>Try again</Button>}</div>; }
export const selectClass = "h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-ring";
export function challengeDate(date: string) { return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric", weekday: "short" }).format(new Date(date + "T12:00:00Z")); }
export function ConfirmDialog({ open, onOpenChange, title, children }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
}) {
    return <AlertDialog.Root open={open} onOpenChange={onOpenChange}><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50"/><AlertDialog.Popup style={adminTheme} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 font-drexel text-foreground shadow-lg **:data-[slot=button]:min-h-10 **:data-[slot=button]:rounded-full **:data-[slot=button]:px-4"><AlertDialog.Title className="mb-4 text-xl font-semibold">{title}</AlertDialog.Title>{children}<AlertDialog.Close render={<Button variant="outline" className="ml-3"/>}>Cancel</AlertDialog.Close></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>;
}
