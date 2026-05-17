"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  List,
  Menu,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { NavViewMenu } from "@/components/reader/NavViewMenu";
import { AppButton, SearchInput, Surface } from "@/components/ui/glass";
import { ArticleListSkeleton, LoadingSpinner } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatRelativeTimeZh } from "@/lib/format-relative-time";
import {
  getListSortMode,
  setListSortMode,
  type ListSortMode,
} from "@/lib/list-sort";
import { useVirtualScroll } from "@/hooks/usePerformance";
import type { StoredFeed, StoredFolder, StoredReaderItem } from "@/lib/reader-library-storage";
import type { ReaderNav } from "@/components/reader/types";
import type { RssItemView } from "@/types/rss";
import { memo } from "react";

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
  return formatRelativeTimeZh(new Date(r.row.updatedAt).toISOString());
}

function rowTimeMs(r: ListRow): number {
  if (r.kind === "rss") {
    const raw = r.item.isoDate || r.item.pubDate;
    const t = raw ? new Date(raw).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
  }
  return r.row.lastOpenedAt ?? r.row.updatedAt ?? 0;
}

const ITEM_HEIGHT = 100;

type ArticleListItemProps = {
  row: ListRow;
  active: boolean;
  unread: boolean;
  favorite: boolean;
  isLargeScreen: boolean;
  index: number;
  onSelect: () => void;
  onToggleFavorite: () => void;
};

const ArticleListItem = memo(({
    row,
    active,
    unread,
    favorite,
    isLargeScreen,
    index,
    onSelect,
    onToggleFavorite,
  }: ArticleListItemProps) => {
    const itemRef = useRef<HTMLLIElement>(null);
    const time = timeLabel(row);
    const meta =
      time != null ? `${sourceOf(row)} · ${time}` : sourceOf(row);

    useEffect(() => {
      if (!active || !itemRef.current) return;
      const scrollOpts = { block: "nearest" as const, behavior: "smooth" as const };
      itemRef.current.scrollIntoView(scrollOpts);
    }, [active]);

    return (
      <li
        ref={itemRef}
        className="animate-list-item px-1"
        style={{
          animationDelay: `${Math.min(index * 40, 400)}ms`,
          contain: "layout",
        }}
      >
        <article
          className={cn(
            "relative rounded-2xl px-3 py-3 transition-colors",
            active
              ? "bg-[color:var(--accent-muted)]"
              : "bg-transparent hover:bg-[color:var(--hover-row)]",
          )}
        >
          {active && isLargeScreen ? (
            <span
              className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[color:var(--accent)]"
              aria-hidden
            />
          ) : null}

          {!isLargeScreen ? (
            <span
              className={cn(
                "absolute right-3 top-3 h-2 w-2 rounded-full",
                unread ? "bg-[color:var(--accent)]" : "bg-[color:var(--border-subtle)]",
              )}
              title={unread ? "未读" : "已读"}
            />
          ) : null}

          <button type="button" className="w-full text-left" onClick={onSelect}>
            <p
              className={cn(
                "pr-6 text-sm leading-snug text-[color:var(--text)]",
                active ? "font-semibold" : "font-medium",
                isLargeScreen && active && "pl-3",
              )}
            >
              {titleOf(row)}
            </p>
            {snippetOf(row) ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[color:var(--muted)]">
                {snippetOf(row)}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[color:var(--muted)]">{meta}</p>
          </button>

          {active && isLargeScreen ? (
            <span
              className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[color:var(--accent)]"
              aria-hidden
            />
          ) : null}

          {!active ? (
            <button
              type="button"
              className="absolute bottom-2.5 right-2.5 rounded-md p-1 text-[color:var(--muted)] hover:bg-[color:var(--hover-row)]"
              title={favorite ? "取消收藏" : "收藏"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  favorite && "fill-amber-400 text-amber-400",
                )}
              />
            </button>
          ) : null}
        </article>
      </li>
    );
  },
);

ArticleListItem.displayName = "ArticleListItem";

type ArticleListColumnProps = {
  title: string;
  nav: ReaderNav;
  folders: StoredFolder[];
  feeds: StoredFeed[];
  onNav: (n: ReaderNav) => void;
  rows: ListRow[];
  activeKey: string | null;
  onSelectRow: (row: ListRow) => void;
  isUnread: (row: ListRow) => boolean;
  onToggleFavorite: (row: ListRow) => void;
  isFavorite: (row: ListRow) => boolean;
  mergeErrors?: { title: string; message: string }[];
  loading?: boolean;
  onMarkAllRead: () => void;
  isLargeScreen: boolean;
  mobileShowReader: boolean;
  onOpenMobileMenu: () => void;
  onRefresh?: () => void;
  updatedLabel?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export function ArticleListColumn({
  title,
  nav,
  folders,
  feeds,
  onNav,
  rows,
  activeKey,
  onSelectRow,
  isUnread,
  onToggleFavorite,
  isFavorite,
  mergeErrors,
  loading,
  onMarkAllRead,
  isLargeScreen,
  mobileShowReader,
  onOpenMobileMenu,
  onRefresh,
  updatedLabel,
  searchQuery,
  onSearchChange,
}: ArticleListColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [sortMode, setSortMode] = useState<ListSortMode>(() => getListSortMode());

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    const isUnreadCache = new WeakMap<ListRow, boolean>();
    if (sortMode === "unread") {
      copy.sort((a, b) => {
        let ua = isUnreadCache.get(a) ? 1 : 0;
        let ub = isUnreadCache.get(b) ? 1 : 0;
        if (!isUnreadCache.has(a)) {
          ua = isUnread(a) ? 1 : 0;
          isUnreadCache.set(a, ua === 1);
        }
        if (!isUnreadCache.has(b)) {
          ub = isUnread(b) ? 1 : 0;
          isUnreadCache.set(b, ub === 1);
        }
        if (ub !== ua) return ub - ua;
        return rowTimeMs(b) - rowTimeMs(a);
      });
    } else {
      copy.sort((a, b) => rowTimeMs(b) - rowTimeMs(a));
    }
    return copy;
  }, [rows, sortMode, isUnread]);

  const { visibleItems, totalHeight, offsetTop } = useVirtualScroll<ListRow>(
    sortedRows,
    ITEM_HEIGHT,
    listRef as React.RefObject<HTMLElement>,
    3,
  );

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      setShowTop(listRef.current.scrollTop > 300);
    }
  }, []);

  const scrollToItem = useCallback(
    (key: string) => {
      if (!listRef.current) return;
      const container = listRef.current;
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;
      for (let i = 0; i < sortedRows.length; i++) {
        const row = sortedRows[i];
        if (listRowCompositeKey(row) === key) {
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
    },
    [sortedRows],
  );

  useEffect(() => {
    if (activeKey) scrollToItem(activeKey);
  }, [activeKey, scrollToItem]);

  const cycleSort = () => {
    const next: ListSortMode = sortMode === "time" ? "unread" : "time";
    setSortMode(next);
    setListSortMode(next);
  };

  return (
    <Surface
      className={cn(
        "reader-column-panel relative flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden p-0 shadow-none",
        !isLargeScreen && mobileShowReader && "hidden",
      )}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-[color:var(--column-divider)] px-3 py-3">
        <div className="flex items-center gap-2">
          {!isLargeScreen ? (
            <AppButton
              type="button"
              variant="icon"
              title="菜单"
              onClick={onOpenMobileMenu}
            >
              <Menu className="h-4 w-4" />
            </AppButton>
          ) : null}

          <div
            className={cn(
              "min-w-0 flex-1",
              !isLargeScreen && "flex justify-center",
            )}
          >
            <NavViewMenu
              title={title}
              nav={nav}
              folders={folders}
              feeds={feeds}
              onNav={onNav}
              align={isLargeScreen ? "left" : "center"}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!isLargeScreen ? (
              <AppButton
                type="button"
                variant="icon"
                title="搜索"
                onClick={() => setMobileSearchOpen((v) => !v)}
              >
                <Search className="h-4 w-4" />
              </AppButton>
            ) : null}
            <AppButton
              type="button"
              variant="icon"
              title="全部标为已读"
              onClick={onMarkAllRead}
            >
              <CheckCircle2 className="h-4 w-4" />
            </AppButton>
            {isLargeScreen ? (
              <AppButton type="button" variant="icon" title="列表视图">
                <List className="h-4 w-4" />
              </AppButton>
            ) : null}
            {loading ? <LoadingSpinner size="sm" /> : null}
          </div>
        </div>

        {!isLargeScreen && mobileSearchOpen ? (
          <SearchInput
            placeholder="搜索文章"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="搜索文章"
          />
        ) : null}
      </div>

      {mergeErrors && mergeErrors.length > 0 ? (
        <div className="mx-3 mt-2 rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          部分订阅未更新：{mergeErrors.map((e) => e.title).join("、")}
        </div>
      ) : null}

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-2 pt-1"
        onScroll={handleScroll}
      >
        {sortedRows.length === 0 && !loading ? (
          <p className="px-3 py-10 text-center text-sm text-[color:var(--muted)]">
            暂无条目
          </p>
        ) : loading ? (
          <ArticleListSkeleton count={8} />
        ) : (
          <div style={{ height: totalHeight, position: "relative" }}>
            <ul
              className="flex flex-col"
              style={{
                position: "absolute",
                top: offsetTop,
                left: 0,
                right: 0,
              }}
            >
              {visibleItems.map((row) => {
                const key = listRowCompositeKey(row);
                return (
                  <ArticleListItem
                    key={key}
                    row={row}
                    active={activeKey === key}
                    unread={isUnread(row)}
                    favorite={isFavorite(row)}
                    isLargeScreen={isLargeScreen}
                    index={sortedRows.indexOf(row)}
                    onSelect={() => onSelectRow(row)}
                    onToggleFavorite={() => onToggleFavorite(row)}
                  />
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {showTop && !loading ? (
        <button
          type="button"
          className="absolute bottom-20 right-4 z-20 rounded-full bg-[color:var(--accent)] p-2.5 text-white shadow-lg"
          onClick={() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          title="回到顶部"
        >
          ↑
        </button>
      ) : null}

      {!isLargeScreen ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[color:var(--column-divider)] px-3 py-2.5 text-xs text-[color:var(--muted)]">
          <AppButton
            type="button"
            variant="icon"
            className="h-9 w-9"
            title="刷新"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </AppButton>
          <span className="min-w-0 flex-1 truncate text-center">
            {updatedLabel ?? ""}
          </span>
          <AppButton
            type="button"
            variant="icon"
            className="h-9 w-9"
            title={sortMode === "time" ? "按未读排序" : "按时间排序"}
            onClick={cycleSort}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </AppButton>
        </div>
      ) : null}
    </Surface>
  );
}
