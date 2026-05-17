"use client";

import { useState } from "react";
import { ChevronRight, Layers, Plus, Settings } from "lucide-react";
import { NavRow } from "@/components/reader/sidebar/NavRow";
import { FeedSourceRow } from "@/components/reader/sidebar/FeedSourceRow";
import { getCategoryIcon } from "@/components/reader/sidebar/category-icons";
import { AppButton } from "@/components/ui/glass";
import type { ReaderNav } from "@/components/reader/types";
import type { StoredFeed, StoredFolder } from "@/lib/reader-library-storage";
import { cn } from "@/lib/cn";

const FEED_PREVIEW = 6;

type ReaderSidebarDesktopProps = {
  nav: ReaderNav;
  onNav: (n: ReaderNav) => void;
  folders: StoredFolder[];
  feeds: StoredFeed[];
  unreadTotal: number;
  unreadByFolderId: Record<string, number>;
  unreadByFeedId: Record<string, number>;
  readLaterCount: number;
  favoritesCount: number;
  recentCount: number;
  onOpenAddFeed: () => void;
  onOpenSettings: () => void;
  cloudLoading?: boolean;
  cloudError?: string | null;
};

export function ReaderSidebarDesktop({
  nav,
  onNav,
  folders,
  feeds,
  unreadTotal,
  unreadByFolderId,
  unreadByFeedId,
  readLaterCount,
  favoritesCount,
  recentCount,
  onOpenAddFeed,
  onOpenSettings,
  cloudLoading,
  cloudError,
}: ReaderSidebarDesktopProps) {
  const [feedsExpanded, setFeedsExpanded] = useState(false);
  const visibleFeeds = feedsExpanded ? feeds : feeds.slice(0, FEED_PREVIEW);

  return (
    <nav
      aria-label="订阅导航"
      className="reader-column-panel flex min-h-0 min-w-0 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--column-divider)] px-4 py-3">
        <p className="text-sm font-semibold text-[color:var(--text)]">订阅</p>
        <AppButton
          type="button"
          variant="icon"
          title="添加订阅"
          onClick={onOpenAddFeed}
        >
          <Plus className="h-4 w-4" />
        </AppButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {cloudLoading ? (
          <p className="px-2 py-1 text-xs text-[color:var(--muted)]">云端同步中…</p>
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
        {folders.map((f, i) => (
          <NavRow
            key={f.id}
            label={f.name}
            icon={getCategoryIcon(f.name, i)}
            count={unreadByFolderId[f.id] ?? 0}
            active={nav.kind === "folder" && nav.folderId === f.id}
            onClick={() => onNav({ kind: "folder", folderId: f.id })}
          />
        ))}

        <div className="my-2 border-t border-[color:var(--column-divider)]" />

        <div className="flex flex-col gap-0.5 px-1">
          <NavRow
            label="稍后阅读"
            compact
            count={readLaterCount}
            active={nav.kind === "read_later"}
            onClick={() => onNav({ kind: "read_later" })}
          />
          <NavRow
            label="收藏"
            compact
            count={favoritesCount}
            active={nav.kind === "favorites"}
            onClick={() => onNav({ kind: "favorites" })}
          />
          <NavRow
            label="最近阅读"
            compact
            count={recentCount}
            active={nav.kind === "recent"}
            onClick={() => onNav({ kind: "recent" })}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 px-2">
          <p className="text-xs font-medium text-[color:var(--muted)]">订阅源</p>
          <AppButton
            type="button"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="订阅源设置"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </AppButton>
        </div>

        <ul className="mt-1 flex flex-col gap-0.5">
          {visibleFeeds.map((f) => (
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
        {feeds.length > FEED_PREVIEW ? (
          <button
            type="button"
            className={cn(
              "mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-[color:var(--muted)]",
              "hover:bg-[color:var(--hover-row)]",
            )}
            onClick={() => setFeedsExpanded((v) => !v)}
          >
            <span>{feedsExpanded ? "收起" : "更多订阅源"}</span>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                feedsExpanded && "rotate-90",
              )}
            />
          </button>
        ) : null}
      </div>
    </nav>
  );
}
