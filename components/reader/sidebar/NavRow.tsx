"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type NavRowProps = {
  label: string;
  active?: boolean;
  count?: number;
  icon?: LucideIcon;
  compact?: boolean;
  onClick: () => void;
};

export function NavRow({
  label,
  active,
  count,
  icon: Icon,
  compact,
  onClick,
}: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 text-left transition-colors",
        compact ? "rounded-xl px-3 py-2 text-xs" : "rounded-xl px-3 py-2.5 text-sm",
        active
          ? "bg-[color:var(--accent-muted)] font-medium text-[color:var(--accent)]"
          : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            compact ? "h-6 w-6" : "h-8 w-8",
            active
              ? "bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
              : "bg-[color:var(--hover-row)] text-[color:var(--muted)]",
          )}
        >
          <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined ? (
        <span
          className={cn(
            "shrink-0 tabular-nums text-[color:var(--muted)]",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
