"use client";

import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { cn } from "@/lib/cn";
import { formatRelativeTimeZh } from "@/lib/format-relative-time";
import type { StoredReaderItem } from "@/lib/reader-library-storage";
import type { RssItemView } from "@/types/rss";

export type ListRow =
  | { kind: "rss"; item: RssItemView }
  | { kind: "snapshot"; row: StoredReaderItem };

export function listRowCompositeKey(r: ListRow): string {
  return r.kind === "rss"
    ? `${r.item.subscriptionId}\0${r.item.itemKey}`
    : `${r.row.subscriptionId}\0${r.row.itemKey}`;
}

function titleOf(r: ListRow): string {
  return r.kind === "rss" ? r.item.title : r.row.title;
}

function sourceOf(r: ListRow): string {
  return r.kind === "rss" ? r.item.feedTitle : r.row.feedTitle;
}

function snippetOf(r: ListRow): string | undefined {
  return r.kind === "rss" ? r.item.contentSnippet : (r.row.snippet ?? undefined);
}

function timeLabel(r: ListRow): string | null {
  if (r.kind === "rss") {
    const raw = r.item.isoDate || r.item.pubDate;
    return raw ? formatRelativeTimeZh(raw) : null;
  }
  const lo = r.row.lastOpenedAt;
  if (lo) return formatRelativeTimeZh(new Date(lo).toISOString());
  const u = r.row.updatedAt;
  return formatRelativeTimeZh(new Date(u).toISOString());
}

type ArticleListColumnProps = {
  title: string;
  rows: ListRow[];
  activeKey: string | null;
  onSelectRow: (row: ListRow) => void;
  isUnread: (row: ListRow) => boolean;
  onToggleFavorite: (row: ListRow) => void;
  onToggleReadLater: (row: ListRow) => void;
  isFavorite: (row: ListRow) => boolean;
  isReadLater: (row: ListRow) => boolean;
  mergeErrors?: { title: string; message: string }[];
  loading?: boolean;
  onMarkAllRead: () => void;
  isLargeScreen: boolean;
  mobileShowReader: boolean;
  onOpenMobileMenu: () => void;
  onRefresh?: () => void;
  updatedLabel?: string;
};

export function ArticleListColumn({
  title,
  rows,
  activeKey,
  onSelectRow,
  isUnread,
  onToggleFavorite,
  onToggleReadLater,
  isFavorite,
  isReadLater,
  mergeErrors,
  loading,
  onMarkAllRead,
  isLargeScreen,
  mobileShowReader,
  onOpenMobileMenu,
  onRefresh,
  updatedLabel,
}: ArticleListColumnProps) {
  return (
    <GlassPanel
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden p-0",
        !isLargeScreen && mobileShowReader && "hidden",
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[color:var(--glass-border)] px-3 py-3 md:px-4">
        {!isLargeScreen ? (
          <GlassButton
            type="button"
            className="h-9 w-9 shrink-0 rounded-full p-0"
            title="菜单"
            onClick={onOpenMobileMenu}
          >
            ☰
          </GlassButton>
        ) : null}
        <h2 className="min-w-0 flex-1 truncate text-center text-base font-semibold text-[color:var(--text)] md:text-left">
          {title}
        </h2>
        <GlassButton
          type="button"
          className="h-9 w-9 shrink-0 rounded-full p-0"
          title="全部标为已读"
          onClick={onMarkAllRead}
        >
          ✓
        </GlassButton>
        {loading ? (
          <span className="text-xs text-[color:var(--muted)]">加载中…</span>
        ) : null}
      </div>

      {mergeErrors && mergeErrors.length > 0 ? (
        <div className="mx-3 mt-2 rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100 md:mx-4">
          部分订阅未更新：{mergeErrors.map((e) => e.title).join("、")}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-3 pt-1 md:px-3">
        {rows.length === 0 && !loading ? (
          <p className="px-3 py-10 text-center text-sm text-[color:var(--muted)]">
            暂无条目
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => {
              const key = listRowCompositeKey(row);
              const active = activeKey === key;
              const unread = isUnread(row);
              return (
                <li key={key}>
                  <div
                    className={cn(
                      "rounded-2xl border border-transparent px-3 py-3 transition-colors",
                      active
                        ? "border-sky-300/50 bg-[color:var(--glass-active)]"
                        : "bg-[color:var(--glass-bg-strong)] hover:bg-[color:var(--hover-row)]",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => onSelectRow(row)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-[color:var(--text)]">
                          {titleOf(row)}
                        </p>
                        {unread ? (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500"
                            title="未读"
                          />
                        ) : null}
                      </div>
                      {snippetOf(row) ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[color:var(--muted)]">
                          {snippetOf(row)}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--muted)]">
                        <span className="truncate">{sourceOf(row)}</span>
                        <span className="shrink-0 tabular-nums">
                          {timeLabel(row) ?? ""}
                        </span>
                      </div>
                    </button>
                    <div className="mt-2 flex justify-end gap-1 border-t border-[color:var(--glass-border)]/60 pt-2">
                      <GlassButton
                        type="button"
                        className="h-8 rounded-lg px-2 text-xs"
                        title="收藏"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(row);
                        }}
                      >
                        {isFavorite(row) ? "★" : "☆"}
                      </GlassButton>
                      <GlassButton
                        type="button"
                        className="h-8 rounded-lg px-2 text-xs"
                        title="稍后阅读"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleReadLater(row);
                        }}
                      >
                        {isReadLater(row) ? "稍后✓" : "稍后"}
                      </GlassButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!isLargeScreen ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[color:var(--glass-border)] px-3 py-2 text-xs text-[color:var(--muted)]">
          <GlassButton
            type="button"
            className="h-8 w-8 shrink-0 rounded-full p-0"
            title="刷新"
            onClick={onRefresh}
          >
            ↻
          </GlassButton>
          <span className="min-w-0 flex-1 truncate text-center">
            {updatedLabel ?? ""}
          </span>
          <span className="w-8" />
        </div>
      ) : null}
    </GlassPanel>
  );
}
