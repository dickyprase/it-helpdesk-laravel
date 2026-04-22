interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

export function TicketListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-3" />
                    <div className="flex gap-4">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                </div>
            ))}
        </div>
    );
}
