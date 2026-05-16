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
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-[color:var(--background)]",
        !isLargeScreen && mobileShowReader && "hidden",
      )}
    >
      {/* 栏目标题 */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)] px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {!isLargeScreen ? (
            <GlassButton
              type="button"
              className="h-9 w-9 shrink-0 rounded-full p-0 lg:hidden"
              title="菜单"
              onClick={onOpenMobileMenu}
            >
              ☰
            </GlassButton>
          ) : null}
          <div>
            <h2 className="text-lg font-bold gradient-text">
              {title}
            </h2>
            {updatedLabel && isLargeScreen ? (
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {updatedLabel}
              </p>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <GlassButton
            type="button"
            className="h-9 w-9 shrink-0 rounded-full p-0 transition-all duration-200 hover:scale-105 active:scale-95"
            title="全部标为已读"
            onClick={onMarkAllRead}
          >
            ✓
          </GlassButton>
          <GlassButton
            type="button"
            className={cn(
              "h-9 w-9 shrink-0 rounded-full p-0 transition-all duration-200 hover:scale-105 active:scale-95",
              loading && "animate-spin",
            )}
            title="刷新"
            onClick={onRefresh}
          >
            ↻
          </GlassButton>
        </div>
      </div>

      {/* 错误提示 */}
      {mergeErrors && mergeErrors.length > 0 ? (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
          <span className="mt-0.5 text-sm">⚠️</span>
          <div>
            <p className="font-medium">部分订阅源更新失败</p>
            <p className="mt-1 opacity-80">
              {mergeErrors.map((e) => e.title).join("、")}
            </p>
          </div>
        </div>
      ) : null}

      {/* 文章列表 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3">
        {rows.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="mb-4 text-5xl animate-float">📭</div>
            <p className="text-base font-medium text-[color:var(--text)]">
              暂无条目
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              这里还没有文章，去添加一些订阅源吧
            </p>
          </div>
        ) : loading ? (
          /* 加载骨架屏 */
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="skeleton-card animate-pulse">
                <div className="mb-2 h-5 w-3/4 rounded bg-[color:var(--secondary)]" />
                <div className="mb-3 h-4 w-full rounded bg-[color:var(--secondary)]" />
                <div className="h-4 w-1/2 rounded bg-[color:var(--secondary)]" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => {
              const key = listRowCompositeKey(row);
              const active = activeKey === key;
              const unread = isUnread(row);
              const style = {
                animationDelay: `${index * 30}ms`,
              };
              
              return (
                <li
                  key={key}
                  className="animate-fade-in"
                  style={style}
                >
                  <div
                    className={cn(
                      "article-card group relative cursor-pointer overflow-hidden",
                      active && "ring-2 ring-[color:var(--primary)] ring-offset-2",
                      unread && "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-[color:var(--primary)] before:to-[color:var(--accent)]",
                    )}
                    onClick={() => onSelectRow(row)}
                  >
                    {/* 标题区域 */}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className={cn(
                        "line-clamp-2 text-base font-semibold leading-snug transition-colors",
                        unread
                          ? "text-[color:var(--text)]"
                          : "text-[color:var(--muted)]",
                      )}>
                        {titleOf(row)}
                      </h3>
                    </div>
                    
                    {/* 摘要 */}
                    {snippetOf(row) ? (
                      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[color:var(--muted)]">
                        {snippetOf(row)}
                      </p>
                    ) : null}
                    
                    {/* 元信息 */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[color:var(--muted-foreground)]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate font-medium">
                          {sourceOf(row)}
                        </span>
                      </div>
                      <span className="shrink-0 whitespace-nowrap tabular-nums">
                        {timeLabel(row) ?? ""}
                      </span>
                    </div>
                    
                    {/* 操作按钮 - 悬停时显示 */}
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-[color:var(--card-border)] pt-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <GlassButton
                        type="button"
                        className={cn(
                          "h-8 rounded-lg px-3 text-sm transition-all duration-200 hover:scale-105",
                          isFavorite(row)
                            ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] text-white shadow-sm"
                            : "",
                        )}
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
                        className={cn(
                          "h-8 rounded-lg px-3 text-sm transition-all duration-200 hover:scale-105",
                          isReadLater(row)
                            ? "bg-[color:var(--primary)]/[0.1] text-[color:var(--primary)]"
                            : "",
                        )}
                        title="稍后阅读"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleReadLater(row);
                        }}
                      >
                        {isReadLater(row) ? "✓ 稍后" : "稍后"}
                      </GlassButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
