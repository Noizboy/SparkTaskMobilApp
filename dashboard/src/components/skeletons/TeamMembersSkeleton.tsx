import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function TeamMembersSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-44 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-lg" />
                <div className="text-right">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-7 w-10" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2.5 mt-2.5 flex items-center justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table Card ── */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Skeleton className="h-5 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-52" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header row */}
          <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16 ml-auto sm:ml-0" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
          {/* Table body rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0">
              <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-md flex-shrink-0" />
              <Skeleton className="h-5 w-16 rounded-md flex-shrink-0" />
              <Skeleton className="h-4 w-8 flex-shrink-0 ml-auto sm:ml-0" />
              <div className="flex gap-1 flex-shrink-0">
                <Skeleton className="w-7 h-7 rounded-md" />
                <Skeleton className="w-7 h-7 rounded-md" />
                <Skeleton className="w-7 h-7 rounded-md" />
              </div>
            </div>
          ))}
          {/* Pagination footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
