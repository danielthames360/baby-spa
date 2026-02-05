import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="h-[calc(100vh-120px)] p-4">
      <div className="mb-4 flex items-center justify-between">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        {/* Day headers */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded" />
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="grid grid-cols-8 gap-2">
              <Skeleton className="h-16 w-16 rounded" />
              {Array.from({ length: 7 }).map((_, col) => (
                <Skeleton key={col} className="h-16 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
