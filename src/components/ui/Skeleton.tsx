'use client';

import { cn } from "@/utils/format";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-taysir-teal/5",
        className
      )}
    />
  );
}

export function WidgetSkeleton() {
  return (
    <div className="bento-card p-8 h-full min-h-[200px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>
      <div className="space-y-3 mt-8">
        <Skeleton className="w-3/4 h-12" />
        <Skeleton className="w-1/2 h-6" />
      </div>
    </div>
  );
}
