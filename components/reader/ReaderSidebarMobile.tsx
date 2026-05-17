"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  Clock,
  Layers,
  Moon,
  Plus,
  Settings,
  Sun,
} from "lucide-react";
import { NavRow } from "@/components/reader/sidebar/NavRow";
import { FeedSourceRow } from "@/components/reader/sidebar/FeedSourceRow";
import { AppButton } from "@/components/ui/glass";
import type { ReaderNav } from "@/components/reader/types";
import type { StoredFeed } from "@/lib/reader-library-storage";
import { cn } from "@/lib/cn";

type ReaderSidebarMobileProps = {
  open: boolean;
  onClose: () => void;
  nav: ReaderNav;
  onNav: (n: ReaderNav) => void;
  feeds: StoredFeed[];
  unreadTotal: number;
  unreadByFeedId: Record<string, number>;
  readLaterCount: number;
  favoritesCount: number;
  recentCount: number;
  onOpenAddFeed: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  cloudLoading?: boolean;
  cloudError?: string | null;
};

export function ReaderSidebarMobile({
  open,
  onClose,
  nav,
  onNav,
  feeds,
  unreadTotal,
  unreadByFeedId,
  readLaterCount,
  favoritesCount,
  recentCount,
  onOpenAddFeed,
  onOpenSettings,
  isDark,
  onToggleTheme,
  cloudLoading,
  cloudError,
}: ReaderSidebarMobileProps) {
  const [sourcesOpen, setSourcesOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[color:var(--drawer-backdrop)] lg:hidden"
          aria-label="关闭订阅抽屉"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="reader-sidebar-mobile"
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label="订阅"
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 flex w-[min(20rem,88vw)] flex-col overflow-hidden border-r border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] shadow-[var(--shadow-lg)] transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-4">
          <p className="text-xl font-bold text-[color:var(--text)]">订阅</p>
          <AppButton
            type="button"
            variant="icon"
            title="添加订阅"
            onClick={onOpenAddFeed}
          >
            <Plus className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2">
          {cloudLoading ? (
            <p className="px-3 py-1 text-xs text-[color:var(--muted)]">云端同步中…</p>
          ) : null}
          {cloudError ? (
            <p className="mx-2 mb-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-700 dark:text-rose-200">
              {cloudError}
            </p>
          ) : null}

          <NavRow
            label="全部文章"
            icon={Layers}
            count={unreadTotal}
            active={nav.kind === "all"}
            onClick={() => onNav({ kind: "all" })}
          />
          <NavRow
            label="稍后阅读"
            icon={Clock}
            count={readLaterCount}
            active={nav.kind === "read_later"}
            onClick={() => onNav({ kind: "read_later" })}
          />
          <NavRow
            label="收藏"
            icon={Bookmark}
            count={favoritesCount}
            active={nav.kind === "favorites"}
            onClick={() => onNav({ kind: "favorites" })}
          />
          <NavRow
            label="最近阅读"
            icon={Clock}
            count={recentCount}
            active={nav.kind === "recent"}
            onClick={() => onNav({ kind: "recent" })}
          />

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-[color:var(--text)]"
            onClick={() => setSourcesOpen((v) => !v)}
          >
            <span>订阅源</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[color:var(--muted)] transition-transform",
                sourcesOpen && "rotate-180",
              )}
            />
          </button>
          {sourcesOpen ? (
            <ul className="flex flex-col gap-0.5 pb-2">
              {feeds.map((f) => (
                <li key={f.id}>
                  <FeedSourceRow
                    title={f.title}
                    url={f.url}
                    unread={unreadByFeedId[f.id] ?? 0}
                    active={nav.kind === "source" && nav.sourceId === f.id}
                    onClick={() => onNav({ kind: "source", sourceId: f.id })}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-[color:var(--border-subtle)] px-4 py-3">
          <AppButton
            type="button"
            variant="ghost"
            className="h-10 w-10 p-0"
            title="设置"
            onClick={onOpenSettings}
          >
            <Settings className="h-5 w-5" />
          </AppButton>
          <AppButton
            type="button"
            variant="ghost"
            className="h-10 w-10 p-0"
            title={isDark ? "浅色模式" : "深色模式"}
            onClick={onToggleTheme}
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </AppButton>
        </div>
      </aside>
    </>
  );
}
