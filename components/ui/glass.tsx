"use client";

import { cn } from "@/lib/cn";

type GlassButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
};

export function GlassButton({
  children,
  type = "button",
  className,
  disabled,
  onClick,
  title,
}: GlassButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    // 添加按钮按压动画
    e.currentTarget.classList.add("animate-button-press");
    setTimeout(() => {
      e.currentTarget.classList.remove("animate-button-press");
    }, 150);
    
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={cn(
        "glass-button relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
        "gpu-accelerated",
        className,
      )}
      disabled={disabled}
      onClick={handleClick}
      title={title}
    >
      {children}
    </button>
  );
}

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-2xl",
        "transition-shadow duration-300 ease-out",
        "gpu-accelerated",
        className,
      )}
    >
      {children}
    </div>
  );
}

type GlassInputProps = {
  className?: string;
  type?: string;
  inputMode?: "url" | "search" | "email" | "numeric" | "tel" | "text" | "none" | "decimal";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export function GlassInput({
  className,
  type = "text",
  inputMode,
  placeholder,
  value,
  onChange,
  onKeyDown,
}: GlassInputProps) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      className={cn(
        "glass-input w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 ease-out",
        "hover:border-sky-300/50 focus:border-sky-400/70",
        "gpu-accelerated",
        className,
      )}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}
