import MainLayout from "@/components/layout/main-layout"

export default function ReportsLoading() {
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header Skeleton */}
        <div className="mb-6 md:mb-8">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
        </div>

        {/* Time Period Selector Skeleton */}
        <div className="mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-28 bg-muted rounded-md animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 md:p-6">
              <div className="h-3 w-24 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6">
              <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4"></div>
              <div className="h-[250px] bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Low Stock Table Skeleton */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="h-5 w-48 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 pb-3 border-b border-border">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse ml-auto"></div>
                  <div className="h-4 w-16 bg-muted rounded animate-pulse hidden sm:block"></div>
                  <div className="h-4 w-16 bg-muted rounded animate-pulse hidden md:block"></div>
                </div>

                {/* Table Rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-4 border-b border-border">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-muted rounded animate-pulse ml-auto"></div>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse hidden sm:block"></div>
                    <div className="h-4 w-20 bg-muted rounded animate-pulse hidden md:block"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Categories Skeleton */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="h-5 w-56 bg-muted rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded overflow-hidden animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
