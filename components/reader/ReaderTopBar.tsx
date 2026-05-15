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
        "bg-[color:var(--topbar-bg)] transition-colors duration-300",
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="text-2xl animate-float" aria-hidden>
          ☁️
        </span>
        <span className="text-lg font-bold tracking-tight text-[color:var(--text)]">
          SkyRSS
        </span>
      </div>

      <div className="order-last flex w-full min-w-0 md:order-none md:flex-1 md:justify-center">
        <GlassInput
          type="search"
          className="max-w-xl rounded-full border-[color:var(--glass-border)] py-2.5 md:mx-auto transition-all duration-200 focus:scale-[1.02]"
          placeholder="搜索订阅或文章"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="搜索订阅或文章"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
        <GlassButton
          type="button"
          className="h-10 w-10 shrink-0 rounded-full p-0 text-base transition-transform duration-200 hover:scale-110 active:scale-95"
          title="全部标为已读"
          onClick={onMarkAllRead}
        >
          ✓
        </GlassButton>
        <GlassButton
          type="button"
          className={cn(
            "h-10 w-10 shrink-0 rounded-full p-0 text-base transition-transform duration-200 hover:scale-110 active:scale-95",
            refreshDisabled && "animate-pulse-slow opacity-50",
          )}
          title="刷新"
          disabled={refreshDisabled}
          onClick={onRefresh}
        >
          <span className={cn(refreshDisabled && "animate-spin inline-block")}>
            ↻
          </span>
        </GlassButton>
        <GlassButton
          type="button"
          className="h-10 w-10 shrink-0 rounded-full p-0 text-lg transition-transform duration-200 hover:scale-110 active:scale-95"
          title={isDark ? "浅色模式" : "深色模式"}
          onClick={onToggleTheme}
        >
          <span className="inline-block transition-transform duration-300" key={String(isDark)}>
            {isDark ? "☀️" : "🌙"}
          </span>
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
