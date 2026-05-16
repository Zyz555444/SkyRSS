"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]";

export function Surface({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "ui-surface rounded-xl border p-4 transition-shadow duration-200",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function AppButton({
  className,
  variant = "default",
  children,
  ...rest
}: ComponentProps<"button"> & { variant?: "default" | "primary" | "ghost" }) {
  return (
    <button
      type="button"
      className={cn(
        "ui-button inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        variant === "primary" && "glass-button-primary",
        variant === "ghost" &&
          "border-transparent bg-transparent shadow-none hover:bg-[color:var(--hover-row)]",
        focusRing,
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function AppInput({ className, ...rest }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "ui-input w-full rounded-lg border px-3 py-2 text-sm transition-[border-color,box-shadow]",
        "placeholder:text-[color:var(--muted)]",
        focusRing,
        className,
      )}
      {...rest}
    />
  );
}

export function AppLink({ className, children, ...rest }: ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "ui-button inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors",
        focusRing,
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

/** @deprecated Use Surface */
export const GlassPanel = Surface;

/** @deprecated Use AppButton */
export const GlassButton = AppButton;

/** @deprecated Use AppInput */
export const GlassInput = AppInput;

/** @deprecated Use AppLink */
export const GlassLink = AppLink;
