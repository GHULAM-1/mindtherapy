export function PatientCardSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Avatar skeleton */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />

          <div className="min-w-0 flex-1">
            {/* Name skeleton */}
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />

            {/* Tags skeleton */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-40" />
              <div className="h-6 bg-gray-200 rounded w-28" />
            </div>

            {/* Status skeleton */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-5 bg-gray-200 rounded-full w-20" />
              <div className="h-4 bg-gray-200 rounded w-36" />
            </div>
          </div>
        </div>

        {/* Progress section skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
          <div className="bg-gray-50 rounded-lg p-4 min-w-0 flex-shrink-0 w-full sm:w-auto">
            <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-28 mb-2" />
            <div className="w-32 h-2 bg-gray-200 rounded-full" />

            {/* Gamification stats skeleton */}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-12" />
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-11 h-11 bg-gray-200 rounded-lg" />
            <div className="w-11 h-11 bg-gray-200 rounded-lg" />
            <div className="w-11 h-11 bg-gray-200 rounded-lg" />
            <div className="w-11 h-11 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}
