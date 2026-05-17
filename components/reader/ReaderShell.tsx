"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ReaderShellProps = {
  children: ReactNode;
  className?: string;
};

export function ReaderShell({ children, className }: ReaderShellProps) {
  return (
    <div
      className={cn(
        "reader-shell mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
