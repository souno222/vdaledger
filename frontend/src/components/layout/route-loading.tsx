import { Skeleton } from "@/components/feedback/states";

export function RouteLoading() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <div className="space-y-3 border-b border-white/10 pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

