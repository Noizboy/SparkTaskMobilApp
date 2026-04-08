import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function OverviewSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-gray-200 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-lg" />
                  <div className="text-right">
                    <Skeleton className="h-4 w-24 mb-2 ml-auto" />
                    <Skeleton className="h-8 w-12 ml-auto" />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                  <Skeleton className="h-3 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders Table */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-9 w-24" />
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>

            {/* Table Rows */}
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`hidden md:grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-4 py-4 ${i !== 4 ? 'border-b border-gray-200' : ''}`}
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
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`mobile-${i}`} className="md:hidden p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
