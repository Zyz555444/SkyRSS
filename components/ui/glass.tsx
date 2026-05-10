"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function GlassPanel({
  className,
  children,
  ...rest
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl border p-4 shadow-xl transition-[box-shadow,transform] duration-200",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function GlassButton({
  className,
  children,
  ...rest
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "glass-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GlassInput({
  className,
  ...rest
}: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "glass-input w-full rounded-xl border px-3 py-2 text-sm transition-[border-color,box-shadow]",
        "placeholder:text-[color:var(--muted)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        className,
      )}
      {...rest}
    />
  );
}

export function GlassLink({
  className,
  children,
  ...rest
}: ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "glass-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium no-underline transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
