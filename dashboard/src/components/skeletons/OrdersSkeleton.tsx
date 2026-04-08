import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function OrdersSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-7 w-24 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <Skeleton className="h-3 w-14 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-3 w-14 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-3 w-8 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-3 w-8 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`hidden md:grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-4 py-4 ${i !== 7 ? 'border-b border-gray-200' : ''}`}
            >
              <Skeleton className="h-5 w-20" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-44" />
              </div>
              <div>
                <Skeleton className="h-5 w-28 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-14 mx-auto" />
            </div>
          ))}

          {/* Mobile Skeleton Rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`mobile-${i}`} className="md:hidden p-4 border-b border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="border-t border-gray-200 pt-3 mb-3">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
          ))}

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-center gap-2 px-4 py-4 border-t border-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
