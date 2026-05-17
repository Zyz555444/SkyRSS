"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { CheckCircle2, Moon, RefreshCw, Sun } from "lucide-react";
import { SkyRssIcon, SkyRssLogo } from "@/components/brand/SkyRssBrand";
import { AppButton, SearchInput } from "@/components/ui/glass";
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
  showDesktop?: boolean;
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
  showDesktop = true,
}: ReaderTopBarProps) {
  if (!showDesktop) return null;

  return (
    <header className="hidden shrink-0 items-center gap-4 border-b border-[color:var(--column-divider)] px-5 py-3 lg:flex">
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <SkyRssIcon className="h-9 w-9" aria-hidden />
        <SkyRssLogo className="hidden h-8 w-auto xl:block" aria-hidden />
        <span className="text-lg font-bold tracking-tight">
          <span className="text-[color:var(--text)]">Sky</span>
          <span className="text-[color:var(--accent)]">RSS</span>
        </span>
      </div>

      <div className="flex min-w-0 flex-1 justify-center px-4">
        <SearchInput
          className="max-w-xl"
          placeholder="搜索订阅或文章"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="搜索订阅或文章"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <AppButton
          type="button"
          variant="icon"
          title="全部标为已读"
          onClick={onMarkAllRead}
        >
          <CheckCircle2 className="h-4 w-4" />
        </AppButton>
        <AppButton
          type="button"
          variant="icon"
          title="刷新"
          disabled={refreshDisabled}
          onClick={onRefresh}
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshDisabled && "animate-spin")}
          />
        </AppButton>
        <AppButton
          type="button"
          variant="icon"
          title={isDark ? "浅色模式" : "深色模式"}
          onClick={onToggleTheme}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </AppButton>
        <div className="ml-1 flex items-center">{authSlot}</div>
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

