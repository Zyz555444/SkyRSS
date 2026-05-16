"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { AppButton, AppInput } from "@/components/ui/glass";
import { cn } from "@/lib/cn";

type ReaderTopBarProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onToggleTheme: () => void;
  onOpenSubscriptions: () => void;
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
  onOpenSubscriptions,
  isDark,
  refreshDisabled,
  authSlot,
}: ReaderTopBarProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 border-b border-[color:var(--border-subtle)] px-3 py-2.5 md:gap-3 md:px-4",
        "bg-[color:var(--topbar-bg)]",
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-[color:var(--text)]">
          SkyRSS
        </span>
        <AppButton
          type="button"
          className="hidden h-9 shrink-0 px-3 text-sm sm:inline-flex"
          onClick={onOpenSubscriptions}
        >
          订阅
        </AppButton>
      </div>

      <div className="order-last flex w-full min-w-0 sm:order-none sm:flex-1 sm:justify-center">
        <AppInput
          type="search"
          className="max-w-xl sm:mx-auto"
          placeholder="搜索订阅或文章"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="搜索订阅或文章"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <AppButton
          type="button"
          className="h-9 shrink-0 px-2.5 text-sm sm:hidden"
          onClick={onOpenSubscriptions}
        >
          订阅
        </AppButton>
        <AppButton
          type="button"
          variant="ghost"
          className="h-9 w-9 shrink-0 rounded-lg p-0"
          title="全部标为已读"
          onClick={onMarkAllRead}
        >
          ✓
        </AppButton>
        <AppButton
          type="button"
          variant="ghost"
          className="h-9 w-9 shrink-0 rounded-lg p-0"
          title="刷新"
          disabled={refreshDisabled}
          onClick={onRefresh}
        >
          ↻
        </AppButton>
        <AppButton
          type="button"
          variant="ghost"
          className="h-9 w-9 shrink-0 rounded-lg p-0"
          title={isDark ? "浅色模式" : "深色模式"}
          onClick={onToggleTheme}
        >
          {isDark ? "☀" : "☾"}
        </AppButton>
        <div className="flex items-center pl-0.5">{authSlot}</div>
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
        <AppButton type="button" className="text-xs" disabled={authLoading}>
          {authLoading ? "…" : "登录"}
        </AppButton>
      </SignInButton>
    );
  }
  return <UserButton />;
}
