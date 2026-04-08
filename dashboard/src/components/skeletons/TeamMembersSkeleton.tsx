import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function TeamMembersSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-44 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="shadow-md">
            <CardContent className="pt-6 relative">
              {/* Action Buttons Skeleton */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Skeleton className="w-8 h-8 rounded-md" />
                <Skeleton className="w-8 h-8 rounded-md" />
              </div>

              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <Skeleton className="w-16 h-16 rounded-full mb-4" />
                {/* Name */}
                <Skeleton className="h-5 w-32 mb-1" />
                {/* Email */}
                <Skeleton className="h-4 w-44 mb-3" />
                {/* Role Badge */}
                <Skeleton className="h-6 w-20 rounded-full" />
                {/* Orders completed */}
                <div className="mt-4 pt-4 border-t border-gray-200 w-full">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
