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
        "flex shrink-0 items-center gap-4 border-b border-[color:var(--glass-border)] bg-[color:var(--topbar-bg)] px-4 py-3 backdrop-blur-xl transition-all duration-300 md:px-6",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <span className="text-2xl animate-float" aria-hidden>
          ☁️
        </span>
        <span className="text-xl font-bold gradient-text">
          SkyRSS
        </span>
      </div>

      {/* 搜索栏 - 自适应宽度 */}
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="relative w-full max-w-2xl">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <GlassInput
            type="search"
            className="rounded-full border-[color:var(--glass-border)] py-2.5 pl-10 pr-4 transition-all duration-200 hover:border-[color:var(--primary)] focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary-glow)]"
            placeholder="搜索文章或订阅源..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="搜索订阅或文章"
          />
        </div>
      </div>

      {/* 操作按钮组 */}
      <div className="flex shrink-0 items-center gap-2">
        <GlassButton
          type="button"
          className="group relative h-10 w-10 shrink-0 rounded-full p-0 transition-all duration-200 hover:scale-105 active:scale-95"
          title="全部标为已读"
          onClick={onMarkAllRead}
        >
          <span className="text-lg group-hover:scale-110 transition-transform">✓</span>
        </GlassButton>
        
        <GlassButton
          type="button"
          className={cn(
            "group relative h-10 w-10 shrink-0 rounded-full p-0 transition-all duration-200 hover:scale-105 active:scale-95",
            refreshDisabled && "opacity-50",
          )}
          title="刷新"
          disabled={refreshDisabled}
          onClick={onRefresh}
        >
          <span className={cn("text-lg", refreshDisabled && "animate-spin")}>
            ↻
          </span>
        </GlassButton>
        
        <GlassButton
          type="button"
          className="group relative h-10 w-10 shrink-0 rounded-full p-0 transition-all duration-200 hover:scale-105 active:scale-95"
          title={isDark ? "浅色模式" : "深色模式"}
          onClick={onToggleTheme}
        >
          <span className="text-lg transition-transform duration-300 group-hover:rotate-12" key={String(isDark)}>
            {isDark ? "☀️" : "🌙"}
          </span>
        </GlassButton>
        
        {/* 用户头像 */}
        <div className="ml-1 flex items-center pl-1">{authSlot}</div>
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
