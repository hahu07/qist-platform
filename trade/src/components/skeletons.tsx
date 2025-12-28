export function InvestmentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-4 md:p-6 lg:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 md:mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 md:gap-4 mb-3">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-48 mb-2"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32"></div>
            </div>
          </div>
        </div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-32"></div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-neutral-200 dark:border-neutral-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-20 mb-2"></div>
            <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-24"></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
        <div className="w-full sm:flex-1 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
        <div className="w-full sm:w-auto h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
        <div className="w-full sm:w-auto h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
      </div>
    </div>
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse">
      <div className="h-2 bg-neutral-200 dark:bg-neutral-800"></div>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-48 mb-2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32 mb-2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-40"></div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full mb-2"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6"></div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-40"></div>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3"></div>
          <div className="flex items-center justify-between mt-2">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-20"></div>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-24"></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-full mb-1"></div>
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-20"></div>
            </div>
          ))}
        </div>

        <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
      </div>
    </div>
  );
}

export function PortfolioStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-4 md:p-6 animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-24"></div>
            <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
          </div>
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-32 mb-2"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}
