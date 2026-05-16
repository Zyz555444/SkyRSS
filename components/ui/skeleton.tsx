"use client";

import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
};

export function Skeleton({
  className,
  width,
  height,
  borderRadius = "0.5rem",
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
    borderRadius,
  };

  return (
    <div
      className={cn("skeleton", className)}
      style={style}
      aria-hidden="true"
    />
  );
}

type ArticleListSkeletonProps = {
  count?: number;
};

export function ArticleListSkeleton({ count = 5 }: ArticleListSkeletonProps) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-transparent bg-[color:var(--glass-bg-strong)] px-3 py-3"
          style={{
            animationDelay: `${i * 100}ms`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <Skeleton width="70%" height="1.25rem" />
            <Skeleton width="0.5rem" height="0.5rem" borderRadius="50%" />
          </div>
          <Skeleton width="90%" height="1rem" className="mt-1" />
          <div className="mt-2 flex justify-between">
            <Skeleton width="40%" height="0.875rem" />
            <Skeleton width="20%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

type ArticleReaderSkeletonProps = {
  showHeader?: boolean;
};

export function ArticleReaderSkeleton({
  showHeader = true,
}: ArticleReaderSkeletonProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
      {showHeader && (
        <div className="sticky top-0 z-10 shrink-0 border-b border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)] px-4 py-3 backdrop-blur-md">
          <Skeleton width="3rem" height="0.75rem" className="mb-2" />
          <Skeleton width="85%" height="1.5rem" className="mb-2" />
          <div className="flex gap-2">
            <Skeleton width="30%" height="0.75rem" />
            <Skeleton width="20%" height="0.75rem" />
          </div>
        </div>
      )}
      <div className="article-reading-shell px-4 py-4">
        <div className="flex flex-col gap-3">
          <Skeleton width="95%" height="1rem" />
          <Skeleton width="90%" height="1rem" />
          <Skeleton width="98%" height="1rem" />
          <Skeleton width="85%" height="1rem" />
          <Skeleton width="92%" height="1rem" />
          <Skeleton width="100%" height="200px" className="mt-4" />
          <Skeleton width="95%" height="1rem" className="mt-4" />
          <Skeleton width="88%" height="1rem" />
        </div>
      </div>
    </div>
  );
}

type SidebarSkeletonProps = {
  showHeader?: boolean;
};

export function SidebarSkeleton({ showHeader = true }: SidebarSkeletonProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton width="6rem" height="1.25rem" />
          <Skeleton width="2rem" height="2rem" borderRadius="50%" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Skeleton width="100%" height="2.5rem" />
        <Skeleton width="100%" height="2.5rem" />
        <Skeleton width="100%" height="2.5rem" />
        <Skeleton width="100%" height="2.5rem" />
        <Skeleton width="100%" height="2.5rem" />
      </div>
    </div>
  );
}

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin border-2 border-sky-200 border-t-sky-500 rounded-full",
        sizeClass[size],
        className,
      )}
      role="status"
      aria-label="加载中"
    />
  );
}
