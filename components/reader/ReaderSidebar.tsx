"use client";

import type { StoredFeed, StoredFolder } from "@/lib/reader-library-storage";
import { GlassButton, GlassInput, GlassPanel } from "@/components/ui/glass";
import { cn } from "@/lib/cn";
import type { ReaderNav } from "@/components/reader/types";

type ReaderSidebarProps = {
  isLargeScreen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  nav: ReaderNav;
  onNav: (n: ReaderNav) => void;
  folders: StoredFolder[];
  feeds: StoredFeed[];
  unreadTotal: number;
  unreadByFeedId: Record<string, number>;
  readLaterCount: number;
  favoritesCount: number;
  recentCount: number;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
  onFeedFolderChange: (feedId: string, folderId: string | null) => void;
  onRemoveFeed: (id: string) => void;
  onOpenAddFeed: () => void;
  cloudLoading?: boolean;
  cloudError?: string | null;
};

function navButtonClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ease-out border-0",
    active
      ? "bg-[color:var(--glass-active)] font-medium text-[color:var(--text)] shadow-sm scale-[1.02]"
      : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)] hover:scale-[1.01]",
  );
}

export function ReaderSidebar({
  isLargeScreen,
  mobileOpen,
  onMobileClose,
  nav,
  onNav,
  folders,
  feeds,
  unreadTotal,
  unreadByFeedId,
  readLaterCount,
  favoritesCount,
  recentCount,
  newFolderName,
  setNewFolderName,
  onCreateFolder,
  onDeleteFolder,
  onFeedFolderChange,
  onRemoveFeed,
  onOpenAddFeed,
  cloudLoading,
  cloudError,
}: ReaderSidebarProps) {
  const allActive = nav.kind === "all";
  const rlActive = nav.kind === "read_later";
  const favActive = nav.kind === "favorites";
  const recActive = nav.kind === "recent";

  return (
    <>
      {/* 移动端遮罩层 */}
      {!isLargeScreen && mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[color:var(--drawer-backdrop)] backdrop-blur-sm transition-opacity"
          aria-label="关闭侧栏"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        id="reader-sidebar"
        className={cn(
          "flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4",
          isLargeScreen
            ? "relative w-full"
            : cn(
                "fixed bottom-0 left-0 top-0 z-40 w-[min(22rem,90vw)] max-w-full flex-col overflow-y-auto border-r border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)] p-5 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
              ),
        )}
      >
        {/* Logo 区域 - 仅移动端显示 */}
        {!isLargeScreen && (
          <div className="mb-4 flex items-center gap-2 pb-4 border-b border-[color:var(--glass-border)]">
            <span className="text-2xl" aria-hidden>☁️</span>
            <span className="text-xl font-bold gradient-text">SkyRSS</span>
          </div>
        )}

        {/* 添加订阅按钮区域 */}
        <button
          type="button"
          onClick={onOpenAddFeed}
          className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] p-4 text-white shadow-lg shadow-[color:var(--primary-glow)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        >
          <div className="relative z-10">
            <p className="text-base font-bold">添加订阅</p>
            {cloudLoading ? (
              <p className="mt-0.5 text-xs opacity-90">云端同步中…</p>
            ) : (
              <p className="mt-0.5 text-xs opacity-90">输入 RSS 源 URL</p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl transition-all duration-300 group-hover:rotate-90 group-hover:scale-110">
            +
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:animate-shimmer" />
        </button>

        {/* 错误提示 */}
        {cloudError ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-medium">同步失败</p>
                <p className="mt-1 text-xs opacity-80">{cloudError}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* 导航菜单 */}
        <div className="rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-3 backdrop-blur-xl">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]">
            快捷导航
          </div>
          <nav className="flex flex-col gap-1">
            {/* 全部文章 */}
            <button
              type="button"
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200",
                allActive
                  ? "bg-gradient-to-r from-[color:var(--primary)]/[0.15] to-[color:var(--primary)]/[0.05] text-[color:var(--primary)] shadow-sm"
                  : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
              )}
              onClick={() => onNav({ kind: "all" })}
            >
              <span className="text-xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
                📄
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">全部文章</span>
              <span className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums transition-all duration-200",
                unreadTotal > 0
                  ? "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--primary)] text-white shadow-sm"
                  : "bg-[color:var(--secondary)] text-[color:var(--muted)]",
              )}>
                {unreadTotal}
              </span>
            </button>

            {/* 稍后阅读 */}
            <button
              type="button"
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200",
                rlActive
                  ? "bg-gradient-to-r from-[color:var(--primary)]/[0.15] to-[color:var(--primary)]/[0.05] text-[color:var(--primary)] shadow-sm"
                  : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
              )}
              onClick={() => onNav({ kind: "read_later" })}
            >
              <span className="text-xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
                📋
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">稍后阅读</span>
              <span className="shrink-0 rounded-full bg-[color:var(--secondary)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--muted)]">
                {readLaterCount}
              </span>
            </button>

            {/* 收藏 */}
            <button
              type="button"
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200",
                favActive
                  ? "bg-gradient-to-r from-[color:var(--primary)]/[0.15] to-[color:var(--primary)]/[0.05] text-[color:var(--primary)] shadow-sm"
                  : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
              )}
              onClick={() => onNav({ kind: "favorites" })}
            >
              <span className="text-xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
                ⭐
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">收藏</span>
              <span className="shrink-0 rounded-full bg-[color:var(--secondary)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--muted)]">
                {favoritesCount}
              </span>
            </button>

            {/* 最近阅读 */}
            <button
              type="button"
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200",
                recActive
                  ? "bg-gradient-to-r from-[color:var(--primary)]/[0.15] to-[color:var(--primary)]/[0.05] text-[color:var(--primary)] shadow-sm"
                  : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
              )}
              onClick={() => onNav({ kind: "recent" })}
            >
              <span className="text-xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
                🕐
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">最近阅读</span>
              <span className="shrink-0 rounded-full bg-[color:var(--secondary)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--muted)]">
                {recentCount}
              </span>
            </button>
          </nav>
        </div>

        {/* 分类管理 */}
        {folders.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between px-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]">
                分类
              </span>
            </div>
            
            {/* 添加分类输入框 */}
            <div className="flex gap-2 px-3">
              <GlassInput
                className="min-w-0 flex-1 text-sm"
                placeholder="新分类名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateFolder();
                }}
              />
              <GlassButton
                type="button"
                className="shrink-0 px-4"
                onClick={onCreateFolder}
              >
                添加
              </GlassButton>
            </div>

            {/* 分类列表 */}
            <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto px-3">
              {folders.map((f) => {
                const active = nav.kind === "folder" && nav.folderId === f.id;
                return (
                  <li
                    key={f.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl p-1 transition-all duration-200",
                      active ? "bg-[color:var(--primary)]/[0.08]" : "hover:bg-[color:var(--hover-row)]",
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
                        active
                          ? "text-[color:var(--primary)]"
                          : "text-[color:var(--text)]",
                      )}
                      onClick={() => onNav({ kind: "folder", folderId: f.id })}
                    >
                      <span aria-hidden>📁</span>
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    </button>
                    <GlassButton
                      type="button"
                      className="h-8 w-8 shrink-0 rounded-lg p-0 text-sm text-rose-500 hover:bg-rose-500/10"
                      title="删除分类"
                      onClick={() => onDeleteFolder(f.id)}
                    >
                      ×
                    </GlassButton>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 订阅源列表 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[color:var(--glass-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[color:var(--text)]">
              订阅源
            </span>
            <span className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
              {feeds.length}
            </span>
          </div>
          
          <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {feeds.length === 0 ? (
              <li className="px-2 py-10 text-center">
                <p className="text-4xl mb-3">📡</p>
                <p className="text-sm text-[color:var(--muted)]">
                  暂无订阅源
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                  点击上方按钮添加第一个订阅
                </p>
              </li>
            ) : (
              feeds.map((f) => {
                const active = nav.kind === "source" && nav.sourceId === f.id;
                const n = unreadByFeedId[f.id] ?? 0;
                return (
                  <li key={f.id} className="group">
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-[color:var(--primary)]/[0.15] to-[color:var(--primary)]/[0.05] text-[color:var(--primary)] shadow-sm"
                          : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
                      )}
                      onClick={() => onNav({ kind: "source", sourceId: f.id })}
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        {f.title}
                      </span>
                      {n > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] px-1.5 text-xs font-bold text-white shadow-sm">
                          {n}
                        </span>
                      )}
                    </button>
                    
                    {/* 分类选择和删除按钮 */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 px-1 pb-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <select
                        className="glass-input min-w-0 flex-1 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--secondary)] px-3 py-1.5 text-xs text-[color:var(--text)] transition-all duration-200 focus:border-[color:var(--primary)] focus:outline-none"
                        value={f.folderId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          onFeedFolderChange(f.id, v === "" ? null : v);
                        }}
                      >
                        <option value="">未分类</option>
                        {folders.map((fo) => (
                          <option key={fo.id} value={fo.id}>
                            {fo.name}
                          </option>
                        ))}
                      </select>
                      <GlassButton
                        type="button"
                        className="h-8 shrink-0 rounded-lg px-3 text-xs text-rose-500 hover:bg-rose-500/10"
                        title="删除订阅"
                        onClick={() => onRemoveFeed(f.id)}
                      >
                        删除
                      </GlassButton>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}
