import { Skeleton } from "@/components/ui/skeleton";

export function PlaySkeleton() {
  return (
    <div className="w-full max-w-150" role="status" aria-busy="true">
      <span className="sr-only">Loading your challenge…</span>
      <div
        aria-hidden="true"
        className="**:data-[slot=skeleton]:bg-drexel-tile **:data-[slot=skeleton]:motion-reduce:animate-none"
      >
        <Skeleton className="mx-auto mb-6 h-9 w-48" />
        <div className="p-9 border border-drexel-panel-border rounded-[20px] bg-drexel-panel shadow-[0_12px_40px_#15365b08] [@media(max-width:600px)]:px-5 [@media(max-width:600px)]:py-6">
          <Skeleton className="ml-auto h-5 w-28" />
          <div className="flex gap-2 mt-4 mb-8">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-1.25 flex-1 rounded-full" />
            ))}
          </div>
          <Skeleton className="mb-3 h-4.5 w-36" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          <Skeleton className="mt-3 mb-6 h-5 w-32" />
          <div className="grid gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex items-center gap-3.5 min-h-15.5 py-3.5 px-4 border border-drexel-panel-border rounded-[12px] [@media(max-width:600px)]:p-3 [@media(max-width:600px)]:gap-2.5"
              >
                <Skeleton className="size-7.5 shrink-0 rounded-[7px]" />
                <Skeleton className="h-5 w-3/5" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-drexel-header-border dark:border-drexel-panel-border">
            <Skeleton className="h-12 w-20 rounded-full" />
            <Skeleton className="h-12.5 w-44 max-w-full rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-around flex-wrap gap-y-4 gap-x-6 pt-8 px-1">
          <div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-1.25 h-5 w-36" />
          </div>
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
    </div>
  );
}
