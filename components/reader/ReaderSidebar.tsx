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
    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
    active
      ? "bg-[color:var(--glass-active)] font-medium text-[color:var(--text)]"
      : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
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
      {!isLargeScreen && mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[color:var(--drawer-backdrop)] backdrop-blur-[2px]"
          aria-label="关闭侧栏"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        id="reader-sidebar"
        className={cn(
          "flex min-h-0 shrink-0 flex-col gap-3 overflow-hidden",
          isLargeScreen
            ? "relative w-full lg:w-72"
            : cn(
                "fixed bottom-0 left-0 top-0 z-40 flex w-[min(20rem,88vw)] max-w-full flex-col gap-3 overflow-y-auto border-r border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)] p-3 shadow-2xl transition-transform duration-200 ease-out",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
              ),
        )}
      >
        <GlassPanel className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-[color:var(--text)]">
              订阅
            </p>
            <GlassButton
              type="button"
              className="h-9 w-9 shrink-0 rounded-full p-0 text-lg font-light"
              title="添加订阅"
              onClick={onOpenAddFeed}
            >
              +
            </GlassButton>
          </div>
          {cloudLoading ? (
            <p className="text-xs text-[color:var(--muted)]">云端同步中…</p>
          ) : null}
          {cloudError ? (
            <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-700 dark:text-rose-200">
              {cloudError}
            </p>
          ) : null}

          <nav className="flex flex-col gap-0.5">
            <button
              type="button"
              className={navButtonClass(allActive)}
              onClick={() => onNav({ kind: "all" })}
            >
              <span className="text-lg" aria-hidden>
                📄
              </span>
              <span className="min-w-0 flex-1 truncate">全部文章</span>
              <span className="shrink-0 rounded-full bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                {unreadTotal}
              </span>
            </button>
            <button
              type="button"
              className={navButtonClass(rlActive)}
              onClick={() => onNav({ kind: "read_later" })}
            >
              <span className="text-lg" aria-hidden>
                📋
              </span>
              <span className="min-w-0 flex-1 truncate">稍后阅读</span>
              <span className="shrink-0 rounded-full bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                {readLaterCount}
              </span>
            </button>
            <button
              type="button"
              className={navButtonClass(favActive)}
              onClick={() => onNav({ kind: "favorites" })}
            >
              <span className="text-lg" aria-hidden>
                ⭐
              </span>
              <span className="min-w-0 flex-1 truncate">收藏</span>
              <span className="shrink-0 rounded-full bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                {favoritesCount}
              </span>
            </button>
            <button
              type="button"
              className={navButtonClass(recActive)}
              onClick={() => onNav({ kind: "recent" })}
            >
              <span className="text-lg" aria-hidden>
                🕐
              </span>
              <span className="min-w-0 flex-1 truncate">最近阅读</span>
              <span className="shrink-0 rounded-full bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                {recentCount}
              </span>
            </button>
          </nav>
        </GlassPanel>

        <GlassPanel className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
            分类
          </p>
          <div className="flex gap-2">
            <GlassInput
              className="min-w-0 flex-1 text-sm"
              placeholder="新分类名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreateFolder();
              }}
            />
            <GlassButton type="button" className="shrink-0" onClick={onCreateFolder}>
              添加
            </GlassButton>
          </div>
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
            {folders.map((f) => {
              const active = nav.kind === "folder" && nav.folderId === f.id;
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-1 rounded-xl hover:bg-[color:var(--hover-row)]"
                >
                  <button
                    type="button"
                    className={cn(navButtonClass(active), "flex-1 border-0")}
                    onClick={() => onNav({ kind: "folder", folderId: f.id })}
                  >
                    <span aria-hidden>📁</span>
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  </button>
                  <GlassButton
                    type="button"
                    className="h-8 w-8 shrink-0 rounded-lg p-0 text-xs text-rose-600"
                    title="删除分类"
                    onClick={() => onDeleteFolder(f.id)}
                  >
                    ×
                  </GlassButton>
                </li>
              );
            })}
          </ul>
        </GlassPanel>

        <GlassPanel className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-0">
          <div className="border-b border-[color:var(--glass-border)] px-4 py-3 text-sm font-medium text-[color:var(--text)]">
            订阅源 ({feeds.length})
          </div>
          <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-3">
            {feeds.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-[color:var(--muted)]">
                暂无订阅，点击上方 + 添加
              </li>
            ) : (
              feeds.map((f) => {
                const active = nav.kind === "source" && nav.sourceId === f.id;
                const n = unreadByFeedId[f.id] ?? 0;
                return (
                  <li key={f.id} className="rounded-xl px-1 py-1">
                    <button
                      type="button"
                      className={navButtonClass(active)}
                      onClick={() => onNav({ kind: "source", sourceId: f.id })}
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        {f.title}
                      </span>
                      <span className="shrink-0 rounded-full bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                        {n}
                      </span>
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-2 px-2 pb-1">
                      <label className="sr-only" htmlFor={`folder-${f.id}`}>
                        分类
                      </label>
                      <select
                        id={`folder-${f.id}`}
                        className="glass-input min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs text-[color:var(--text)]"
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
                        className="h-8 shrink-0 rounded-lg px-2 text-xs text-rose-600"
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
        </GlassPanel>
      </aside>
    </>
  );
}
