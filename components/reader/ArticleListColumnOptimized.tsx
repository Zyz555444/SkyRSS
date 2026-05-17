"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { ArticleListSkeleton, LoadingSpinner } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatRelativeTimeZh } from "@/lib/format-relative-time";
import { useVirtualScroll } from "@/hooks/usePerformance";
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

type ArticleListItemProps = {
  row: ListRow;
  active: boolean;
  unread: boolean;
  favorite: boolean;
  readLater: boolean;
  index: number;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onToggleReadLater: () => void;
};

const ArticleListItem = Object.assign(
  ({
    row,
    active,
    unread,
    favorite,
    readLater,
    index,
    onSelect,
    onToggleFavorite,
    onToggleReadLater,
  }: ArticleListItemProps) => {
    const itemRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
      if (itemRef.current && active) {
        itemRef.current.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }, [active]);

    return (
      <li
        ref={itemRef}
        className="animate-list-item"
        style={{
          animationDelay: `${Math.min(index * 50, 500)}ms`,
          contain: "layout",
        }}
      >
        <div
          className={cn(
            "rounded-2xl border border-transparent px-3 py-3 transition-all duration-200 ease-out",
            active
              ? "border-sky-300/50 bg-[color:var(--glass-active)] shadow-md"
              : "bg-[color:var(--glass-bg-strong)] hover:bg-[color:var(--hover-row)] hover:shadow-sm",
          )}
        >
          <button
            type="button"
            className="w-full text-left"
            onClick={onSelect}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug text-[color:var(--text)]">
                {titleOf(row)}
              </p>
              {unread ? (
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500 animate-pulse-slow"
                  title="未读"
                />
              ) : null}
            </div>
            {snippetOf(row) ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[color:var(--muted)] transition-opacity duration-200">
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
              className="h-8 rounded-lg px-2 text-xs transition-transform duration-150 active:scale-95"
              title="收藏"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              {favorite ? "★" : "☆"}
            </GlassButton>
            <GlassButton
              type="button"
              className="h-8 rounded-lg px-2 text-xs transition-transform duration-150 active:scale-95"
              title="稍后阅读"
              onClick={(e) => {
                e.stopPropagation();
                onToggleReadLater();
              }}
            >
              {readLater ? "稍后✓" : "稍后"}
            </GlassButton>
          </div>
        </div>
      </li>
    );
  },
  { displayName: "ArticleListItem" },
);

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
  const listRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const ITEM_HEIGHT = 88;

  const { visibleItems, totalHeight, offsetTop } = useVirtualScroll<ListRow>(
    rows,
    ITEM_HEIGHT,
    listRef as React.RefObject<HTMLElement>,
    3,
  );

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      setShowTop(listRef.current.scrollTop > 300);
    }
  }, []);

  const scrollToItem = useCallback((key: string) => {
    if (!listRef.current) return;
    const container = listRef.current;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowKey = listRowCompositeKey(row);
      if (rowKey === key) {
        const itemTop = i * ITEM_HEIGHT;
        const itemBottom = itemTop + ITEM_HEIGHT;
        
        if (itemTop < scrollTop || itemBottom > scrollTop + viewportHeight) {
          container.scrollTo({
            top: itemTop - viewportHeight / 2,
            behavior: "smooth",
          });
        }
        break;
      }
    }
  }, [rows]);

  useEffect(() => {
    if (activeKey) {
      scrollToItem(activeKey);
    }
  }, [activeKey, scrollToItem]);

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
            className="h-9 w-9 shrink-0 rounded-full p-0 transition-transform duration-200 hover:scale-110 active:scale-95"
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
          className="h-9 w-9 shrink-0 rounded-full p-0 transition-transform duration-200 hover:scale-110 active:scale-95"
          title="全部标为已读"
          onClick={onMarkAllRead}
        >
          ✓
        </GlassButton>
        {loading ? (
          <span className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
            <LoadingSpinner size="sm" />
            加载中…
          </span>
        ) : null}
      </div>

      {mergeErrors && mergeErrors.length > 0 ? (
        <div className="mx-3 mt-2 animate-fade-in rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          部分订阅未更新：{mergeErrors.map((e) => e.title).join("、")}
        </div>
      ) : null}

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-3 pt-1 md:px-3"
        onScroll={handleScroll}
      >
        {rows.length === 0 && !loading ? (
          <p className="animate-fade-in px-3 py-10 text-center text-sm text-[color:var(--muted)]">
            暂无条目
          </p>
        ) : loading ? (
          <ArticleListSkeleton count={8} />
        ) : visibleItems.length === 0 ? (
          <p className="animate-fade-in px-3 py-10 text-center text-sm text-[color:var(--muted)]">
            暂无条目
          </p>
        ) : (
          <div style={{ height: totalHeight, position: "relative" }}>
            <ul
              className="flex flex-col gap-2"
              style={{
                position: "absolute",
                top: offsetTop,
                left: 0,
                right: 0,
              }}
            >
              {visibleItems.map((row) => {
                const key = listRowCompositeKey(row);
                const active = activeKey === key;
                const unread = isUnread(row);
                const favorite = isFavorite(row);
                const readLater = isReadLater(row);
                const index = rows.indexOf(row);

                return (
                  <ArticleListItem
                    key={key}
                    row={row}
                    active={active}
                    unread={unread}
                    favorite={favorite}
                    readLater={readLater}
                    index={index}
                    onSelect={() => onSelectRow(row)}
                    onToggleFavorite={() => onToggleFavorite(row)}
                    onToggleReadLater={() => onToggleReadLater(row)}
                  />
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {showTop && !loading && (
        <button
          type="button"
          className="absolute bottom-20 right-6 z-20 animate-fade-in rounded-full bg-sky-500 p-3 text-white shadow-lg transition-transform duration-200 hover:scale-110 hover:bg-sky-600 active:scale-95"
          onClick={() => {
            if (listRef.current) {
              listRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          title="回到顶部"
        >
          ↑
        </button>
      )}

      {!isLargeScreen ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[color:var(--glass-border)] px-3 py-2 text-xs text-[color:var(--muted)]">
          <GlassButton
            type="button"
            className="h-8 w-8 shrink-0 rounded-full p-0 transition-transform duration-200 hover:scale-110 active:scale-95"
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
