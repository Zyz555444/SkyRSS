"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { GlassButton, GlassInput } from "@/components/ui/glass";
import { cn } from "@/lib/cn";

type ReaderTopBarProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  refreshDisabled?: boolean;
  authSlot: import("react").ReactNode;
};

export function ReaderTopBar({
  searchQuery,
  onSearchChange,
  onRefresh,
  onMarkAllRead,
  onToggleTheme,
  isDark,
  refreshDisabled,
  authSlot,
}: ReaderTopBarProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-3 border-b border-[color:var(--glass-border)] px-4 py-3 backdrop-blur-xl md:gap-4 md:px-6",
        "bg-[color:var(--topbar-bg)]",
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="text-2xl" aria-hidden>
          ☁️
        </span>
        <span className="text-lg font-bold tracking-tight text-[color:var(--text)]">
          SkyRSS
        </span>
      </div>

      <div className="order-last flex w-full min-w-0 md:order-none md:flex-1 md:justify-center">
        <GlassInput
          type="search"
          className="max-w-xl rounded-full border-[color:var(--glass-border)] py-2.5 md:mx-auto"
          placeholder="搜索订阅或文章"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="搜索订阅或文章"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
        <GlassButton
          type="button"
          className="h-10 w-10 shrink-0 rounded-full p-0 text-base"
          title="全部标为已读"
          onClick={onMarkAllRead}
        >
          ✓
        </GlassButton>
        <GlassButton
          type="button"
          className="h-10 w-10 shrink-0 rounded-full p-0 text-base"
          title="刷新"
          disabled={refreshDisabled}
          onClick={onRefresh}
        >
          ↻
        </GlassButton>
        <GlassButton
          type="button"
          className="h-10 w-10 shrink-0 rounded-full p-0 text-lg"
          title={isDark ? "浅色模式" : "深色模式"}
          onClick={onToggleTheme}
        >
          {isDark ? "☀️" : "🌙"}
        </GlassButton>
        <div className="flex items-center pl-1">{authSlot}</div>
      </div>
    </header>
  );
}

export function ReaderAuthSlot({
  clerkLoaded,
  isSignedIn,
  authLoading,
}: {
  clerkLoaded: boolean;
  isSignedIn: boolean;
  authLoading: boolean;
}) {
  if (!clerkLoaded) {
    return <span className="text-xs text-[color:var(--muted)]">…</span>;
  }
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <GlassButton type="button" className="text-xs" disabled={authLoading}>
          {authLoading ? "…" : "登录"}
        </GlassButton>
      </SignInButton>
    );
  }
  return <UserButton />;
}
