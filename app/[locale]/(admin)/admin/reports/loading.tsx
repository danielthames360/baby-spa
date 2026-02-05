import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Date picker and filters */}
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-12 w-40 rounded-xl" />
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>

      {/* Report tabs */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-lg" />
        ))}
      </div>

      {/* Report content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Summary cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="mb-2 h-10 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="mt-6 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="border-b border-gray-200 p-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="p-4">
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, col) => (
                  <Skeleton key={col} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
